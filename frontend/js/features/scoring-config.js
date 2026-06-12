Router.register('scoring-config', async () => {
  const main = document.getElementById('page-content');
  if (!Auth.isOrganizer()) {
    main.innerHTML = '<div class="empty-state"><div class="empty-icon">🔒</div><h2 class="empty-title">Access Denied</h2><p class="empty-desc">This page is for organizers only.</p></div>';
    return;
  }

  main.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">⚙️ Scoring Configuration</h1>
        <p class="page-subtitle">Configure scoring rules for future matches</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="loadScoringConfig()">🔄 Refresh</button>
      </div>
    </div>
    <div id="scoring-config-content">${Utils.skeletonCards(4)}</div>
  `;

  await loadScoringConfig();
});

let _scConfig = null;
let _scGuidelines = null;

async function loadScoringConfig() {
  const container = document.getElementById('scoring-config-content');
  if (!container) return;

  try {
    const resp = await Api.get('/admin/scoring-config/guidelines');
    _scConfig = resp.config;
    _scGuidelines = resp.guidelines || [];

    if (!_scConfig) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">⚙️</div><h2 class="empty-title">No Configuration Found</h2><p class="empty-desc">A default scoring configuration has not been seeded yet.</p></div>';
      return;
    }

    const glMap = {};
    _scGuidelines.forEach(g => { glMap[g.key] = g; });

    container.innerHTML = `
      <div class="alert alert-warning" style="margin-bottom:var(--space-lg)">
        <strong>⚠️ Changes apply only to future matches.</strong> Existing scores will not be recalculated.
      </div>

      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header">
          <div class="card-title">Config: ${_scConfig.name || ''} <span class="badge badge-info">v${_scConfig.version || 1}</span></div>
        </div>
      </div>

      ${renderSection('Base Score', [
        'winner_points_correct', 'winner_points_incorrect',
        'scoreline_points_exact', 'scoreline_points_margin', 'scoreline_points_incorrect',
        'max_base_score',
      ], glMap)}

      ${renderSection('Probability', [
        'probability_threshold', 'probability_points_pass', 'probability_points_fail',
      ], glMap)}

      ${renderSection('Player Performance', [
        'player_points_exact', 'player_points_close', 'player_points_wrong',
        'player_avg_threshold_exact', 'player_avg_threshold_close',
      ], glMap)}

      ${renderSection('Technical Evaluation', [
        'technical_max_per_category', 'technical_max_total',
      ], glMap)}

      ${renderSection('Presentation Evaluation', [
        'presentation_ai_explanation_max', 'presentation_qa_score_max', 'presentation_delivery_score_max',
        'presentation_denominator', 'presentation_max_marks',
      ], glMap)}

      ${renderSection('Grade Multipliers', [
        'multiplier_a', 'multiplier_b', 'multiplier_c',
      ], glMap)}

      ${renderSection('Phase Normalization', [
        'phase1_max_marks',
      ], glMap)}

      <div style="display:flex;gap:var(--space-md);margin-top:var(--space-xl);padding-bottom:var(--space-2xl)">
        <button class="btn btn-primary" onclick="saveScoringConfig()">💾 Save Changes</button>
        <button class="btn btn-ghost" onclick="resetScoringConfig()">↺ Reset to Default</button>
      </div>
    `;

  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Failed to load scoring config: ${err.message}</div>`;
  }
}

function renderSection(title, keys, glMap) {
  const rows = keys.map(k => {
    const gl = glMap[k];
    const val = _scConfig[k];
    const isFloat = typeof val === 'number' && !Number.isInteger(val);
    return `
      <div class="form-group" style="margin-bottom:var(--space-md)">
        <label class="form-label" style="display:flex;flex-direction:column;gap:2px">
          <span>${gl ? gl.label : k}</span>
          <span style="font-weight:400;font-size:var(--text-xs);color:var(--color-text-muted)">${gl ? gl.description : ''}</span>
        </label>
        <input class="form-input config-input" data-key="${k}" type="number" step="${isFloat ? 'any' : '1'}"
               value="${val}" style="max-width:180px">
      </div>`;
  }).join('');

  return `<div class="card config-section" style="margin-bottom:var(--space-lg)">
    <div class="card-header"><span class="card-title">${title}</span></div>
    <div style="padding:var(--space-md);display:grid;grid-template-columns:repeat(auto-fill,minmax(340px,1fr));gap:var(--space-sm)">${rows}</div>
  </div>`;
}

function collectConfigFromForm() {
  const inputs = document.querySelectorAll('.config-input');
  const data = {};
  inputs.forEach(inp => {
    const key = inp.dataset.key;
    const raw = inp.value;
    const original = _scConfig[key];
    if (typeof original === 'number' && !Number.isInteger(original)) {
      data[key] = parseFloat(raw);
    } else if (Number.isInteger(original)) {
      data[key] = parseInt(raw, 10);
    } else {
      data[key] = raw;
    }
  });
  return data;
}

async function saveScoringConfig() {
  const data = collectConfigFromForm();
  const configId = _scConfig.id;
  if (!configId) { Toast.error('No active config to update'); return; }

  try {
    await Api.put(`/admin/scoring-config/${configId}`, data);
    Toast.success('Scoring configuration updated');
    await loadScoringConfig();
  } catch (err) {
    Toast.error(err.message || 'Failed to update config');
  }
}

async function resetScoringConfig() {
  Modal.confirm('Reset all scoring rules to their default values? This will activate the default configuration.', async () => {
    try {
      await Api.post('/admin/scoring-config/reset');
      Toast.success('Reset to default configuration');
      await loadScoringConfig();
    } catch (err) {
      Toast.error(err.message || 'Failed to reset config');
    }
  });
}
