/* Organizer Dashboard */

Router.register('dashboard', async () => {
  const main = document.getElementById('page-content');

  if (!Auth.isOrganizer()) {
    Router.navigate('team-dashboard');
    return;
  }

  main.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Organizer Dashboard</h1>
        <p class="page-subtitle">Tournament overview, team stats, and quick actions</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="loadOrgDashboard()">🔄 Refresh</button>
      </div>
    </div>
    <div id="org-dash-content">${Utils.skeletonCards(4)}</div>
  `;

  await loadOrgDashboard();
});

async function loadOrgDashboard() {
  const container = document.getElementById('org-dash-content');
  if (!container) return;

  try {
    let [teams, leaderboard, predictions] = await Promise.all([
      TeamService.listTeams().catch(() => []),
      LeaderboardService.get().catch(() => []),
      PredictionService.list().catch(() => [])
    ]);

    if (DEMO_MODE) {
      if (teams.length === 0) teams = MockData.teams;
      if (leaderboard.length === 0) leaderboard = MockData.leaderboard;
      if (predictions.length === 0) predictions = MockData.predictions;
    }

    const totalTeams = teams.length;
    const totalPredictions = predictions.length;
    const topScore = leaderboard.length > 0 ? leaderboard[0].final_score : 0;
    const completedTeams = leaderboard.filter(e => e.final_score > 0).length;

    container.innerHTML = `
      <div class="grid-4" style="margin-bottom:var(--space-xl)">
        <div class="card stat-card">
          <div class="stat-label">Registered Teams</div>
          <div class="stat-value" data-count-to="${totalTeams}" data-count-dec="0" style="font-family:var(--font-score);font-size:var(--text-4xl)">0</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">Total Predictions</div>
          <div class="stat-value" data-count-to="${totalPredictions}" data-count-dec="0" style="font-family:var(--font-score);font-size:var(--text-4xl)">0</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">Top Score</div>
          <div class="stat-value" data-count-to="${topScore}" style="font-family:var(--font-score);font-size:var(--text-4xl)">0</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">Scored Teams</div>
          <div class="stat-value" data-count-to="${completedTeams}" data-count-dec="0" style="font-family:var(--font-score);font-size:var(--text-4xl)">0</div>
        </div>
      </div>

      <div class="grid-2" style="margin-bottom:var(--space-xl)">
        <div class="card">
          <div class="card-header">
            <div class="card-title">🏆 Leaderboard Top 5</div>
            <a class="btn btn-ghost btn-sm" onclick="Router.navigate('leaderboard')">View All</a>
          </div>
          ${leaderboard.length === 0
            ? '<div style="padding:var(--space-lg);text-align:center;color:var(--color-text-muted)">No leaderboard data yet</div>'
            : `<div class="table-wrapper"><table>
                <thead><tr><th>Rank</th><th>Team</th><th>Score</th></tr></thead>
                <tbody>${leaderboard.slice(0, 5).map(e => {
                  return `<tr>
                    <td>${Utils.rankBadge(e.rank)}</td>
                    <td>${Utils.formatTeamDisplay(e)}</td>
                    <td><strong>${Utils.fmt1(e.final_score)}</strong></td>
                  </tr>`;
                }).join('')}</tbody>
              </table></div>`
          }
        </div>

        <div class="card">
          <div class="card-header">
            <div class="card-title">👥 Recent Teams</div>
            <a class="btn btn-ghost btn-sm" onclick="Router.navigate('teams')">View All</a>
          </div>
          ${teams.length === 0
            ? '<div style="padding:var(--space-lg);text-align:center;color:var(--color-text-muted)">No teams registered</div>'
            : `<div style="padding:var(--space-md)">
                ${teams.slice(0, 5).map(t => `
                  <div class="activity-item" style="display:flex;justify-content:space-between;align-items:center;padding:var(--space-sm) 0">
                    <span>${Utils.teamBadge(t.name, 32)} ${Utils.formatTeamDisplay(t)}</span>
                  </div>
                `).join('')}
              </div>`
          }
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">⚡ Quick Actions</div>
        </div>
        <div style="padding:var(--space-md);display:flex;gap:var(--space-sm);flex-wrap:wrap">
          <button class="btn btn-primary" onclick="Router.navigate('matches')">Manage Matches</button>
          <button class="btn btn-primary" onclick="Router.navigate('technical')">Technical Evaluation</button>
          <button class="btn btn-primary" onclick="Router.navigate('presentation')">Presentation Evaluation</button>
          <button class="btn btn-primary" onclick="Router.navigate('leaderboard')">View Leaderboard</button>
        </div>
      </div>
    `;

    animateCounters(container);
    Utils.staggerChildren('.grid-4');

  } catch(err) {
    container.innerHTML = `<div class="alert alert-error">Failed to load dashboard: ${err.message}</div>`;
  }
}
