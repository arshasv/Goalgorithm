/* Predictions Log — real API with fallback */

Router.register('predictions', async () => {
  const main = document.getElementById('page-content');

  main.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">📋 Predictions Log</h1>
        <p class="page-subtitle">${Auth.isOrganizer() ? 'All team predictions across matches' : 'Your submitted predictions'}</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="loadPredictions()">🔄 Refresh</button>
      </div>
    </div>
    <div id="pred-log-content">${Utils.skeletonCards(3)}</div>
  `;

  await loadPredictions();
});

async function loadPredictions() {
  const container = document.getElementById('pred-log-content');
  if (!container) return;

  try {
    let predictions = await PredictionService.list();
    let teams = await TeamService.listTeams().catch(() => []);

    if (DEMO_MODE) {
      if (teams.length === 0) teams = MockData.teams;
      if (!predictions.length) predictions = MockData.predictions;
    }

    if (!predictions.length) {
      container.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><h2 class="empty-title">No Predictions Yet</h2><p class="empty-desc">${Auth.isTeamLeader() ? 'Submit predictions from the Match Results page.' : 'No predictions have been submitted by teams yet.'}</p></div>`;
      return;
    }

    const preds = Array.isArray(predictions) ? predictions : (predictions.predictions || [predictions]);
    window._allPredictions = preds;
    const teamCount = new Set(preds.map(p => p.team_id)).size;
    const scoredCount = preds.filter(p => p.status === 'scored' || p.status === 'VALIDATED').length;

    container.innerHTML = `
      <div class="grid-3" style="margin-bottom:var(--space-xl)">
        <div class="card stat-card">
          <div class="stat-label">Total Predictions</div>
          <div class="stat-value" data-count-to="${preds.length}" data-count-dec="0" style="font-family:var(--font-score);font-size:var(--text-4xl)">0</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">Teams Submitted</div>
          <div class="stat-value" data-count-to="${teamCount}" data-count-dec="0" style="font-family:var(--font-score);font-size:var(--text-4xl)">0</div>
        </div>
        <div class="card stat-card">
          <div class="stat-label">Scored</div>
          <div class="stat-value" data-count-to="${scoredCount}" data-count-dec="0" style="font-family:var(--font-score);font-size:var(--text-4xl)">0</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <div class="card-title">All Predictions</div>
          <span class="badge badge-info">${preds.length} entries</span>
        </div>
        <div style="padding:var(--space-md)">

          <div style="display:flex;gap:var(--space-sm);margin-bottom:var(--space-md);flex-wrap:wrap">
            <input class="form-input" id="pred-filter-match" placeholder="Filter by match..." style="max-width:200px">
            <select class="form-select" id="pred-filter-status" style="max-width:160px">
              <option value="">All status</option>
              <option value="PENDING_VALIDATION">Pending</option>
              <option value="VALIDATED">Validated</option>
              <option value="INVALID">Invalid</option>
              <option value="LATE">Late</option>
            </select>
          </div>

          <div class="table-wrapper">
            <table>
              <thead><tr><th>Team</th><th>Match</th><th>Winner</th><th>Scoreline</th><th>Status</th><th>Submitted</th></tr></thead>
              <tbody id="pred-tbody">
                ${preds.map(p => `
                  <tr class="pred-row" style="cursor:pointer" onclick="showPredDetail('${p.id}')">
                    <td><strong>${teams.find(t => t.id === p.team_id)?.name || p.team_id?.substring(0, 8) || '—'}</strong></td>
                    <td style="font-family:var(--font-data);font-size:var(--text-xs)">${p.match_id || '—'}</td>
                    <td>${Utils.predictionPick('Home', 'Away', p.match_prediction?.predicted_winner)}</td>
                    <td style="font-family:var(--font-score);font-size:var(--text-lg)">${p.match_prediction?.predicted_scoreline?.home_team_goals ?? '?'} – ${p.match_prediction?.predicted_scoreline?.away_team_goals ?? '?'}</td>
                    <td>${statusBadge(p.status)}</td>
                    <td style="font-size:var(--text-xs);color:var(--color-text-muted)">${p.submitted_at ? new Date(p.submitted_at).toLocaleString() : '—'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    animateCounters(container);

    document.getElementById('pred-filter-match')?.addEventListener('input', filterPredRows);
    document.getElementById('pred-filter-status')?.addEventListener('change', filterPredRows);

  } catch(err) {
    container.innerHTML = `<div class="alert alert-error">Failed to load predictions: ${err.message}</div>`;
  }
}

function statusBadge(status) {
  const map = {
    'PENDING_VALIDATION': 'badge-warning',
    'VALIDATED': 'badge-success',
    'INVALID': 'badge-error',
    'LATE': 'badge-info'
  };
  const label = status ? status.replace('_', ' ') : 'unknown';
  return `<span class="badge ${map[status] || 'badge-info'}">${label}</span>`;
}

function filterPredRows() {
  const match = (document.getElementById('pred-filter-match')?.value || '').toLowerCase();
  const status = document.getElementById('pred-filter-status')?.value || '';
  document.querySelectorAll('.pred-row').forEach(row => {
    const text = row.textContent.toLowerCase();
    const show = (!match || text.includes(match)) && (!status || text.includes(status.toLowerCase()));
    row.style.display = show ? '' : 'none';
  });
}

