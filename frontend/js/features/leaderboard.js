/* Leaderboard Page — real API with fallback */

Router.register('leaderboard', async () => {
  const main = document.getElementById('page-content');

  main.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Leaderboard</h1>
        <p class="page-subtitle">Team rankings and phase scores</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="loadLeaderboard()">🔄 Refresh</button>
        ${Auth.isOrganizer() ? '<button class="btn btn-primary" onclick="showCalcLeaderboard()">⚡ Calculate</button>' : ''}
      </div>
    </div>
    <div id="lb-content">${Utils.skeletonCards(4)}</div>
  `;

  await loadLeaderboard();
});

async function loadLeaderboard() {
  const container = document.getElementById('lb-content');
  if (!container) return;

  try {
    let leaderboard = await LeaderboardService.get();
    let teams = await TeamService.listTeams().catch(() => []);

    if (DEMO_MODE) {
      if (!leaderboard.length) leaderboard = MockData.leaderboard;
      if (teams.length === 0) teams = MockData.teams;
    }

    if (!leaderboard.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">🏆</div><h2 class="empty-title">No Leaderboard Data</h2><p class="empty-desc">${Auth.isOrganizer() ? 'Calculate the leaderboard from the Scoring Engine page.' : 'Leaderboard data will appear once the organizer calculates it.'}</p></div>`;
      return;
    }

    const topScore = leaderboard[0]?.final_score || 0;
    const entriesWithTeams = leaderboard.map(e => {
      const team = teams.find(t => t.id === e.team_id);
      return { ...e, team_name: team?.name || '—', team_code: team?.team_id || team?.code || '' };
    });

    container.innerHTML = `
      <div class="grid-3" style="margin-bottom:var(--space-xl)">
        <div class="card stat-card">
          <div class="stat-label">Total Teams</div>
          <div class="stat-value" data-count-to="${leaderboard.length}" data-count-dec="0" style="font-family:var(--font-score);font-size:var(--text-4xl)">0</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">Top Score</div>
          <div class="stat-value" data-count-to="${topScore}" style="font-family:var(--font-score);font-size:var(--text-4xl)">0</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">Top Team</div>
          <div class="stat-value" style="font-family:var(--font-display);font-size:var(--text-xl)">${entriesWithTeams[0] ? `Team ${entriesWithTeams[0].team_code} — ${entriesWithTeams[0].team_name}` : '—'}</div>
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
              ${entriesWithTeams.map(e => {
                const rankClass = e.rank <= 3 ? `rank-${e.rank}` : '';
                return `
                  <tr class="${rankClass}" style="cursor:pointer" onclick="showLBDetail('${e.team_id}')">
                    <td>${e.rank}</td>
                    <td><strong>Team ${e.team_code} — ${e.team_name}</strong></td>
                    <td><span class="score-num ${Utils.scoreColor(e.phase1_score, 60)}">${Utils.fmt1(e.phase1_score)}</span></td>
                    <td><span class="score-num ${Utils.scoreColor(e.technical_score, 20)}">${Utils.fmt1(e.technical_score)}</span></td>
                    <td><span class="score-num ${Utils.scoreColor(e.presentation_score, 20)}">${Utils.fmt1(e.presentation_score)}</span></td>
                    <td><strong class="score-num" style="font-size:var(--text-lg)">${Utils.fmt1(e.final_score)}</strong></td>
                    <td>${Utils.rankBadge(e.rank)}</td>
                  </tr>
                `;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    animateCounters(container);

  } catch(err) {
    container.innerHTML = `<div class="alert alert-error">Failed to load leaderboard: ${err.message}</div>`;
  }
}

function showCalcLeaderboard() {
  Modal.confirm('Calculate leaderboard from all current scores?', async () => {
    try {
      const teams = await TeamService.listTeams();
      const entries = teams.map(t => ({
        team_id: t.id,
        phase1_score: 0,
        technical_score: 0,
        presentation_score: 0
      }));
      const result = await LeaderboardService.calculate(entries);
      Toast.success('Leaderboard calculated');
      await loadLeaderboard();
    } catch(err) {
      Toast.error(err.message || 'Failed to calculate leaderboard');
    }
  });
}

function showLBDetail(teamId) {
  Toast.info('Team detail view coming soon');
}
