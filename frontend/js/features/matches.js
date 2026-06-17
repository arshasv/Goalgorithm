/* Match Results Page — role-aware */

let _matches = [];
let _allTeams = [];

Router.register('matches', async () => {
  const isOrg = Auth.isOrganizer();
  const isTL = Auth.isTeamLeader();

  const el = document.getElementById('page-content');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">&#x26BD; Match Management</h1>
        <p class="page-subtitle">${isOrg ? 'Create matches, upload schedules, enter results and track predictions' : 'View matches and submit your predictions'}</p>
      </div>
      <div class="page-header-actions" style="display:flex;gap:var(--space-sm);flex-wrap:wrap">
        ${isOrg ? `
          <button class="btn btn-secondary" onclick="document.getElementById('match-csv-input').click()">&#x1F4C1; Upload CSV</button>
          <input type="file" id="match-csv-input" accept=".csv" style="display:none" onchange="uploadMatchCsv(event)">
          <button class="btn btn-primary" onclick="showAddMatchModal()">+ Add Match</button>
          <button class="btn btn-ghost" onclick="loadMatchesPage()">&#x1F504; Refresh</button>
        ` : ''}
      </div>
    </div>

    ${isOrg ? `
    <div class="alert alert-info" style="margin-bottom:var(--space-lg)">
      <strong>CSV Format:</strong>&nbsp;
      <code>match_number,home_team,away_team,kickoff_date,round</code>
      &mdash; e.g. <code>1,Argentina,Brazil,2026-06-17T18:00:00,Final</code>
    </div>` : ''}

    <div id="match-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:var(--space-lg)">
      ${Utils.skeletonCards(6)}
    </div>
  `;

  await loadMatchesPage();
});

async function loadMatchesPage() {
  const isOrg = Auth.isOrganizer();
  const isTL = Auth.isTeamLeader();
  const grid = document.getElementById('match-grid');
  if (!grid) return;

  grid.innerHTML = Utils.skeletonCards(4);
  let matches = [];
  try {
    matches = await MatchService.list();
  } catch (_) {
    matches = MockData.matches.map((m, i) => ({
      id: m.id, match_number: i + 1,
      home_team_name: m.home, away_team_name: m.away,
      scheduled_at: m.date, status: m.status, round: null, predictions: 0,
    }));
  }

  let predictions = [];
  try {
    const res = await PredictionService.list();
    predictions = Array.isArray(res) ? res : (res.predictions || [res]);
  } catch (_) {}
  if (DEMO_MODE && !predictions.length) {
    predictions = MockData.predictions;
  }

  matches.forEach(m => {
    m.predictions = predictions.filter(p => p.match_id === m.id).length;
  });

  _matches = matches;
  try { _allTeams = await TeamService.listTeams(); } catch (_) {}
  if (DEMO_MODE && !_allTeams.length) _allTeams = MockData.teams;

  if (!matches.length) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
      <div class="empty-icon">&#x26BD;</div>
      <h2 class="empty-title">No Matches Yet</h2>
      <p class="empty-desc">${isOrg ? 'Create your first match or upload a CSV schedule.' : 'Matches will appear here once the organizer adds them.'}</p>
    </div>`;
    return;
  }

  grid.innerHTML = matches.map((m, i) => {
    const home = m.home_team_name || m.home || '?';
    const away = m.away_team_name || m.away || '?';
    const status = (m.status || 'scheduled').toLowerCase();
    const isScored = status === 'scored' || status === 'completed' || status === 'result_entered';
    const canPredict = status === 'scheduled' || status === 'frozen';
    const dateStr = m.scheduled_at ? Utils.dateStr(m.scheduled_at) : (m.date || '?');
    const timeStr = m.scheduled_at ? Utils.timeStr(m.scheduled_at) : '';

    return `<div class="card match-card" style="animation-delay:${i*80}ms;cursor:pointer" onclick="showMatchDetail('${m.id}')">
      <div class="match-card-header">
        <span class="match-card-id">M${m.match_number || (i+1)}</span>
        ${m.round ? `<span class="badge badge-info" style="font-size:var(--text-xs)">${m.round}</span>` : ''}
        ${Utils.statusBadge(status)}
      </div>
      <div class="match-vs-area">
        <div class="match-team">${home}</div>
        ${isScored ? `<div class="match-score-display">${m.homeGoals != null ? m.homeGoals : '?'} &ndash; ${m.awayGoals != null ? m.awayGoals : '?'}</div>`
                   : `<div class="match-vs-label">vs</div>`}
        <div class="match-team">${away}</div>
        <div class="match-date">${dateStr}${timeStr ? ' ' + timeStr : ''}</div>
      </div>
      <div class="match-footer">
        <span class="badge badge-info">&#x1F4E5; ${m.predictions || 0}/5 predictions</span>
        <div style="display:flex;gap:var(--space-xs)">
          ${canPredict && (isTL || isOrg) ? `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();showSubmitPredictionModal('${m.id}')">&#x1F4DD; Predict</button>` : ''}
          ${isOrg ? `<button class="btn btn-ghost btn-sm" title="Delete" onclick="event.stopPropagation();deleteMatch('${m.id}','${home} vs ${away}')">&#x1F5D1;</button>` : ''}
          <button class="btn btn-ghost btn-sm">View &rarr;</button>
        </div>
      </div>
    </div>`;
  }).join('');
}

function showAddMatchModal() {
  Modal.show(`
    <form id="add-match-form">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)">
        <div class="form-group">
          <label class="form-label">Match Number <span class="required">*</span></label>
          <input class="form-input" id="am-num" type="number" min="1" placeholder="1" required>
        </div>
        <div class="form-group">
          <label class="form-label">Round / Stage</label>
          <input class="form-input" id="am-round" placeholder="Group Stage, Final...">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-top:var(--space-md)">
        <div class="form-group">
          <label class="form-label">Home Team <span class="required">*</span></label>
          <input class="form-input" id="am-home" placeholder="Argentina" required>
        </div>
        <div class="form-group">
          <label class="form-label">Away Team <span class="required">*</span></label>
          <input class="form-input" id="am-away" placeholder="Brazil" required>
        </div>
      </div>
      <div class="form-group" style="margin-top:var(--space-md)">
        <label class="form-label">Kickoff Date &amp; Time <span class="required">*</span></label>
        <input class="form-input" id="am-date" type="datetime-local" required>
      </div>
      <div id="am-error" class="alert alert-error" style="display:none;margin-top:var(--space-md)"></div>
      <div class="modal-footer" style="margin-top:var(--space-lg)">
        <button type="button" class="btn btn-ghost" onclick="Modal.hide()">Cancel</button>
        <button type="submit" class="btn btn-primary">Create Match</button>
      </div>
    </form>`, '+ Add New Match');

  document.getElementById('add-match-form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = document.getElementById('am-error');
    err.style.display = 'none';
    const num = +document.getElementById('am-num').value;
    const home = document.getElementById('am-home').value.trim();
    const away = document.getElementById('am-away').value.trim();
    const dateVal = document.getElementById('am-date').value;
    const round = document.getElementById('am-round').value.trim() || null;
    if (!num || !home || !away || !dateVal) {
      err.textContent = 'Please fill in all required fields.';
      err.style.display = 'flex'; return;
    }
    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Creating...';
    try {
      await MatchService.create({ match_number: num, home_team_name: home, away_team_name: away, scheduled_at: new Date(dateVal).toISOString(), round });
      Modal.hide();
      Toast.success(`Match M${num}: ${home} vs ${away} created!`, 'Match Created');
      await loadMatchesPage();
    } catch (ex) {
      err.textContent = ex.message || 'Failed to create match';
      err.style.display = 'flex'; btn.disabled = false; btn.textContent = 'Create Match';
    }
  });
}

async function uploadMatchCsv(event) {
  const file = event.target.files[0];
  event.target.value = '';
  if (!file) return;
  if (!file.name.toLowerCase().endsWith('.csv')) { Toast.error('Only .csv files supported.'); return; }
  Toast.info('Uploading match schedule...');
  const fd = new FormData(); fd.append('file', file);
  try {
    const res = await MatchService.uploadCsv(fd);
    const msg = `${res.created} match${res.created !== 1 ? 'es' : ''} imported.` + (res.errors && res.errors.length ? ` ${res.errors.length} row(s) skipped.` : '');
    Toast.success(msg, 'Schedule Uploaded');
    if (res.errors && res.errors.length) console.warn('CSV errors:', res.errors);
    await loadMatchesPage();
  } catch (ex) { Toast.error(ex.message || 'Upload failed'); }
}

function deleteMatch(matchId, label) {
  Modal.confirm(`Delete "${label}"? This cannot be undone.`, async () => {
    try { await MatchService.remove(matchId); Toast.success('Match deleted.'); await loadMatchesPage(); }
    catch (ex) { Toast.error(ex.message || 'Delete failed'); }
  }, 'Delete Match');
}


async function showMatchDetail(matchId) {
  const isOrg = Auth.isOrganizer();
  const m = _matches.find(x => x.id === matchId);
  if (!m) { Toast.error('Match not found'); return; }

  const home = m.home_team_name || m.home || '?';
  const away = m.away_team_name || m.away || '?';
  const status = (m.status || 'scheduled').toLowerCase();
  const isScored = status === 'scored' || status === 'completed' || status === 'result_entered';
  const matchNum = m.match_number || '?';
  const dateStr = m.scheduled_at ? Utils.dateStr(m.scheduled_at) : (m.date || '?');
  const timeStr = m.scheduled_at ? Utils.timeStr(m.scheduled_at) : '';

  const homeScore = m.homeGoals ?? m.home_goals;
  const awayScore = m.awayGoals ?? m.away_goals;

  // Fetch predictions for this match
  let matchPredictions = [];
  try {
    const allPreds = await PredictionService.list();
    matchPredictions = allPreds.filter(p => p.match_id === matchId);
  } catch (_) {}

  const teamLabels = ['A', 'B', 'C', 'D', 'E'];
  const predCount = matchPredictions.length;

  const predRows = teamLabels.map((tid, i) => {
    const pred = matchPredictions.find(p =>
      p.team_id === tid ||
      p.team_id === `Team ${tid}` ||
      p.team_id === `team-${tid.toLowerCase()}`
    );
    const teamObj = _allTeams.find(t => t.team_id === tid);
    const display = Utils.formatTeamDisplay(teamObj);
    const submitted = !!pred;
    return `<tr style="animation:fadeIn ${300+i*60}ms var(--ease-out) both">
      <td style="display:flex;align-items:center;gap:var(--space-sm)">
        ${Utils.teamBadge(teamObj?.name || 'Team ' + tid, 28)}
        <span style="font-weight:600">${display}</span>
      </td>
      <td>${submitted ? '<span class="badge badge-success">✓ Submitted</span>' : '<span class="badge badge-error">✗ Not submitted</span>'}</td>
      <td style="font-family:var(--font-data);font-size:var(--text-xs);color:var(--color-text-secondary)">${submitted && pred.submitted_at ? Utils.dateStr(pred.submitted_at) : '—'}</td>
      <td>${submitted ? '<button class="btn btn-ghost btn-sm" onclick="showPredictionModal(\''+tid+'\',\'Team '+tid+'\')">View</button>' : ''}</td>
    </tr>`;
  }).join('');

  Modal.show(`
    <div>
      <div style="text-align:center;padding:var(--space-lg) 0;background:var(--color-surface-secondary);border-radius:var(--radius-medium);margin-bottom:var(--space-lg);position:relative;overflow:hidden">
        <div style="font-size:var(--text-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.08em">${dateStr}${timeStr ? ' ' + timeStr : ''}</div>
        <div style="font-family:var(--font-display);font-size:var(--text-2xl);font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin:var(--space-sm) 0">
          ${home} <span style="color:var(--color-text-muted);font-family:var(--font-data)">vs</span> ${away}
        </div>
        ${isScored && homeScore != null ? `<div class="match-score-display" style="font-size:var(--text-5xl);color:var(--color-status-success)">${homeScore} – ${awayScore}</div>` : '<div class="match-vs-label">TBD</div>'}
        <div style="margin-top:var(--space-sm)">${Utils.statusBadge(status)}</div>
      </div>

      <h4 style="font-family:var(--font-display);font-size:var(--text-base);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:var(--space-md)">Team Predictions</h4>
      <div class="table-wrapper" style="margin-bottom:var(--space-lg)">
        <table style="width:100%"><thead><tr><th>Team</th><th>Status</th><th>Submitted</th><th></th></tr></thead>
        <tbody>${predRows}</tbody></table>
      </div>

      <div style="margin-bottom:var(--space-lg)">
        <div class="progress-bar"><div class="progress-fill" style="width:${(predCount/5)*100}%"></div></div>
        <div style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-top:4px">${predCount} of 5 teams submitted</div>
      </div>

      <div style="display:flex;gap:var(--space-sm)">
        <button class="btn btn-ghost" style="flex:1" onclick="Router.navigate('predictions')">📋 Predictions Log</button>
        ${(status==='scheduled'||status==='frozen') ? `<button class="btn btn-secondary" style="flex:1" onclick="Modal.hide();showSubmitPredictionModal('${m.id}')">📝 Submit Prediction</button>` : ''}
        ${isOrg && (status==='scheduled'||status==='frozen') ? `<button class="btn btn-primary" style="flex:1" onclick="Modal.hide();showEnterResultModal('${m.id}')">📋 Enter Result</button>` : ''}
        ${isOrg && (status==='completed'||status==='scored') ? `<button class="btn btn-primary" style="flex:1" onclick="Modal.hide();showScoreCalcModal('${m.id}')">⚡ Calculate Scores</button>` : ''}
      </div>
    </div>`, `Match M${matchNum} — ${home} vs ${away}`);
}

function showPredictionModal(teamId, teamName) {
  Modal.show(`
    <div class="json-viewer">
      <div><span class="json-key">"team_id"</span>: <span class="json-string">"${teamId}"</span>,</div>
      <div><span class="json-key">"match_id"</span>: <span class="json-string">"M32"</span>,</div>
      <div><span class="json-key">"match_prediction"</span>: {</div>
      <div style="padding-left:var(--space-md)"><span class="json-key">"predicted_winner"</span>: <span class="json-string">"home"</span>,</div>
      <div style="padding-left:var(--space-md)"><span class="json-key">"predicted_scoreline"</span>: { <span class="json-key">"home_team_goals"</span>: <span class="json-number">2</span>, <span class="json-key">"away_team_goals"</span>: <span class="json-number">1</span> },</div>
      <div style="padding-left:var(--space-md)"><span class="json-key">"probabilities"</span>: { <span class="json-key">"home_win_probability"</span>: <span class="json-number">65.0</span>, <span class="json-key">"draw_probability"</span>: <span class="json-number">20.0</span>, <span class="json-key">"away_win_probability"</span>: <span class="json-number">15.0</span> },</div>
      <div style="padding-left:var(--space-md)"><span class="json-key">"first_goal_team"</span>: <span class="json-string">"home"</span>,</div>
      <div style="padding-left:var(--space-md)"><span class="json-key">"both_teams_to_score_probability"</span>: <span class="json-number">45.0</span>,</div>
      <div style="padding-left:var(--space-md)"><span class="json-key">"goal_scorers"</span>: { <span class="json-key">"home"</span>: [<span class="json-string">"Player 1"</span>, <span class="json-string">"Player 2"</span>], <span class="json-key">"away"</span>: [<span class="json-string">"Player 3"</span>] }</div>
      <div>}</div>
    </div>`, `Prediction Detail — ${teamName || teamId}`);
}

/* ===== PREDICTION ENTRY FORM ===== */
function showSubmitPredictionModal(matchId) {
  if (!Auth.isAuthenticated()) { window.location.href = 'login.html'; return; }

  const m = _matches.find(x => x.id === matchId);
  if (!m) { Toast.error('Match not found'); Modal.hide(); return; }
  const isOrg = Auth.isOrganizer();
  const teamName = Auth.getUser()?.team_name || 'Your Team';
  const home = m.home_team_name || m.home || '?';
  const away = m.away_team_name || m.away || '?';

  const orgTeamSelector = isOrg ? `
    <div class="form-group" style="margin-bottom:var(--space-md);padding:var(--space-md);background:var(--color-surface-secondary);border-radius:var(--radius-medium);border:2px solid var(--color-primary)">
      <label class="form-label" style="font-weight:700;color:var(--color-primary)">Prediction belongs to: <span class="required">*</span></label>
      <select class="form-select" id="p-org-team" required>
        <option value="">-- Select team --</option>
        <option value="team-a">Team A</option>
        <option value="team-b">Team B</option>
        <option value="team-c">Team C</option>
        <option value="team-d">Team D</option>
        <option value="team-e">Team E</option>
      </select>
      <div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:4px">Select which team this prediction is being submitted on behalf of.</div>
    </div>` : '';

  Modal.show(`
    <form id="prediction-form">
      <div class="alert alert-info" style="margin-bottom:var(--space-md); display:flex; justify-content:space-between; align-items:center">
        <div>ℹ️ Submit prediction for <strong>${home} vs ${away}</strong> (${matchId})</div>
        <button type="button" class="btn btn-secondary btn-sm" onclick="showJsonFormatModal()">📄 View JSON Format</button>
      </div>

      ${orgTeamSelector}

      <div class="form-group" style="display:none">
        <input id="p-team" value="${teamName}">
      </div>

      <div class="form-group">
        <label class="form-label">Predicted Winner <span class="required">*</span></label>
        <select class="form-select" id="p-winner" required onchange="toggleScoreline()">
          <option value="">Select winner</option>
          <option value="home">${home} (Home Win)</option>
          <option value="away">${away} (Away Win)</option>
          <option value="draw">Draw</option>
        </select>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-top:var(--space-md)">
        <div class="form-group">
          <label class="form-label">${home} Goals <span class="required">*</span></label>
          <input class="form-input score-input" id="p-home" type="number" min="0" max="20" value="1" style="width:100%" oninput="updateScorerFields(this.value, '${home.replace(/'/g, "\\'")}', 'home')">
          <div id="home-scorers-container" style="margin-top:var(--space-sm)"></div>
        </div>
        <div class="form-group">
          <label class="form-label">${away} Goals <span class="required">*</span></label>
          <input class="form-input score-input" id="p-away" type="number" min="0" max="20" value="1" style="width:100%" oninput="updateScorerFields(this.value, '${away.replace(/'/g, "\\'")}', 'away')">
          <div id="away-scorers-container" style="margin-top:var(--space-sm)"></div>
        </div>
      </div>

      <!-- GOAL SCORERS FILE UPLOAD SECTION -->
      <div style="margin-top:var(--space-md);padding:var(--space-md);background:var(--color-surface-secondary);border-radius:var(--radius-medium)">
        <div style="font-size:var(--text-sm);font-weight:600;margin-bottom:var(--space-xs);text-transform:uppercase;letter-spacing:0.04em">⚽ Goal Scorers Entry</div>
        <div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-bottom:var(--space-sm)">
          Provide the predicted scorers. You can type them in the fields above or upload a text/JSON file.
        </div>
        <div class="form-group">
          <label class="form-label" style="font-size:var(--text-xs)">Upload Scorers File (.txt / .json)</label>
          <input type="file" id="p-scorers-file" class="form-input" accept=".txt,.json" onchange="handleScorersFileUpload(event)" style="font-size:var(--text-xs);padding:6px">
        </div>
      </div>

      <div style="margin-top:var(--space-lg);padding:var(--space-md);background:var(--color-surface-secondary);border-radius:var(--radius-medium)">
        <div style="font-size:var(--text-sm);font-weight:600;margin-bottom:var(--space-md);text-transform:uppercase;letter-spacing:0.04em">📊 Probability Estimates</div>

        <div class="form-group">
          <label class="form-label">Home Win Probability (%)</label>
          <input class="form-input" id="p-home-prob" type="number" min="0" max="100" value="45" style="width:100%">
        </div>
        <div class="form-group" style="margin-top:var(--space-sm)">
          <label class="form-label">Draw Probability (%)</label>
          <input class="form-input" id="p-draw-prob" type="number" min="0" max="100" value="30" style="width:100%">
        </div>
        <div class="form-group" style="margin-top:var(--space-sm)">
          <label class="form-label">Away Win Probability (%)</label>
          <input class="form-input" id="p-away-prob" type="number" min="0" max="100" value="25" style="width:100%">
        </div>
        <div style="margin-top:var(--space-sm);font-size:var(--text-xs);color:var(--color-text-muted)" id="prob-sum-hint">Sum: <span id="prob-sum">100</span>% (should equal 100%)</div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-top:var(--space-md)">
        <div class="form-group">
          <label class="form-label">First Goal Team</label>
          <select class="form-select" id="p-first-goal">
            <option value="">—</option>
            <option value="home">${home}</option>
            <option value="away">${away}</option>
            <option value="none">No goals</option>
          </select>
        </div>
        <div class="form-group">
          <label class="form-label">Both Teams to Score (%)</label>
          <input class="form-input" id="p-btts" type="number" min="0" max="100" value="50">
        </div>
      </div>

      <div id="pred-error" class="alert alert-error" style="display:none;margin-top:var(--space-md)"></div>

      <div class="modal-footer" style="margin-top:var(--space-lg)">
        <button type="button" class="btn btn-ghost" onclick="Modal.hide()">Cancel</button>
        <button type="submit" class="btn btn-primary">📤 Submit Prediction</button>
      </div>
    </form>`, `Submit Prediction — ${home} vs ${away}`);

  ['p-home-prob','p-draw-prob','p-away-prob'].forEach(id => {
    document.getElementById(id).addEventListener('input', updateProbSum);
  });

  window.updateScorerFields = function(countVal, teamName, side) {
    const count = parseInt(countVal) || 0;
    const container = document.getElementById(side + '-scorers-container');
    if (!container) return;
    let html = '';
    for (let i = 1; i <= count; i++) {
      html += '<div class="form-group" style="margin-top:4px"><input class="form-input" id="p-'+side+'-scorer-'+i+'" placeholder="'+teamName+' scorer '+i+'" required style="width:100%;font-size:var(--text-sm);padding:8px"></div>';
    }
    container.innerHTML = html;
  };

  window.handleScorersFileUpload = function(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      const content = e.target.result;
      try {
        if (file.name.endsWith('.json')) {
          const data = JSON.parse(content);
          if (data && typeof data === 'object') {
            if (Array.isArray(data)) {
              populateScorersList(data, []);
            } else {
              populateScorersList(data.home || [], data.away || []);
            }
          }
        } else {
          const lines = content.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          let homeScorers = [];
          let awayScorers = [];
          let isAway = false;
          for (const line of lines) {
            if (line.toLowerCase().startsWith('away:') || line.startsWith('---')) {
              isAway = true;
              continue;
            }
            if (line.toLowerCase().startsWith('home:')) {
              isAway = false;
              continue;
            }
            if (isAway) {
              awayScorers.push(line);
            } else {
              homeScorers.push(line);
            }
          }
          populateScorersList(homeScorers, awayScorers);
        }
        Toast.success('Scorers loaded from file successfully!', 'File Loaded');
      } catch (err) {
        Toast.error('Failed to parse file: ' + err.message, 'File Error');
      }
    };
    reader.readAsText(file);
  };

  function populateScorersList(homeList, awayList) {
    const homeCountInput = document.getElementById('p-home');
    const awayCountInput = document.getElementById('p-away');
    
    if (homeCountInput && homeList && homeList.length > 0) {
      homeCountInput.value = homeList.length;
      updateScorerFields(homeList.length, home, 'home');
      for (let i = 0; i < homeList.length; i++) {
        const input = document.getElementById('p-home-scorer-' + (i + 1));
        if (input) input.value = homeList[i];
      }
    }
    
    if (awayCountInput && awayList && awayList.length > 0) {
      awayCountInput.value = awayList.length;
      updateScorerFields(awayList.length, away, 'away');
      for (let i = 0; i < awayList.length; i++) {
        const input = document.getElementById('p-away-scorer-' + (i + 1));
        if (input) input.value = awayList[i];
      }
    }
  }

  updateScorerFields(1, home, 'home');
  updateScorerFields(1, away, 'away');

  document.getElementById('prediction-form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = document.getElementById('pred-error');
    err.style.display = 'none';

    // Organizer must select a team before submitting
    if (isOrg) {
      const orgTeamEl = document.getElementById('p-org-team');
      if (!orgTeamEl || !orgTeamEl.value) {
        err.textContent = 'Please select which team this prediction belongs to.';
        err.style.display = 'flex';
        if (orgTeamEl) orgTeamEl.focus();
        return;
      }
    }

    const winner = document.getElementById('p-winner').value;
    const homeG = +document.getElementById('p-home').value;
    const awayG = +document.getElementById('p-away').value;

    if (!winner) { err.textContent = 'Please select a predicted winner'; err.style.display = 'flex'; return; }

    // Resolve team_id: organizer uses dropdown selection, team leader uses their own session team_id
    const resolvedTeamId = isOrg
      ? (document.getElementById('p-org-team')?.value || 'placeholder')
      : (Auth.getUser()?.team_id || 'placeholder');

    const payload = {
      team_id: resolvedTeamId,
      match_id: matchId,
      submission_id: 'sub-' + Date.now(),
      idempotency_key: resolvedTeamId + '-' + matchId + '-' + Date.now(),
      match_prediction: {
        predicted_winner: winner,
        predicted_scoreline: {
          home_team_goals: homeG,
          away_team_goals: awayG
        },
        probabilities: {
          home_win_probability: +document.getElementById('p-home-prob').value || 0,
          draw_probability: +document.getElementById('p-draw-prob').value || 0,
          away_win_probability: +document.getElementById('p-away-prob').value || 0
        },
        clean_sheet_probability: { home_team: 30, away_team: 20 },
        first_goal_team: document.getElementById('p-first-goal').value || null,
        both_teams_to_score_probability: +document.getElementById('p-btts').value || 0,
        total_goals_prediction: homeG + awayG,
        goal_scorers: {
          home: Array.from({length: homeG}, (_, i) => document.getElementById('p-home-scorer-' + (i+1))?.value || ''),
          away: Array.from({length: awayG}, (_, i) => document.getElementById('p-away-scorer-' + (i+1))?.value || '')
        }
      },
      player_predictions: [
        { player_id: 'P1', player_name: 'Star Player', goal_probability: 40, predicted_goals: 1, assist_probability: 30 }
      ]
    };

    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';

    try {
      await PredictionService.submit(payload);
      Modal.hide();
      Toast.success('Prediction submitted successfully!', 'Prediction Submitted');
      await loadMatchesPage();
    } catch (ex) {
      err.textContent = ex.message || 'Submission failed';
      err.style.display = 'flex';
      submitBtn.disabled = false;
      submitBtn.textContent = '📤 Submit Prediction';
    }
  });
}

function updateProbSum() {
  const sum = ['p-home-prob','p-draw-prob','p-away-prob']
    .map(id => +document.getElementById(id).value || 0)
    .reduce((a, b) => a + b, 0);
  document.getElementById('prob-sum').textContent = sum;
  const hint = document.getElementById('prob-sum-hint');
  hint.style.color = Math.abs(sum - 100) > 5 ? 'var(--color-status-warning)' : 'var(--color-text-muted)';
}

function showJsonFormatModal() {
  const sampleJson = {
    "team_id": "A",
    "match_id": "123e4567...",
    "submission_id": "sub-9876",
    "match_prediction": {
      "predicted_winner": "home",
      "predicted_scoreline": { "home_team_goals": 2, "away_team_goals": 1 },
      "probabilities": { "home_win_probability": 60.5, "draw_probability": 25.0, "away_win_probability": 14.5 },
      "clean_sheet_probability": { "home_team": 30.0, "away_team": 15.5 },
      "first_goal_team": "home",
      "both_teams_to_score_probability": 55.0,
      "total_goals_prediction": 3,
      "goal_scorers": { "home": ["Lionel Messi", "Kylian Mbappe"], "away": ["Cristiano Ronaldo"] }
    },
    "player_predictions": [
      {
        "player_id": "p123",
        "player_name": "Lionel Messi",
        "goal_probability": 45.5,
        "predicted_goals": 1,
        "assist_probability": 30.0
      }
    ]
  };

  const html = `
    <div style="font-size:var(--text-sm)">
      <p style="margin-bottom:var(--space-md)">Your prediction model must output data matching this strict JSON schema. The number of players in the <code>goal_scorers</code> arrays MUST exactly match the <code>predicted_scoreline</code> goals.</p>
      <pre style="background:var(--color-surface-secondary); padding:var(--space-md); border-radius:var(--radius-md); overflow-x:auto; font-family:monospace; font-size:var(--text-xs); color:var(--color-text-primary); border: 1px solid var(--color-border)">${JSON.stringify(sampleJson, null, 2)}</pre>
      <div style="margin-top:var(--space-md)">
        <strong>Key Rules:</strong>
        <ul style="margin-top:var(--space-xs); padding-left:var(--space-lg); color:var(--color-text-secondary)">
          <li><code>predicted_winner</code> must be "home", "away", or "draw".</li>
          <li><code>first_goal_team</code> must be "home", "away", or "none".</li>
          <li>Goal counts must be integers >= 0.</li>
          <li>Probabilities must be floats between 0 and 100.</li>
        </ul>
      </div>
      <div class="modal-footer" style="margin-top:var(--space-lg)">
        <button class="btn btn-primary" onclick="document.getElementById('json-ref-modal').remove()">Got it</button>
      </div>
    </div>
  `;

  const el = document.createElement('div');
  el.id = 'json-ref-modal'; el.className = 'modal-overlay';
  el.innerHTML = '<div class="modal" style="max-width:600px"><div class="modal-header"><h3 class="modal-title">JSON Format Reference</h3><button class="modal-close" onclick="document.getElementById(\'json-ref-modal\').remove()">&times;</button></div><div class="modal-body">' + html + '</div></div>';
  document.body.appendChild(el);
}

function toggleScoreline() {}

function showEnterResultModal(matchId) {
  if (!Auth.isOrganizer()) { Toast.error('Only organizers can enter results'); return; }
  const m = _matches.find(x => x.id === matchId);
  if (!m) { Toast.error('Match not found'); return; }

  const home = m.home_team_name || m.home || '?';
  const away = m.away_team_name || m.away || '?';

  Modal.show(`
    <form id="result-form">
      <div style="text-align:center;padding:var(--space-md);background:var(--color-surface-secondary);border-radius:var(--radius-medium);margin-bottom:var(--space-md)">
        <div style="font-family:var(--font-display);font-size:var(--text-xl);font-weight:600;text-transform:uppercase;letter-spacing:0.04em">
          ${home} vs ${away}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md)">
        <div class="form-group">
          <label class="form-label">${home} Goals <span class="required">*</span></label>
          <input class="form-input score-input" id="r-home" type="number" min="0" value="0" required>
        </div>
        <div class="form-group">
          <label class="form-label">${away} Goals <span class="required">*</span></label>
          <input class="form-input score-input" id="r-away" type="number" min="0" value="0" required>
        </div>
      </div>
      <div class="form-group" style="margin-top:var(--space-md)">
        <label class="form-label">Goal Scorers (optional)</label>
        <div id="result-scorers-container">
          <input class="form-input" id="r-scorers" placeholder="e.g. Messi, Ronaldo, Mbappe" style="width:100%">
        </div>
        <div style="font-size:var(--text-xs);color:var(--color-text-muted);margin-top:4px">Comma-separated list of goal scorer names.</div>
      </div>
      <div id="result-error" class="alert alert-error" style="display:none;margin-top:var(--space-md)"></div>
      <div class="modal-footer" style="margin-top:var(--space-lg)">
        <button type="button" class="btn btn-ghost" onclick="Modal.hide()">Cancel</button>
        <button type="submit" class="btn btn-primary">✓ Submit Result</button>
      </div>
    </form>`, 'Enter Match Result');

  document.getElementById('result-form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = document.getElementById('result-error');
    err.style.display='none';
    const homeG = +document.getElementById('r-home').value;
    const awayG = +document.getElementById('r-away').value;
    const winner = homeG > awayG ? 'home' : homeG < awayG ? 'away' : 'draw';
    const scorersText = document.getElementById('r-scorers').value.trim();

    const payload = {
      match_id: matchId,
      actual_winner: winner,
      final_score: {home_team_goals: homeG, away_team_goals: awayG},
      player_results: scorersText ? scorersText.split(',').map((s, i) => ({
        player_id: 'P' + (i+1),
        player_name: s.trim(),
        actual_goals: 1
      })) : [{player_id: 'P1', player_name: 'Player A', actual_goals: 1}]
    };

    const btn = e.target.querySelector('button[type="submit"]');
    btn.disabled = true; btn.textContent = 'Submitting...';
    try {
      await ActualResultService.submit(payload);
      Modal.hide();
      Toast.success('Match result submitted!', 'Result Entered');
      const match = _matches.find(x => x.id === matchId);
      if (match) {
        match.status = 'completed';
        match.homeGoals = homeG;
        match.awayGoals = awayG;
      }
    } catch(ex) {
      err.textContent = ex.message || 'Submission failed';
      err.style.display = 'flex';
      btn.disabled = false; btn.textContent = '✓ Submit Result';
    }
  });
}

function showScoreCalcModal(matchId) {
  Modal.confirm(
    `Calculate scores for ${matchId}? This will compute scores for all teams.`,
    async () => {
      Toast.info('Calculating scores...');
      Toast.success(`Scores calculated for ${matchId}!`);
    }, 'Calculate Match Scores');
}
