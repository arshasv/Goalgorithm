/* Team Leader Dashboard */

Router.register('team-dashboard', async () => {
  const main = document.getElementById('page-content');

  if (!Auth.isTeamLeader()) {
    main.innerHTML = '<div class="empty-state"><div class="empty-icon">🔒</div><h2 class="empty-title">Access Denied</h2><p class="empty-desc">This page is for team leaders only.</p></div>';
    return;
  }

  main.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Team Dashboard</h1>
        <p class="page-subtitle">Manage your team, predictions, and view results</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="refreshTeamDashboard()">🔄 Refresh</button>
      </div>
    </div>
    <div id="td-stats-container">
      <div class="grid-3" style="margin-bottom:var(--space-xl)">
        <div class="card stat-card">
          <div class="stat-label">Team Rank</div>
          <div class="stat-value" id="td-stat-rank" style="font-family:var(--font-score);font-size:var(--text-4xl)"><div class="skeleton skeleton-text" style="width:60%"></div></div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">Total Score</div>
          <div class="stat-value" id="td-stat-score" style="font-family:var(--font-score);font-size:var(--text-4xl)"><div class="skeleton skeleton-text" style="width:40%"></div></div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">Predictions</div>
          <div class="stat-value" id="td-stat-preds" style="font-family:var(--font-score);font-size:var(--text-4xl)"><div class="skeleton skeleton-text" style="width:30%"></div></div>
        </div>
      </div>
    </div>
    <div id="td-content">
      <div class="tabs" style="margin-bottom:var(--space-lg)">
        <button class="tab-btn active" onclick="switchTDTab('profile', this)">Team Profile</button>
        <button class="tab-btn" onclick="switchTDTab('members', this)">Members</button>
        <button class="tab-btn" onclick="switchTDTab('predictions', this)">My Predictions</button>
        <button class="tab-btn" onclick="switchTDTab('scores', this)">Match Scores</button>
      </div>
      <div id="td-tab-content"></div>
    </div>
  `;

  await loadTeamDashboard();
});

let _tdTeam = null;
let _tdLeaderboard = [];
let _tdPredictions = [];

async function loadTeamDashboard() {
  if (!document.getElementById('td-content')) return;

  try {
    const team = await TeamService.getMyTeam();
    _tdTeam = team;
    _tdLeaderboard = await LeaderboardService.get().catch(() => []);
    if (DEMO_MODE && !_tdLeaderboard.length) {
      _tdLeaderboard = MockData.leaderboard;
    }

    const isMyEntry = (e) => {
      if (!team) return false;
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const tcode = [team.team_id, team.code].find(v => v && !UUID_RE.test(v)) || '';
      const ecode = [e.team_code, e.team_id].find(v => v && !UUID_RE.test(v)) || '';
      return (e.team_id === team.id) || (ecode && tcode && ecode.toUpperCase() === tcode.toUpperCase());
    };

    const myRank = _tdLeaderboard.findIndex(isMyEntry) + 1;
    const myEntry = _tdLeaderboard.find(isMyEntry);

    const isMyPrediction = (p) => {
      if (!team) return false;
      const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      const tcode = [team.team_id, team.code].find(v => v && !UUID_RE.test(v)) || '';
      const pcode = [p.team_code, p.team_id].find(v => v && !UUID_RE.test(v)) || '';
      return (p.team_id === team.id) || (pcode && tcode && pcode.toUpperCase() === tcode.toUpperCase());
    };

    const allPreds = await PredictionService.list().catch(() => []);
    _tdPredictions = allPreds.filter(isMyPrediction);
    if (DEMO_MODE && !_tdPredictions.length) {
      _tdPredictions = MockData.predictions.filter(isMyPrediction);
    }

    const rankEl = document.getElementById('td-stat-rank');
    if (rankEl) rankEl.textContent = myRank > 0 ? `#${myRank}` : 'Not yet calculated';

    const scoreEl = document.getElementById('td-stat-score');
    if (scoreEl) scoreEl.textContent = myEntry ? Utils.fmt1(myEntry.final_score) : '—';

    const predsEl = document.getElementById('td-stat-preds');
    if (predsEl) predsEl.textContent = _tdPredictions.length;

    const tabPreds = document.querySelector('.tab-btn:nth-child(3)');
    if (tabPreds) tabPreds.textContent = `My Predictions (${_tdPredictions.length})`;

    switchTDTab('profile');
    animateCounters(document.getElementById('td-stats-container'));
    Utils.staggerChildren('.grid-3');

  } catch(err) {
    const rankEl = document.getElementById('td-stat-rank');
    if (rankEl) rankEl.textContent = 'Rank --';

    const scoreEl = document.getElementById('td-stat-score');
    if (scoreEl) scoreEl.textContent = 'Score 0';

    const predsEl = document.getElementById('td-stat-preds');
    if (predsEl) predsEl.textContent = 'Predictions 0';

    const tabPreds = document.querySelector('.tab-btn:nth-child(3)');
    if (tabPreds) tabPreds.textContent = 'My Predictions';
    
    const tc = document.getElementById('td-tab-content');
    if (tc) switchTDTab('profile');
    
    Toast.error('Failed to load dashboard: ' + err.message);
  }
}