function showPredDetail(id) {
  const p = (window._allPredictions || []).find(x => x.id === id);
  if (!p) {
    Toast.error('Prediction detail not found');
    return;
  }
  
  const homeScorers = p.match_prediction?.goal_scorers?.home || [];
  const awayScorers = p.match_prediction?.goal_scorers?.away || [];
  
  const homeScorersHtml = homeScorers.length > 0
    ? homeScorers.map(s => `<li>⚽ ${s}</li>`).join('')
    : '<li style="color:var(--color-text-muted);list-style:none">None</li>';
    
  const awayScorersHtml = awayScorers.length > 0
    ? awayScorers.map(s => `<li>⚽ ${s}</li>`).join('')
    : '<li style="color:var(--color-text-muted);list-style:none">None</li>';

  Modal.show(`
    <div style="font-size:var(--text-sm)">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-bottom:var(--space-lg);background:var(--color-surface-secondary);padding:var(--space-md);border-radius:var(--radius-medium)">
        <div><strong>Match ID:</strong> ${p.match_id || '—'}</div>
        <div><strong>Predicted Winner:</strong> ${Utils.predictionPick('Home', 'Away', p.match_prediction?.predicted_winner)}</div>
        <div><strong>Predicted Score:</strong> <span style="font-family:var(--font-score);font-weight:600">${p.match_prediction?.predicted_scoreline?.home_team_goals ?? 0} - ${p.match_prediction?.predicted_scoreline?.away_team_goals ?? 0}</span></div>
        <div><strong>Status:</strong> ${statusBadge(p.status)}</div>
        <div style="grid-column: span 2"><strong>Submitted:</strong> ${p.submitted_at ? new Date(p.submitted_at).toLocaleString() : '—'}</div>
      </div>
      
      <div style="margin-bottom:var(--space-lg)">
        <h4 style="margin-bottom:var(--space-sm);text-transform:uppercase;font-size:var(--text-xs);letter-spacing:0.04em">Predicted Scorers</h4>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)">
          <div style="background:var(--color-surface);padding:var(--space-sm);border:1px solid var(--color-border);border-radius:var(--radius-small)">
            <div style="font-weight:600;margin-bottom:4px;color:var(--color-primary)">Home Team</div>
            <ul style="margin:0;padding-left:var(--space-md)">${homeScorersHtml}</ul>
          </div>
          <div style="background:var(--color-surface);padding:var(--space-sm);border:1px solid var(--color-border);border-radius:var(--radius-small)">
            <div style="font-weight:600;margin-bottom:4px;color:var(--color-accent)">Away Team</div>
            <ul style="margin:0;padding-left:var(--space-md)">${awayScorersHtml}</ul>
          </div>
        </div>
      </div>

      <div style="margin-bottom:var(--space-md)">
        <h4 style="margin-bottom:var(--space-sm);text-transform:uppercase;font-size:var(--text-xs);letter-spacing:0.04em">Probabilities & Stats</h4>
        <div style="display:grid;grid-template-columns:repeat(3, 1fr);gap:var(--space-sm)">
          <div class="card" style="padding:var(--space-sm);text-align:center">
            <div style="font-size:var(--text-xs);color:var(--color-text-muted)">Home Win</div>
            <div style="font-weight:bold;font-size:var(--text-lg)">${p.match_prediction?.probabilities?.home_win_probability ?? 0}%</div>
          </div>
          <div class="card" style="padding:var(--space-sm);text-align:center">
            <div style="font-size:var(--text-xs);color:var(--color-text-muted)">Draw</div>
            <div style="font-weight:bold;font-size:var(--text-lg)">${p.match_prediction?.probabilities?.draw_probability ?? 0}%</div>
          </div>
          <div class="card" style="padding:var(--space-sm);text-align:center">
            <div style="font-size:var(--text-xs);color:var(--color-text-muted)">Away Win</div>
            <div style="font-weight:bold;font-size:var(--text-lg)">${p.match_prediction?.probabilities?.away_win_probability ?? 0}%</div>
          </div>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-sm);margin-top:var(--space-sm)">
          <div class="card" style="padding:var(--space-sm);text-align:center">
            <div style="font-size:var(--text-xs);color:var(--color-text-muted)">First Goal</div>
            <div style="font-weight:bold">${Utils.capitalize(p.match_prediction?.first_goal_team || '—')}</div>
          </div>
          <div class="card" style="padding:var(--space-sm);text-align:center">
            <div style="font-size:var(--text-xs);color:var(--color-text-muted)">BTTS</div>
            <div style="font-weight:bold">${p.match_prediction?.both_teams_to_score_probability ?? 0}%</div>
          </div>
        </div>
      </div>
      
      <div class="modal-footer" style="margin-top:var(--space-lg)">
        <button class="btn btn-ghost" onclick="Modal.hide()">Close</button>
      </div>
    </div>
  `, `Prediction Details`);
}

/* Mock data kept for reference */
function exportPredictions() {
  Toast.info('Export feature coming soon');
}
