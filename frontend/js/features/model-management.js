/* Organizer Model Management Page */

Router.register('prediction-upload', async () => {
  const main = document.getElementById('page-content');
  if (!Auth.isOrganizer()) {
    main.innerHTML = '<div class="empty-state"><div class="empty-icon">🔒</div><h2 class="empty-title">Access Denied</h2></div>';
    return;
  }

  main.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">🤖 Model Management</h1>
        <p class="page-subtitle">Configure upload windows and download team model submissions</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="loadModelManagement()">🔄 Refresh</button>
      </div>
    </div>
    
    <!-- Upload Window Config Section -->
    <div class="card" style="margin-bottom:var(--space-lg); padding:var(--space-md);">
      <h3 style="margin-bottom:var(--space-sm)">Model Submission Window</h3>
      <div style="display:flex; gap:var(--space-md); align-items:flex-end; flex-wrap:wrap;">
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Status</label>
          <select id="upload-window-enabled" class="form-input">
            <option value="false">Disabled</option>
            <option value="true">Enabled</option>
          </select>
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">Start Time (UTC)</label>
          <input type="datetime-local" id="upload-window-start" class="form-input">
        </div>
        <div class="form-group" style="margin-bottom:0">
          <label class="form-label">End Time (UTC)</label>
          <input type="datetime-local" id="upload-window-end" class="form-input">
        </div>
        <button class="btn btn-primary" onclick="saveUploadWindow()">Save Window Settings</button>
      </div>
    </div>

    <!-- Submissions List -->
    <div class="card">
      <div class="card-header">
        <h3 class="card-title">Team Submissions</h3>
      </div>
      <div id="model-submissions-content" style="padding:var(--space-md);">
        ${Utils.skeletonCards(3)}
      </div>
    </div>
  `;

  await loadUploadWindow();
  await loadModelManagement();
});

async function loadUploadWindow() {
  try {
    const windowConfig = await UploadWindowService.get();
    if (windowConfig) {
      document.getElementById('upload-window-enabled').value = windowConfig.is_enabled ? 'true' : 'false';
      if (windowConfig.start_time) {
        document.getElementById('upload-window-start').value = new Date(windowConfig.start_time).toISOString().slice(0, 16);
      }
      if (windowConfig.end_time) {
        document.getElementById('upload-window-end').value = new Date(windowConfig.end_time).toISOString().slice(0, 16);
      }
    }
  } catch(err) {
    console.error('Failed to load upload window config', err);
  }
}

async function saveUploadWindow() {
  try {
    const is_enabled = document.getElementById('upload-window-enabled').value === 'true';
    const start_val = document.getElementById('upload-window-start').value;
    const end_val = document.getElementById('upload-window-end').value;
    
    const data = {
      is_enabled,
      start_time: start_val ? new Date(start_val).toISOString() : null,
      end_time: end_val ? new Date(end_val).toISOString() : null,
    };
    
    await UploadWindowService.update(data);
    Toast.success('Upload window settings saved');
  } catch(err) {
    Toast.error(err.message || 'Failed to save settings');
  }
}

async function loadModelManagement() {
  const container = document.getElementById('model-submissions-content');
  if (!container) return;

  try {
    const [teams, submissionsResp] = await Promise.all([
      TeamService.listTeams(),
      ModelSubmissionService.listAll()
    ]);
    
    const submissions = submissionsResp.submissions || [];

    if (!teams.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><h2 class="empty-title">No Teams Registered</h2></div>';
      return;
    }

    const teamSubMap = {};
    submissions.forEach(sub => {
      if (!teamSubMap[sub.team_id]) {
        teamSubMap[sub.team_id] = [];
      }
      teamSubMap[sub.team_id].push(sub);
    });

    const rows = teams.flatMap(t => {
      const subs = teamSubMap[t.id] || [];
      if (subs.length === 0) {
        return `
          <tr>
            <td>
              <div style="display:flex;align-items:center;gap:var(--space-sm)">
                ${Utils.teamBadge(t.name, 24)}
                <div>
                  <div style="font-weight:500">${Utils.formatTeamDisplay(t)}</div>
                </div>
              </div>
            </td>
            <td><span class="badge badge-error">Missing</span></td>
            <td><span style="color:var(--color-text-muted)">—</span></td>
            <td><span style="color:var(--color-text-muted)">—</span></td>
            <td></td>
          </tr>
        `;
      }
      
      return subs.map((sub, idx) => {
        const isLatest = sub.is_active;
        const statusBadge = isLatest 
          ? '<span class="badge badge-success">Latest Submission</span>' 
          : '<span class="badge badge-info">Archived</span>';
        
        const fileInfo = `<div>${sub.file_name}</div><div style="font-size:var(--text-xs);color:var(--color-text-muted)">${(sub.file_size / 1024 / 1024).toFixed(2)} MB • Uploaded: ${new Date(sub.uploaded_at).toLocaleString()}</div>`;
          
        const action = `<button class="btn btn-sm btn-secondary" onclick="ModelSubmissionService.downloadModel('${sub.id}', '${sub.file_name}')">📥 Download</button>`;

        const bg = isLatest ? 'background:var(--color-bg-secondary)' : '';

        return `
          <tr style="${bg}">
            <td>
              <div style="display:flex;align-items:center;gap:var(--space-sm)">
                ${idx === 0 ? Utils.teamBadge(t.name, 24) : '<div style="width:24px"></div>'}
                <div>
                  <div style="font-weight:500">${idx === 0 ? Utils.formatTeamDisplay(t) : ''}</div>
                </div>
              </div>
            </td>
            <td>${statusBadge}</td>
            <td>${fileInfo}</td>
            <td>v${subs.length - idx}</td>
            <td>${action}</td>
          </tr>
        `;
      });
    }).join('');

    container.innerHTML = `
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Team</th>
              <th>Status</th>
              <th>File</th>
              <th>Version</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            ${rows}
          </tbody>
        </table>
      </div>
    `;

  } catch(err) {
    container.innerHTML = `<div class="alert alert-error">Failed to load data: ${err.message}</div>`;
  }
}