function switchTDTab(tab, btn) {
  document.querySelectorAll('.tabs .tab-btn').forEach(b => b.classList.remove('active'));
  if (btn) btn.classList.add('active');

  const tc = document.getElementById('td-tab-content');
  if (!tc) return;

  if (tab === 'profile') renderTDProfile(tc);
  else if (tab === 'members') renderTDMembers(tc);
  else if (tab === 'predictions') renderTDPredictions(tc);
  else if (tab === 'scores') renderTDScores(tc);
}

function renderTDProfile(container) {
  if (!_tdTeam) {
    container.innerHTML = '<p class="empty-desc">No team data available.</p>';
    return;
  }
  container.innerHTML = `
    <div class="card" style="max-width:600px">
      <div class="card-header">
        <div class="card-title">${Utils.teamBadge(_tdTeam.name, 40)} ${Utils.formatTeamDisplay(_tdTeam)}</div>
      </div>
      <div style="padding:var(--space-lg);display:flex;flex-direction:column;gap:var(--space-md)">
        <div>
          <span style="display:block;font-size:var(--text-sm);color:var(--color-text-muted)">Team Code</span>
          <span style="font-family:var(--font-data);font-size:var(--text-base)">${_tdTeam.team_id || _tdTeam.code || '—'}</span>
        </div>
        <div>
          <span style="display:block;font-size:var(--text-sm);color:var(--color-text-muted)">Team Name</span>
          <span style="font-size:var(--text-base)">${_tdTeam.name || '—'}</span>
        </div>
        <div>
          <span style="display:block;font-size:var(--text-sm);color:var(--color-text-muted)">Team Leader</span>
          <span style="font-size:var(--text-base)">${_tdTeam.team_leader_name || '—'}</span>
        </div>
        <div>
          <span style="display:block;font-size:var(--text-sm);color:var(--color-text-muted)">Status</span>
          <span class="badge ${_tdTeam.is_active ? 'badge-success' : 'badge-error'}">${_tdTeam.is_active ? 'Active' : 'Inactive'}</span>
        </div>
      </div>
    </div>
  `;
}

async function saveTeamProfile() {
  Toast.error('Editing team profile is restricted to organizers.');
}

function renderTDMembers(container) {
  if (!_tdTeam) {
    container.innerHTML = '<p class="empty-desc">No team data available.</p>';
    return;
  }
  const members = _tdTeam.members || [];
  const isCsvManaged = _tdTeam.is_csv_managed || false;
  const canManage = Auth.isOrganizer() && !isCsvManaged;

  let rows = members.map((m, i) => `
    <tr>
      <td>${m.name}</td>
      <td>${m.employee_id || '—'}</td>
      ${canManage ? `<td><button class="btn btn-danger btn-sm" onclick="removeMember('${m.id}')">Remove</button></td>` : ''}
    </tr>
  `).join('');

  container.innerHTML = `
    <div class="card">
      <div class="card-header">
        <div class="card-title">Team Members ${isCsvManaged ? '<span class="badge badge-info" style="margin-left:var(--space-sm)">CSV Managed</span>' : ''}</div>
        ${canManage ? '<button class="btn btn-primary btn-sm" onclick="showAddMemberForm()">+ Add Member</button>' : ''}
      </div>
      <div class="table-wrapper" style="margin:var(--space-md)">
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Employee ID</th>
              ${canManage ? '<th></th>' : ''}
            </tr>
          </thead>
          <tbody>${rows || `<tr><td colspan="${canManage ? 3 : 2}" style="text-align:center;color:var(--color-text-muted)">No members added yet</td></tr>`}</tbody>
        </table>
      </div>
    </div>
    <div id="add-member-form" style="display:none;margin-top:var(--space-md)">
      <style>
        .input-error { border-color: var(--color-status-error) !important; }
        .input-valid { border-color: var(--color-status-success) !important; }
        .field-error { font-size: var(--text-xs); color: var(--color-status-error); margin-top: 4px; display: none; }
      </style>
    </div>
  `;
}

