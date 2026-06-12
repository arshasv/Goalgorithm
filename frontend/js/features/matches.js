/* Match Results Page — role-aware */

/* Mock matches moved to js/data/mockData.js */

Router.register('matches', () => {
  const isOrg = Auth.isOrganizer();
  const isTL = Auth.isTeamLeader();

  const el = document.getElementById('page-content');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">⚽ Match Results</h1>
        <p class="page-subtitle">${isOrg ? 'Match listing, results entry and prediction tracking' : 'View matches and submit your predictions'}</p>
      </div>
      <div class="page-header-actions">
        ${isOrg ? '<button class="btn btn-primary" onclick="showAddResultModal()">+ Enter Result</button>' : ''}
      </div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:var(--space-lg)" id="match-grid"></div>
  `;

  const grid = document.getElementById('match-grid');
  grid.innerHTML = MockData.matches.map((m, i) => `
    <div class="card match-card" style="animation-delay:${i*120}ms" onclick="showMatchDetail('${m.id}')">
      <div class="match-card-header">
        <span class="match-card-id">${m.id}</span>
        ${Utils.statusBadge(m.status)}
      </div>
      <div class="match-vs-area">
        <div class="match-team">${m.home}</div>
        ${m.status==='scored'||m.status==='completed'
          ? `<div class="match-score-display">${m.homeGoals} – ${m.awayGoals}</div>`
          : `<div class="match-vs-label">vs</div>`}
        <div class="match-team">${m.away}</div>
        <div class="match-date">${m.date}</div>
      </div>
      <div class="match-footer">
        <span class="badge badge-info">📥 ${m.predictions}/5 predictions</span>
        <div style="display:flex;gap:var(--space-xs)">
          ${(m.status==='scheduled'||m.status==='frozen') && isTL
            ? `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();showSubmitPredictionModal('${m.id}')">📝 Predict</button>`
            : ''}
          ${isOrg && (m.status==='scheduled'||m.status==='frozen')
            ? `<button class="btn btn-secondary btn-sm" onclick="event.stopPropagation();showSubmitPredictionModal('${m.id}')">📝 Predict</button>`
            : ''}
          <button class="btn btn-ghost btn-sm">View →</button>
        </div>
      </div>
    </div>`).join('');
});

function showMatchDetail(matchId) {
  const isOrg = Auth.isOrganizer();
  const m = MockData.matches.find(x=>x.id===matchId) || MockData.matches[0];
  Modal.show(`
    <div>
      <div style="text-align:center;padding:var(--space-lg) 0;background:var(--color-surface-secondary);border-radius:var(--radius-medium);margin-bottom:var(--space-lg);position:relative;overflow:hidden">
        <div style="font-size:var(--text-xs);color:var(--color-text-muted);text-transform:uppercase;letter-spacing:0.08em">${m.date}</div>
        <div style="font-family:var(--font-display);font-size:var(--text-2xl);font-weight:600;text-transform:uppercase;letter-spacing:0.04em;margin:var(--space-sm) 0">
          ${m.home} <span style="color:var(--color-text-muted);font-family:var(--font-data)">vs</span> ${m.away}
        </div>
        ${m.homeGoals!=null ? `<div class="match-score-display" style="font-size:var(--text-5xl);color:var(--color-status-success)">${m.homeGoals} – ${m.awayGoals}</div>` : '<div class="match-vs-label">TBD</div>'}
        <div style="margin-top:var(--space-sm)">${Utils.statusBadge(m.status)}</div>
      </div>

      <h4 style="font-family:var(--font-display);font-size:var(--text-base);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:var(--space-md)">Team Predictions</h4>
      <div class="table-wrapper" style="margin-bottom:var(--space-lg)">
        <table style="width:100%"><thead><tr><th>Team</th><th>Status</th><th>Submitted</th><th></th></tr></thead>
        <tbody>${MockData.teams.map((t,i)=>`
          <tr style="animation:fadeIn ${300+i*60}ms var(--ease-out) both">
            <td style="display:flex;align-items:center;gap:var(--space-sm)">
              ${Utils.teamBadge(t.name, 28)}
              <span style="font-weight:600">Team ${t.name}</span>
            </td>
            <td>${i<m.predictions?'<span class="badge badge-success">✓ Submitted</span>':'<span class="badge badge-error">✗ Not submitted</span>'}</td>
            <td style="font-family:var(--font-data);font-size:var(--text-xs);color:var(--color-text-secondary)">${i<m.predictions?'Jun 9, 14:32':'—'}</td>
            <td>${i<m.predictions?'<button class="btn btn-ghost btn-sm" onclick="showPredictionModal(\''+t.name+'\')">View</button>':''}</td>
          </tr>`).join('')}</tbody></table>
      </div>

      <div style="margin-bottom:var(--space-lg)">
        <div class="progress-bar"><div class="progress-fill" style="width:${(m.predictions/5)*100}%"></div></div>
        <div style="font-size:var(--text-xs);color:var(--color-text-secondary);margin-top:4px">${m.predictions} of 5 teams submitted</div>
      </div>

      <div style="display:flex;gap:var(--space-sm)">
        <button class="btn btn-ghost" style="flex:1" onclick="Router.navigate('predictions')">📋 Predictions Log</button>
        ${(m.status==='scheduled'||m.status==='frozen') ? `<button class="btn btn-secondary" style="flex:1" onclick="Modal.hide();showSubmitPredictionModal('${m.id}')">📝 Submit Prediction</button>` : ''}
        ${isOrg && (m.status==='completed') ? `<button class="btn btn-primary" style="flex:1" onclick="Modal.hide();showScoreCalcModal('${m.id}')">⚡ Calculate Scores</button>` : ''}
      </div>
    </div>`, `Match ${matchId} — ${m.home} vs ${m.away}`);
}

function showPredictionModal(team) {
  Modal.show(`
    <div class="json-viewer">
      <div><span class="json-key">"team_id"</span>: <span class="json-string">"TEAM_${team.toUpperCase()}"</span>,</div>
      <div><span class="json-key">"match_id"</span>: <span class="json-string">"M32"</span>,</div>
      <div><span class="json-key">"match_prediction"</span>: {</div>
      <div style="padding-left:var(--space-md)"><span class="json-key">"predicted_winner"</span>: <span class="json-string">"home"</span>,</div>
      <div style="padding-left:var(--space-md)"><span class="json-key">"predicted_scoreline"</span>: { <span class="json-key">"home_team_goals"</span>: <span class="json-number">2</span>, <span class="json-key">"away_team_goals"</span>: <span class="json-number">1</span> },</div>
      <div style="padding-left:var(--space-md)"><span class="json-key">"probabilities"</span>: { <span class="json-key">"home_win_probability"</span>: <span class="json-number">65.0</span>, <span class="json-key">"draw_probability"</span>: <span class="json-number">20.0</span>, <span class="json-key">"away_win_probability"</span>: <span class="json-number">15.0</span> },</div>
      <div style="padding-left:var(--space-md)"><span class="json-key">"first_goal_team"</span>: <span class="json-string">"home"</span>,</div>
      <div style="padding-left:var(--space-md)"><span class="json-key">"both_teams_to_score_probability"</span>: <span class="json-number">45.0</span>,</div>
      <div style="padding-left:var(--space-md)"><span class="json-key">"goal_scorers"</span>: { <span class="json-key">"home"</span>: [<span class="json-string">"Player 1"</span>, <span class="json-string">"Player 2"</span>], <span class="json-key">"away"</span>: [<span class="json-string">"Player 3"</span>] }</div>
      <div>}</div>
    </div>`, `Prediction Detail — Team ${team}`);
}

/* ===== PREDICTION ENTRY FORM ===== */
function showSubmitPredictionModal(matchId) {
  if (!Auth.isAuthenticated()) { window.location.href = 'login.html'; return; }

  const m = MockData.matches.find(x => x.id === matchId) || MockData.matches[0];
  const teamName = Auth.getUser()?.team_name || 'Your Team';

  Modal.show(`
    <form id="prediction-form">
      <div class="alert alert-info" style="margin-bottom:var(--space-lg)">
        ℹ️ Submit prediction for <strong>${m.home} vs ${m.away}</strong> (${matchId})
      </div>

      <div class="form-group" style="display:none">
        <input id="p-team" value="${teamName}">
      </div>

      <div class="form-group">
        <label class="form-label">Predicted Winner <span class="required">*</span></label>
        <select class="form-select" id="p-winner" required onchange="toggleScoreline()">
          <option value="">Select winner</option>
          <option value="home">${m.home} (Home Win)</option>
          <option value="away">${m.away} (Away Win)</option>
          <option value="draw">Draw</option>
        </select>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-top:var(--space-md)">
        <div class="form-group">
          <label class="form-label">${m.home} Goals <span class="required">*</span></label>
          <input class="form-input score-input" id="p-home" type="number" min="0" max="20" value="1" style="width:100%" oninput="updateScorerFields(this.value, '${m.home.replace(/'/g, "\\'")}', 'home')">
          <div id="home-scorers-container" style="margin-top:var(--space-sm)"></div>
        </div>
        <div class="form-group">
          <label class="form-label">${m.away} Goals <span class="required">*</span></label>
          <input class="form-input score-input" id="p-away" type="number" min="0" max="20" value="1" style="width:100%" oninput="updateScorerFields(this.value, '${m.away.replace(/'/g, "\\'")}', 'away')">
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
            <option value="home">${m.home}</option>
            <option value="away">${m.away}</option>
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
    </form>`, `Submit Prediction — ${m.home} vs ${m.away}`);

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
      updateScorerFields(homeList.length, m.home, 'home');
      for (let i = 0; i < homeList.length; i++) {
        const input = document.getElementById('p-home-scorer-' + (i + 1));
        if (input) input.value = homeList[i];
      }
    }
    
    if (awayCountInput && awayList && awayList.length > 0) {
      awayCountInput.value = awayList.length;
      updateScorerFields(awayList.length, m.away, 'away');
      for (let i = 0; i < awayList.length; i++) {
        const input = document.getElementById('p-away-scorer-' + (i + 1));
        if (input) input.value = awayList[i];
      }
    }
  }

  updateScorerFields(1, m.home, 'home');
  updateScorerFields(1, m.away, 'away');

  document.getElementById('prediction-form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = document.getElementById('pred-error');
    err.style.display = 'none';

    const winner = document.getElementById('p-winner').value;
    const homeG = +document.getElementById('p-home').value;
    const awayG = +document.getElementById('p-away').value;

    if (!winner) { err.textContent = 'Please select a predicted winner'; err.style.display = 'flex'; return; }

    const payload = {
      team_id: Auth.getUser()?.team_id || 'placeholder',
      match_id: matchId,
      submission_id: 'sub-' + Date.now(),
      idempotency_key: 'idem-' + Date.now(),
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
      const match = MockData.matches.find(x => x.id === matchId);
      if (match && match.predictions < 5) match.predictions++;
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

function toggleScoreline() {}

function showAddResultModal() {
  if (!Auth.isOrganizer()) { Toast.error('Only organizers can enter results'); return; }

  Modal.show(`
    <form id="result-form">
      <div class="form-group">
        <label class="form-label">Match ID <span class="required">*</span></label>
        <input class="form-input" id="r-match-id" placeholder="e.g. M29" required>
      </div>
      <div class="form-group" style="margin-top:var(--space-md)">
        <label class="form-label">Actual Winner <span class="required">*</span></label>
        <select class="form-select" id="r-winner" required>
          <option value="">Select winner</option>
          <option value="home">Home Win</option>
          <option value="away">Away Win</option>
          <option value="draw">Draw</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-top:var(--space-md)">
        <div class="form-group">
          <label class="form-label">Home Goals <span class="required">*</span></label>
          <input class="form-input score-input" id="r-home" type="number" min="0" placeholder="0">
        </div>
        <div class="form-group">
          <label class="form-label">Away Goals <span class="required">*</span></label>
          <input class="form-input score-input" id="r-away" type="number" min="0" placeholder="0">
        </div>
      </div>
      <div id="result-error" class="alert alert-error" style="display:none;margin-top:var(--space-md)"></div>
      <div class="modal-footer" style="margin-top:var(--space-lg)">
        <button type="button" class="btn btn-ghost" onclick="Modal.hide()">Cancel</button>
        <button type="submit" class="btn btn-primary">✓ Submit Result</button>
      </div>
    </form>`, 'Enter Actual Match Result');

  document.getElementById('result-form').addEventListener('submit', async e => {
    e.preventDefault();
    const err = document.getElementById('result-error');
    err.style.display='none';
    const winner = document.getElementById('r-winner').value;
    if (!winner) { err.textContent='Please select a winner'; err.style.display='flex'; return; }
    const payload = {
      match_id: document.getElementById('r-match-id').value,
      actual_winner: winner,
      final_score: {home_team_goals:+document.getElementById('r-home').value, away_team_goals:+document.getElementById('r-away').value},
      player_results:[{player_id:'P1',player_name:'Player A',actual_goals:1}]
    };
    try {
      await ActualResultService.submit(payload);
      Modal.hide(); Toast.success('Match result submitted!');
    } catch(ex) { err.textContent=ex.message||'Submission failed'; err.style.display='flex'; }
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
