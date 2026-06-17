/* Final Scores Dashboard — aggregated scores, match breakdown, evaluations */

Router.register('match-results', async () => {
  const main = document.getElementById('page-content');
  const isOrg = Auth.isOrganizer();

  const evalTabLabel = isOrg ? 'All Evaluations' : 'My Evaluations';
  const evalTabId = 'fs-evaluations';

  main.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Final Scores</h1>
        <p class="page-subtitle">Complete tournament scoring dashboard</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="window._refreshFinalScores()">🔄 Refresh</button>
      </div>
    </div>
    <div class="tabs" style="margin-bottom:var(--space-lg)">
      <button class="tab-btn active" data-fs-tab="daily" onclick="switchFSTab('daily', this)">Daily Scores</button>
      <button class="tab-btn" data-fs-tab="matches" onclick="switchFSTab('matches', this)">Match Breakdown</button>
      <button class="tab-btn" data-fs-tab="leaderboard" onclick="switchFSTab('leaderboard', this)">Leaderboard</button>
      <button class="tab-btn" data-fs-tab="evaluations" onclick="switchFSTab('evaluations', this)">${evalTabLabel}</button>
    </div>
    <div id="fs-tab-content">${Utils.skeletonCards(4)}</div>
  `;

  window._refreshFinalScores = () => loadFSTab('daily');
  await loadFSTab('daily');
});

async function loadFSTab(tab) {
  const tc = document.getElementById('fs-tab-content');
  if (!tc) return;
  tc.innerHTML = Utils.skeletonCards(3);
  try {
    if (tab === 'daily') await renderDailyScores(tc);
    else if (tab === 'matches') await renderMatchBreakdown(tc);
    else if (tab === 'leaderboard') await renderFSLeaderboard(tc);
    else if (tab === 'evaluations') await renderEvaluations(tc);
  } catch (err) {
    tc.innerHTML = `<div class="alert alert-error">Failed to load: ${err.message}</div>`;
  }
}

function switchFSTab(tab, btn) {
  document.querySelectorAll('[data-fs-tab]').forEach(el => el.classList.remove('active'));
  if (btn) btn.classList.add('active');
  loadFSTab(tab);
}

/* ── Tab 1: Daily Scores ── */

async function renderDailyScores(container) {
  let dailyScores;
  try {
    dailyScores = await ScoresService.getDaily();
  } catch (_) {}

  if (DEMO_MODE && (!dailyScores || !dailyScores.length)) {
    dailyScores = MockData.dailyScores || generateMockDailyScores();
  }

  if (!dailyScores || !dailyScores.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📊</div><h2 class="empty-title">No Daily Scores Yet</h2><p class="empty-desc">Scores will appear here once match scoring is complete.</p></div>`;
    return;
  }

  container.innerHTML = dailyScores.map(day => `
    <div class="card" style="margin-bottom:var(--space-lg);animation:fadeInUp 0.3s ease-out">
      <div class="card-header">
        <span class="card-title">${Utils.dateStr(day.date)}</span>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Daily Score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${day.teams.map(t => {
              const rankClass = t.rank <= 3 ? `rank-${t.rank}` : '';
              return `<tr class="${rankClass}">
                <td>${t.rank}</td>
                <td><strong>${Utils.formatTeamDisplay({team_id: t.team_code, name: t.team_name})}</strong></td>
                <td><span class="score-num ${Utils.scoreColor(t.total_score, 75)}">${Utils.fmt1(t.total_score)}</span></td>
                <td>${Utils.rankBadge(t.rank)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `).join('');

  animateCounters(container);
}

function generateMockDailyScores() {
  const teams = MockData.teams.filter(t => t.is_active !== false);
  const days = [
    { date: '2026-06-10', label: 'Jun 10' },
    { date: '2026-06-08', label: 'Jun 8' },
  ];
  return days.map(day => {
    const entries = teams.map((t, i) => ({
      team_code: t.team_id || t.code || '',
      team_name: t.name,
      total_score: Math.round((85 - i * 7 + Math.random() * 10) * 10) / 10,
    }));
    entries.sort((a, b) => b.total_score - a.total_score);
    entries.forEach((e, i) => e.rank = i + 1);
    return { date: day.date, teams: entries };
  });
}

/* ── Tab 2: Match Breakdown ── */

async function renderMatchBreakdown(container) {
  let breakdown;
  try {
    breakdown = await ScoresService.getMatchBreakdown();
  } catch (_) {}

  if (DEMO_MODE && (!breakdown || !breakdown.length)) {
    breakdown = MockData.matchBreakdown || generateMockMatchBreakdown();
  }

  if (!breakdown || !breakdown.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">⚽</div><h2 class="empty-title">No Match Scores Yet</h2><p class="empty-desc">Match breakdowns will appear once scoring begins.</p></div>`;
    return;
  }

  container.innerHTML = breakdown.map((match, mi) => {
    const actual = match.actual_result || {};
    const scoreline = actual.actual_home_goals != null
      ? `${actual.actual_home_goals}–${actual.actual_away_goals}`
      : '—';

    return `
      <div class="card" style="margin-bottom:var(--space-lg);animation:fadeInUp ${300 + mi * 100}ms ease-out both">
        <div class="card-header">
          <span class="card-title">Match ${match.match_number} — ${match.home_team_name} vs ${match.away_team_name}</span>
          <span style="font-family:var(--font-score);font-size:var(--text-xl);color:var(--color-accent)">${scoreline}</span>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Team</th>
                <th>Prediction</th>
                <th>Winner</th>
                <th>Scoreline</th>
                <th>Probability</th>
                <th>Player</th>
                <th>Base Score</th>
              </tr>
            </thead>
            <tbody>
              ${(match.teams || []).map(t => {
                const sc = t.score_breakdown || {};
                const pred = t.prediction || {};
                const predStr = pred.predicted_home_goals != null
                  ? `${pred.predicted_home_goals}–${pred.predicted_away_goals}`
                  : '—';
                return `<tr>
                <td><strong>${Utils.formatTeamDisplay({team_id: t.team_code, name: t.team_name})}</strong></td>

  
                  <td>${predStr}</td>
                  <td><span class="${sc.winner_points === 5 ? 'badge badge-success' : 'badge badge-error'}">${sc.winner_points ?? '—'}/5</span></td>
                  <td><span class="${sc.scoreline_points === 10 ? 'badge badge-success' : sc.scoreline_points === 5 ? 'badge badge-warning' : 'badge badge-error'}">${sc.scoreline_points ?? '—'}/10</span></td>
                  <td><span class="${sc.probability_points === 5 ? 'badge badge-success' : 'badge badge-error'}">${sc.probability_points ?? '—'}/5</span></td>
                  <td><span class="${sc.player_points === 5 ? 'badge badge-success' : sc.player_points >= 2 ? 'badge badge-warning' : 'badge badge-error'}">${sc.player_points ?? '—'}/5</span></td>
                  <td><strong class="score-num ${Utils.scoreColor(sc.base_score, 25)}">${Utils.fmt1(sc.base_score)}</strong></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
        ${match.teams && match.teams.length === 0 ? '<div style="padding:var(--space-md);color:var(--color-text-secondary);font-style:italic">No scores recorded for this match yet.</div>' : ''}
      </div>
    `;
  }).join('');

  animateCounters(container);
}

function generateMockMatchBreakdown() {
  const teams = MockData.teams.filter(t => t.is_active !== false);
  return MockData.matches.filter(m => m.status === 'scored' || m.status === 'completed').map((m, mi) => ({
    match_id: m.id,
    match_number: parseInt(m.id.replace('M', '')),
    home_team_name: m.home,
    away_team_name: m.away,
    scheduled_at: '2026-06-' + String(10 - mi * 2).padStart(2, '0') + 'T18:00:00',
    status: m.status,
    actual_result: m.homeGoals != null ? {
      actual_winner: m.homeGoals > m.awayGoals ? 'home' : m.homeGoals < m.awayGoals ? 'away' : 'draw',
      actual_home_goals: m.homeGoals,
      actual_away_goals: m.awayGoals,
    } : null,
    teams: teams.map((t, ti) => {
      const baseVals = [
        { w: 5, sl: 10, pr: 5, pl: 5, bs: 25 },
        { w: 5, sl: 5, pr: 0, pl: 5, bs: 15 },
        { w: 0, sl: 5, pr: 5, pl: 0, bs: 10 },
        { w: 5, sl: 0, pr: 0, pl: 5, bs: 10 },
        { w: 0, sl: 0, pr: 0, pl: 0, bs: 0 },
      ];
      const v = baseVals[ti % baseVals.length];
      return {
        team_id: t.id,
        team_code: t.team_id || t.code || '',
        team_name: t.name,
        prediction: {
          predicted_winner: v.w === 5 ? 'home' : v.w === 0 ? 'away' : 'draw',
          predicted_home_goals: m.homeGoals != null ? m.homeGoals : 1,
          predicted_away_goals: m.awayGoals != null ? m.awayGoals : 1,
        },
        score_breakdown: {
          winner_points: v.w,
          scoreline_points: v.sl,
          probability_points: v.pr,
          player_points: v.pl,
          base_score: v.bs,
          earned_points: v.bs,
        },
      };
    }),
  }));
}

/* ── Tab 3: Leaderboard (reuse existing data) ── */

async function renderFSLeaderboard(container) {
  let leaderboard;
  let teams;
  try {
    [leaderboard, teams] = await Promise.all([
      LeaderboardService.get().catch(() => []),
      TeamService.listTeams().catch(() => []),
    ]);
  } catch (_) { leaderboard = []; teams = []; }

  if (DEMO_MODE) {
    if (!leaderboard.length) leaderboard = MockData.leaderboard;
    if (!teams.length) teams = MockData.teams;
  }

  if (!leaderboard.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><h2 class="empty-title">No Leaderboard Data</h2><p class="empty-desc">The leaderboard will be generated after scoring is complete.</p></div>`;
    return;
  }

  const topScore = leaderboard[0]?.final_score || 0;

  container.innerHTML = `
    <div class="grid-3" style="margin-bottom:var(--space-xl)">
      <div class="card stat-card">
        <div class="stat-label">Total Teams</div>
        <div class="stat-value" data-count-to="${leaderboard.length}" data-count-dec="0">0</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Top Score</div>
        <div class="stat-value" data-count-to="${topScore}">0</div>
      </div>
      <div class="card stat-card">
        <div class="stat-label">Top Team</div>
        <div class="stat-value" style="font-size:var(--text-lg)">${leaderboard[0] ? Utils.formatTeamDisplay(leaderboard[0]) : '—'}</div>
      </div>
    </div>
    <div class="card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Rank</th>
              <th>Team</th>
              <th>Phase 1</th>
              <th>Technical</th>
              <th>Presentation</th>
              <th>Final Score</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            ${leaderboard.map(e => {
              const rankClass = e.rank <= 3 ? `rank-${e.rank}` : '';
              return `<tr class="${rankClass}">
                <td>${e.rank}</td>
                <td><strong>${Utils.formatTeamDisplay(e)}</strong></td>
                <td><span class="score-num ${Utils.scoreColor(e.phase1_score, 60)}">${Utils.fmt1(e.phase1_score)}</span></td>
                <td><span class="score-num ${Utils.scoreColor(e.technical_score, 20)}">${Utils.fmt1(e.technical_score)}</span></td>
                <td><span class="score-num ${Utils.scoreColor(e.presentation_score, 20)}">${Utils.fmt1(e.presentation_score)}</span></td>
                <td><strong class="score-num" style="font-size:var(--text-lg)">${Utils.fmt1(e.final_score)}</strong></td>
                <td>${Utils.rankBadge(e.rank)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    </div>
  `;
  animateCounters(container);
}

/* ── Tab 4: Evaluations (private: own team for TL, all for organizer) ── */

async function _getCurrentTeamId() {
  try {
    const team = await TeamService.getMyTeam();
    return team?.id || null;
  } catch (_) {
    if (DEMO_MODE) return MockData.teams[0]?.id || null;
    return null;
  }
}

async function renderEvaluations(container) {
  let technicalEvals;
  let presentationEvals;
  try {
    [technicalEvals, presentationEvals] = await Promise.all([
      EvaluationService.getTechnical().catch(() => []),
      EvaluationService.getPresentation().catch(() => []),
    ]);
  } catch (_) { technicalEvals = []; presentationEvals = []; }

  const isOrg = Auth.isOrganizer();

  if (DEMO_MODE) {
    if (!technicalEvals.length) technicalEvals = MockData.technicalEvaluations || generateMockTechEvals();
    if (!presentationEvals.length) presentationEvals = MockData.presentationEvaluations || generateMockPresEvals();
  }

  /* Filter to only the current team's evaluations for team leaders */
  if (!isOrg) {
    const myTeamId = await _getCurrentTeamId();
    technicalEvals = technicalEvals.filter(e => e.team_id === myTeamId);
    presentationEvals = presentationEvals.filter(e => e.team_id === myTeamId);
  }

  if (!technicalEvals.length && !presentationEvals.length) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h2 class="empty-title">No Evaluations Yet</h2><p class="empty-desc">${isOrg ? 'Submit evaluations from the Technical and Presentation pages.' : 'Your evaluations will appear here once the organizer submits them.'}</p></div>`;
    return;
  }

  const allTeamIds = new Set();
  technicalEvals.forEach(e => allTeamIds.add(e.team_id));
  presentationEvals.forEach(e => allTeamIds.add(e.team_id));

  let html = '';

  for (const teamId of allTeamIds) {
    const tech = technicalEvals.find(e => e.team_id === teamId);
    const pres = presentationEvals.find(e => e.team_id === teamId);
    const teamObj = { team_code: tech?.team_code || pres?.team_code || '', team_name: tech?.team_name || pres?.team_name || '' };

    html += `
      <div class="card" style="margin-bottom:var(--space-lg);animation:fadeInUp 0.3s ease-out">
        <div class="card-header">
          <span class="card-title">${Utils.formatTeamDisplay(teamObj)}</span>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-lg)">
          ${tech ? renderTechCard(tech) : '<div class="alert alert-info">Technical evaluation not yet submitted.</div>'}
          ${pres ? renderPresCard(pres) : '<div class="alert alert-info">Presentation evaluation not yet submitted.</div>'}
        </div>
      </div>
    `;
  }

  if (!html) {
    container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h2 class="empty-title">No Evaluations Found</h2></div>`;
    return;
  }

  container.innerHTML = html;
  animateCounters(container);
}

function renderTechCard(tech) {
  const dims = [
    { label: 'Code Quality', score: tech.code_quality, max: 5 },
    { label: 'Backend Quality', score: tech.backend_quality, max: 5 },
    { label: 'Teamwork', score: tech.teamwork, max: 5 },
    { label: 'AI Explanation', score: tech.ai_explanation, max: 5 },
  ];
  return `
    <div class="score-breakdown-card">
      <div class="card-header"><strong class="card-title">🔧 Technical Evaluation</strong></div>
      ${dims.map(d => `
        <div class="dimension-row">
          <span class="dimension-label">${d.label}</span>
          <div class="dimension-bar-wrap"><div class="dimension-bar-fill" style="width:${(d.score / d.max) * 100}%"></div></div>
          <span class="dimension-score ${Utils.scoreColor(d.score, d.max)}">${d.score}/${d.max}</span>
        </div>
      `).join('')}
      <div class="score-total-row">
        <div>
          <div class="base-score-label">Total Score</div>
          <div class="base-score-value">${tech.total_score}<span style="color:var(--color-text-secondary);font-size:var(--text-lg)">/20</span></div>
        </div>
      </div>
    </div>
  `;
}

function renderPresCard(pres) {
  const dims = [
    { label: 'AI Explanation', score: pres.ai_explanation_score, max: 20 },
    { label: 'Q&A Score', score: pres.qa_score, max: 15 },
    { label: 'Delivery Score', score: pres.delivery_score, max: 15 },
  ];
  return `
    <div class="score-breakdown-card">
      <div class="card-header">
        <strong class="card-title">🎤 Presentation Evaluation</strong>
        ${pres.grade ? Utils.gradeBadge(pres.grade) : ''}
      </div>
      ${dims.map(d => `
        <div class="dimension-row">
          <span class="dimension-label">${d.label}</span>
          <div class="dimension-bar-wrap"><div class="dimension-bar-fill" style="width:${(d.score / d.max) * 100}%"></div></div>
          <span class="dimension-score ${Utils.scoreColor(d.score, d.max)}">${d.score}/${d.max}</span>
        </div>
      `).join('')}
      <div class="score-total-row">
        <div>
          <div class="base-score-label">Raw Total</div>
          <div class="base-score-value">${pres.raw_total}<span style="color:var(--color-text-secondary);font-size:var(--text-lg)">/50</span></div>
        </div>
        <div style="text-align:right">
          <div class="base-score-label">Final Score</div>
          <div class="earned-score score-digit">${Utils.fmt1(pres.presentation_score)}<span style="color:var(--color-text-secondary);font-size:var(--text-lg)">/20</span></div>
        </div>
      </div>
      ${pres.multiplier ? `<div style="margin-top:var(--space-sm);font-size:var(--text-xs);color:var(--color-text-secondary)">Rank #${pres.rank} · ${pres.grade} ×${pres.multiplier}</div>` : ''}
    </div>
  `;
}

function generateMockTechEvals() {
  return MockData.teams.filter(t => t.is_active !== false).map((t, i) => ({
    team_id: t.id,
    team_code: t.team_id || t.code || '',
    team_name: t.name,
    code_quality: Math.min(5, 3 + i),
    backend_quality: Math.min(5, 4 + (i % 2)),
    teamwork: Math.min(5, 3 + (i % 3)),
    ai_explanation: Math.min(5, 4 - (i % 2)),
    total_score: 18 - i * 1.5,
    submitted_at: '2026-06-11T10:00:00Z',
  }));
}

function generateMockPresEvals() {
  return MockData.teams.filter(t => t.is_active !== false).map((t, i) => ({
    team_id: t.id,
    team_code: t.team_id || t.code || '',
    team_name: t.name,
    ai_explanation_score: 18 - i * 2,
    qa_score: 13 - i,
    delivery_score: 13 - i,
    raw_total: 44 - i * 3,
    presentation_score: Math.round((17.5 - i * 1.5) * 10) / 10,
    rank: i + 1,
    grade: ['A', 'B', 'B', 'C', 'C'][i] || 'C',
    multiplier: [3, 2, 2, 1, 1][i] || 1,
    submitted_at: '2026-06-12T14:00:00Z',
  }));
}