const ALLOWED_EMAIL_DOMAINS = ['gmail.com', 'opentrends.com', 'opentrends.net', 'fifa-scoring.com'];

function validateEmailDomain(email) {
  if (!email) return null;
  const domain = email.trim().toLowerCase().split('@').pop() || '';
  if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
    return 'Only Gmail, OpenTrends, and GOALGORITHM emails are allowed';
  }
  return null;
}

function validateMemberEmail() {
  const input = document.getElementById('am-email');
  const errEl = document.getElementById('am-email-error');
  const btn = document.getElementById('am-submit-btn');
  const email = input.value.trim();
  const error = email ? validateEmailDomain(email) : null;
  if (error) {
    errEl.textContent = error;
    errEl.style.display = 'block';
    input.classList.add('input-error');
    input.classList.remove('input-valid');
    if (btn) btn.disabled = true;
  } else {
    errEl.style.display = 'none';
    input.classList.remove('input-error');
    if (email) input.classList.add('input-valid');
    else input.classList.remove('input-valid');
    if (btn) btn.disabled = false;
  }
}

function showAddMemberForm() {
   const el = document.getElementById('add-member-form');
   if (!el) return;
   el.style.display = 'block';
   el.innerHTML = `
     <div class="card" style="max-width:500px">
       <div class="card-header"><div class="card-title">Add Team Member</div></div>
       <div style="padding:var(--space-lg)">
         <div class="form-group"><label class="form-label">Name *</label><input class="form-input" id="am-name" placeholder="Full name"></div>
         <div class="form-group"><label class="form-label">Employee ID</label><input class="form-input" id="am-employee-id" placeholder="Employee ID (optional)"></div>
         <button class="btn btn-primary" id="am-submit-btn" onclick="submitAddMember()">Add Member</button>
         <button class="btn btn-ghost" onclick="document.getElementById('add-member-form').style.display='none'">Cancel</button>
       </div>
     </div>
   `;
 }

async function submitAddMember() {
   const name = document.getElementById('am-name')?.value.trim();
   if (!name) { Toast.error('Name is required'); return; }
   try {
     const member = await TeamService.addMember({
       name,
       employee_id: document.getElementById('am-employee-id')?.value.trim() || null,
     });
     Toast.success(`Added ${member.name}`);
     document.getElementById('add-member-form').style.display = 'none';
     await loadTeamDashboard();
   } catch(err) {
     Toast.error(err.message || 'Failed to add member');
   }
 }

async function removeMember(id) {
  Modal.confirm('Remove this team member?', async () => {
    try {
      await TeamService.removeMember(id);
      Toast.success('Member removed');
      await loadTeamDashboard();
    } catch(err) {
      Toast.error(err.message || 'Failed to remove member');
    }
  });
}

function renderTDPredictions(container) {
  const preds = _tdPredictions || [];
  if (!preds.length) {
    container.innerHTML = '<div class="empty-state" style="padding:var(--space-2xl)"><div class="empty-icon">📋</div><h3 class="empty-title">No Predictions Yet</h3><p class="empty-desc">Submit predictions from the Match Results page.</p><a class="btn btn-primary" style="margin-top:var(--space-md)" onclick="Router.navigate(\'matches\')">View Matches</a></div>';
    return;
  }

  container.innerHTML = `
    <div class="card">
      <div class="card-header"><span class="card-title">📋 My Predictions</span></div>
      <div class="table-wrapper" style="margin:var(--space-md)">
        <table>
          <thead><tr>
            <th>Match</th>
            <th>Predicted Winner</th>
            <th>Scoreline</th>
            <th>Status</th>
            <th>Submitted</th>
          </tr></thead>
          <tbody>${preds.map((p, i) => {
            const mp = p.match_prediction || p;
            const winner = mp.predicted_winner || '—';
            const homeG = mp.predicted_scoreline?.home_team_goals ?? '?';
            const awayG = mp.predicted_scoreline?.away_team_goals ?? '?';
            const status = p.status || 'submitted';
            const date = p.submitted_at ? new Date(p.submitted_at).toLocaleString() : '—';
            const statusClass = status === 'VALIDATED' || status === 'scored' ? 'badge-success' : status === 'INVALID' ? 'badge-error' : 'badge-warning';
            return `<tr style="animation:fadeIn ${300 + i * 60}ms ease-out both">
              <td style="font-family:var(--font-data);font-size:var(--text-xs)">${p.match_id || '—'}</td>
              <td style="text-transform:capitalize">${winner}</td>
              <td style="font-family:var(--font-score);font-weight:600">${homeG}–${awayG}</td>
              <td><span class="badge ${statusClass}">${status.replace('_', ' ')}</span></td>
              <td style="font-size:var(--text-xs);color:var(--color-text-muted)">${date}</td>
            </tr>`;
          }).join('')}</tbody>
        </table>
      </div>
    </div>`;
}

