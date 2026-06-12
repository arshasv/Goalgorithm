/* Teams & Organizer Team Management */

Router.register('org-teams', async () => {
  const main = document.getElementById('page-content');
  if (!Auth.isOrganizer()) {
    main.innerHTML = '<div class="empty-state"><div class="empty-icon">🔒</div><h2 class="empty-title">Access Denied</h2></div>';
    return;
  }

  main.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Registered Teams</h1>
        <p class="page-subtitle">View all teams, members, and submitted predictions</p>
      </div>
      <div class="page-header-actions" style="display:flex;gap:var(--space-sm)">
        <button class="btn btn-secondary" onclick="document.getElementById('csv-file-input').click()">📁 Upload Members (CSV/Excel)</button>
        <input type="file" id="csv-file-input" accept=".csv,.xls,.xlsx" style="display:none" onchange="uploadMembersCsv(event)">
        <button class="btn btn-secondary" onclick="loadOrgTeams()">🔄 Refresh</button>
      </div>
    </div>
    <div id="org-teams-content">${Utils.skeletonCards(5)}</div>
  `;

  await loadOrgTeams();
});



async function loadOrgTeams() {
  const container = document.getElementById('org-teams-content');
  if (!container) return;

  try {
    let teams = await TeamService.listTeams();
    if (DEMO_MODE && !teams.length) teams = MockData.teams;
    if (!teams.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><h2 class="empty-title">No Teams Registered</h2><p class="empty-desc">Teams will appear here once team leaders register.</p></div>';
      return;
    }

    container.innerHTML = `<div class="grid-3" id="org-teams-grid">
      ${teams.map((t, i) => `
        <div class="card" style="animation:fadeInUp ${0.3 + i * 0.1}s ease-out both;cursor:pointer" onclick="showOrgTeamDetail('${t.id}')">
          <div class="card-header">
            <div class="card-title">${Utils.teamBadge(t.name, 40)} Team ${t.team_id || t.code} — ${t.name}</div>
            <span class="badge ${t.is_active ? 'badge-success' : 'badge-error'}">${t.is_active ? 'Active' : 'Inactive'}</span>
          </div>
          <div style="padding:var(--space-md)">
            <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-sm);font-size:var(--text-sm)">
              <span style="color:var(--color-text-muted)">Code</span>
              <span style="font-family:var(--font-data)">${t.code}</span>
            </div>
            ${t.team_leader_name ? `
            <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-sm);font-size:var(--text-sm)">
              <span style="color:var(--color-text-muted)">Leader</span>
              <span>${t.team_leader_name}</span>
            </div>` : ''}
            <div style="display:flex;justify-content:space-between;font-size:var(--text-sm)">
              <span style="color:var(--color-text-muted)">Members</span>
              <span>${(t.members || []).length}</span>
            </div>
          </div>
        </div>
      `).join('')}
    </div>`;

    Utils.staggerChildren('#org-teams-grid');

  } catch(err) {
    container.innerHTML = `<div class="alert alert-error">Failed to load teams: ${err.message}</div>`;
  }
}

async function showOrgTeamDetail(teamId) {
  try {
    const teams = await TeamService.listTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team) { Toast.error('Team not found'); return; }

    const members = (team.members || []).map(m => `
      <tr><td>${m.name}</td><td>${m.employee_id || '—'}</td></tr>
    `).join('');

    Modal.show(`
      <div style="min-width:500px">
        <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-lg)">
          ${Utils.teamBadge(team.name, 56)}
          <div>
            <h3 style="font-family:var(--font-display);font-size:var(--text-xl)">Team ${team.team_id || team.code} — ${team.name}</h3>
          </div>
        </div>
        ${team.team_leader_name ? `<p style="margin-bottom:var(--space-md)"><strong>Leader:</strong> ${team.team_leader_name}</p>` : ''}
        <h4 style="font-family:var(--font-display);font-size:var(--text-base);text-transform:uppercase;margin-bottom:var(--space-sm);color:var(--color-text-muted)">Members</h4>
        <div class="table-wrapper">
          <table>
            <thead><tr><th>Name</th><th>Employee ID</th></tr></thead>
            <tbody>${members || '<tr><td colspan="2" style="text-align:center;color:var(--color-text-muted)">No members</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `, `${team.name} — Team Details`);

  } catch(err) {
    Toast.error(err.message || 'Failed to load team details');
  }
}

/* Original teams page — static mock (kept as fallback) */
Router.register('teams', async () => {
  const main = document.getElementById('page-content');
  if (!Auth.isOrganizer()) {
    Router.navigate('org-teams');
    return;
  }
  Router.navigate('org-teams');
});

async function uploadMembersCsv(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext !== 'csv' && ext !== 'xls' && ext !== 'xlsx') {
    Toast.error('Invalid file format. Please select a CSV or Excel file (.csv, .xls, .xlsx)');
    event.target.value = '';
    return;
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    Toast.info('Uploading file...');
    const res = await TeamService.uploadMembersCsv(formData);
    Toast.success(res.message || 'File uploaded successfully');
    await loadOrgTeams();
  } catch (err) {
    Toast.error(err.message || 'Failed to upload file');
  } finally {
    event.target.value = ''; // Reset file input
  }
}