async function renderTDScores(container) {
  let matchBreakdown;
  try {
    matchBreakdown = await ScoresService.getMatchBreakdown();
  } catch (_) {}
  if (DEMO_MODE && (!matchBreakdown || !matchBreakdown.length)) {
    matchBreakdown = MockData.matchBreakdown || [];
  }

  const myTeamId = _tdTeam?.id;
  const myScores = (matchBreakdown || []).flatMap(m =>
    (m.teams || []).filter(t => t.team_id === myTeamId).map(t => ({ match: m, score: t }))
  );

  const myEntry = _tdLeaderboard?.find(e => e.team_id === myTeamId);

  if (!myScores.length && !myEntry) {
    container.innerHTML = '<div class="empty-state" style="padding:var(--space-2xl)"><div class="empty-icon">🏆</div><h3 class="empty-title">No Scores Yet</h3><p class="empty-desc">Scores will appear once matches are scored.</p><a class="btn btn-primary" style="margin-top:var(--space-md)" onclick="Router.navigate(\'leaderboard\')">View Leaderboard</a></div>';
    return;
  }

  let html = '';
  if (myEntry) {
    const rankClass = myEntry.rank <= 3 ? `rank-${myEntry.rank}` : '';
    html += `
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header"><span class="card-title">🏆 Overall Standings</span></div>
        <div class="table-wrapper" style="margin:var(--space-md)">
          <table>
            <thead><tr><th>Rank</th><th>Phase 1</th><th>Technical</th><th>Presentation</th><th>Final Score</th></tr></thead>
            <tbody>
              <tr class="${rankClass}">
                <td>${Utils.rankBadge(myEntry.rank)}</td>
                <td><span class="score-num">${Utils.fmt1(myEntry.phase1_score)}/60</span></td>
                <td><span class="score-num">${Utils.fmt1(myEntry.technical_score)}/20</span></td>
                <td><span class="score-num">${Utils.fmt1(myEntry.presentation_score)}/20</span></td>
                <td><strong class="score-num" style="font-size:var(--text-lg)">${Utils.fmt1(myEntry.final_score)}</strong></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>`;
  }

  if (myScores.length) {
    html += `<div class="card">
      <div class="card-header"><span class="card-title">⚽ Match-wise Scores</span></div>
      <div style="padding:var(--space-md)">${myScores.map(({ match, score }) => {
        const sc = score.score_breakdown || {};
        return `<div class="card" style="margin-bottom:var(--space-sm);padding:var(--space-md);background:var(--color-surface-secondary)">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-sm)">
            <span style="font-weight:600">Match ${match.match_number}</span>
            <span class="badge badge-info">${match.home_team_name} vs ${match.away_team_name}</span>
          </div>
          <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:var(--space-sm);text-align:center">
            <div><div style="font-size:var(--text-xs);color:var(--color-text-muted)">Winner</div><div class="score-digit">${sc.winner_points ?? '—'}/5</div></div>
            <div><div style="font-size:var(--text-xs);color:var(--color-text-muted)">Scoreline</div><div class="score-digit">${sc.scoreline_points ?? '—'}/10</div></div>
            <div><div style="font-size:var(--text-xs);color:var(--color-text-muted)">Probability</div><div class="score-digit">${sc.probability_points ?? '—'}/5</div></div>
            <div><div style="font-size:var(--text-xs);color:var(--color-text-muted)">Player</div><div class="score-digit">${sc.player_points ?? '—'}/5</div></div>
            <div><div style="font-size:var(--text-xs);color:var(--color-text-muted)">Base Score</div><div class="score-digit" style="font-weight:700">${sc.base_score ?? '—'}/25</div></div>
          </div>
        </div>`;
      }).join('')}</div>
    </div>`;
  }

  container.innerHTML = html;
}

function refreshTeamDashboard() {
  loadTeamDashboard();
}
