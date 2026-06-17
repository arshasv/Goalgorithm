/* Teams & Organizer Team Management */

Router.register('teams', async () => {
  const main = document.getElementById('page-content');
  if (!Auth.isOrganizer()) {
    main.innerHTML = '<div class="empty-state"><div class="empty-icon">🔒</div><h2 class="empty-title">Access Denied</h2></div>';
    return;
  }

  main.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">Registered Teams</h1>
        <p class="page-subtitle">Manage teams — codes, names, and leaders</p>
      </div>
      <div class="page-header-actions" style="display:flex;gap:var(--space-sm)">
        <button class="btn btn-primary" onclick="showCreateTeamModal()">+ Create Team</button>
        <button class="btn btn-secondary" onclick="document.getElementById('csv-file-input').click()">📁 Upload Teams (CSV/Excel)</button>
        <input type="file" id="csv-file-input" accept=".csv,.xlsx" style="display:none" onchange="uploadTeamsCsv(event)">
        <button class="btn btn-secondary" onclick="loadOrgTeams()">🔄 Refresh</button>
      </div>
    </div>
    <div id="org-teams-content">${Utils.skeletonCards(5)}</div>
  `;

  await loadOrgTeams();
});

function showCreateTeamModal() {
  Modal.show(`
    <div style="min-width:400px">
      <h3 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-lg)">Create New Team</h3>
      <div style="display:flex;flex-direction:column;gap:var(--space-md)">
        <label>
          <span style="display:block;margin-bottom:var(--space-xs);font-size:var(--text-sm);color:var(--color-text-muted)">Team Code</span>
          <select id="create-team-code" class="input" style="width:100%">
            <option value="">Select code...</option>
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
            <option value="D">D</option>
            <option value="E">E</option>
          </select>
        </label>
        <label>
          <span style="display:block;margin-bottom:var(--space-xs);font-size:var(--text-sm);color:var(--color-text-muted)">Team Name</span>
          <input id="create-team-name" class="input" type="text" placeholder="e.g. Prediction Masters" style="width:100%">
        </label>
        <label>
          <span style="display:block;margin-bottom:var(--space-xs);font-size:var(--text-sm);color:var(--color-text-muted)">Team Leader</span>
          <input id="create-team-leader" class="input" type="text" placeholder="e.g. John Doe" style="width:100%">
        </label>
      </div>
      <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-lg);justify-content:flex-end">
        <button class="btn btn-secondary" onclick="Modal.close()">Cancel</button>
        <button class="btn btn-primary" onclick="createTeam()">Create Team</button>
      </div>
    </div>
  `, 'Create Team');
}

async function createTeam() {
  const teamCode = document.getElementById('create-team-code').value;
  const teamName = document.getElementById('create-team-name').value.trim();
  const teamLeader = document.getElementById('create-team-leader').value.trim();

  if (!teamCode) { Toast.error('Please select a team code'); return; }
  if (!teamName) { Toast.error('Please enter a team name'); return; }

  try {
    Toast.info('Creating team...');
    await TeamService.createTeam({ team_code: teamCode, team_name: teamName, team_leader: teamLeader || '' });
    Toast.success('Team created successfully');
    Modal.close();
    await loadOrgTeams();
  } catch (err) {
    Toast.error(err.message || 'Failed to create team');
  }
}


async function loadOrgTeams() {
  const container = document.getElementById('org-teams-content');
  if (!container) return;

  try {
    let teams = await TeamService.listTeams();
    if (DEMO_MODE && !teams.length) teams = MockData.teams;
    if (!teams.length) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">👥</div><h2 class="empty-title">No Teams Registered</h2><p class="empty-desc">Teams will appear here once created.</p></div>';
      return;
    }

    container.innerHTML = `<div class="grid-3" id="org-teams-grid">
      ${teams.map((t, i) => `
        <div class="card" style="animation:fadeInUp ${0.3 + i * 0.1}s ease-out both;cursor:pointer" onclick="showOrgTeamDetail('${t.id}')">
          <div class="card-header">
            <div class="card-title">${Utils.teamBadge(t.name, 40)} <span>${Utils.formatTeamDisplay(t)}</span></div>
            <span class="badge ${t.is_active ? 'badge-success' : 'badge-error'}">${t.is_active ? 'Active' : 'Inactive'}</span>
          </div>
          <div style="padding:var(--space-md)">
            <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-sm);font-size:var(--text-sm)">
              <span style="color:var(--color-text-muted)">Code</span>
              <span style="font-family:var(--font-data)">${t.team_code || t.code}</span>
            </div>
            <div style="display:flex;justify-content:space-between;margin-bottom:var(--space-sm);font-size:var(--text-sm)">
              <span style="color:var(--color-text-muted)">Leader</span>
              <span>${t.team_leader || t.team_leader_name || '—'}</span>
            </div>
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

    const teamCode = team.team_code || team.team_id || team.code;
    const teamName = team.team_name || team.name;
    const teamLeader = team.team_leader || team.team_leader_name || '';

    const members = (team.members || []).map(m => `
      <tr>
        <td>${m.name}</td>
        <td>${m.employee_id || '—'}</td>
        <td style="text-align:right">
          <button class="btn btn-ghost btn-sm" onclick="showOrgEditMemberForm('${team.id}', '${m.id}', '${m.name.replace(/'/g, "\\'")}', '${(m.employee_id || '').replace(/'/g, "\\'")}')" title="Edit Member">✏️</button>
          <button class="btn btn-ghost btn-sm" onclick="removeOrgMember('${team.id}', '${m.id}', '${m.name.replace(/'/g, "\\'")}')" title="Remove Member">🗑️</button>
        </td>
      </tr>
    `).join('');

    Modal.show(`
      <div style="min-width:500px">
        <div id="team-detail-view">
          <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-lg)">
            ${Utils.teamBadge(team.name, 56)}
            <div>
              <h3 style="font-family:var(--font-display);font-size:var(--text-xl)">${Utils.formatTeamDisplay(team)}</h3>
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:var(--space-md);margin-bottom:var(--space-lg)">
            <div>
              <span style="display:block;font-size:var(--text-sm);color:var(--color-text-muted)">Team Code</span>
              <span id="detail-team-code" style="font-family:var(--font-data);font-size:var(--text-base)">${teamCode}</span>
            </div>
            <div>
              <span style="display:block;font-size:var(--text-sm);color:var(--color-text-muted)">Team Name</span>
              <span id="detail-team-name" style="font-size:var(--text-base)">${teamName || ''}</span>
            </div>
            <div>
              <span style="display:block;font-size:var(--text-sm);color:var(--color-text-muted)">Team Leader</span>
              <span id="detail-team-leader" style="font-size:var(--text-base)">${teamLeader || '—'}</span>
            </div>
            <div>
              <span style="display:block;font-size:var(--text-sm);color:var(--color-text-muted)">Status</span>
              <span class="badge ${team.is_active ? 'badge-success' : 'badge-error'}">${team.is_active ? 'Active' : 'Inactive'}</span>
            </div>
          </div>

          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--space-sm)">
            <h4 style="font-family:var(--font-display);font-size:var(--text-base);text-transform:uppercase;color:var(--color-text-muted);margin:0">Members</h4>
            <button class="btn btn-primary btn-sm" onclick="showOrgAddMemberForm('${team.id}')">+ Add Member</button>
          </div>

          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  <th style="text-align:right;width:80px"></th>
                </tr>
              </thead>
              <tbody>${members || `<tr><td colspan="3" style="text-align:center;color:var(--color-text-muted)">No members</td></tr>`}</tbody>
            </table>
          </div>
          <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-lg);justify-content:flex-end">
            <button class="btn btn-secondary" onclick="editTeamDetail('${team.id}')">✏️ Edit Team</button>
          </div>
        </div>
      </div>
    `, `${Utils.formatTeamDisplay(team)}`);

    window._editTeamId = team.id;

  } catch(err) {
    Toast.error(err.message || 'Failed to load team details');
  }
}

function showOrgAddMemberForm(teamId) {
  const view = document.getElementById('team-detail-view');
  if (!view) return;
  view.innerHTML = `
    <h3 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-md)">Add Team Member</h3>
    <div style="display:flex;flex-direction:column;gap:var(--space-md)">
      <label>
        <span style="display:block;margin-bottom:var(--space-xs);font-size:var(--text-sm);color:var(--color-text-muted)">Name *</span>
        <input id="org-am-name" class="input" type="text" placeholder="Full name" style="width:100%">
      </label>
      <label>
        <span style="display:block;margin-bottom:var(--space-xs);font-size:var(--text-sm);color:var(--color-text-muted)">Employee ID</span>
        <input id="org-am-empid" class="input" type="text" placeholder="Employee ID (optional)" style="width:100%">
      </label>
    </div>
    <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-lg);justify-content:flex-end">
      <button class="btn btn-secondary" onclick="showOrgTeamDetail('${teamId}')">Cancel</button>
      <button class="btn btn-primary" onclick="submitOrgAddMember('${teamId}')">Add Member</button>
    </div>
  `;
}

async function submitOrgAddMember(teamId) {
  const name = document.getElementById('org-am-name')?.value.trim();
  const empId = document.getElementById('org-am-empid')?.value.trim() || null;
  if (!name) { Toast.error('Name is required'); return; }
  try {
    Toast.info('Adding member...');
    await TeamService.addTeamMemberAdmin(teamId, { name, employee_id: empId });
    Toast.success('Member added successfully');
    await showOrgTeamDetail(teamId);
    await loadOrgTeams();
  } catch (err) {
    Toast.error(err.message || 'Failed to add member');
  }
}

function showOrgEditMemberForm(teamId, memberId, currentName, currentEmpId) {
  const view = document.getElementById('team-detail-view');
  if (!view) return;
  view.innerHTML = `
    <h3 style="font-family:var(--font-display);font-size:var(--text-lg);margin-bottom:var(--space-md)">Edit Team Member</h3>
    <div style="display:flex;flex-direction:column;gap:var(--space-md)">
      <label>
        <span style="display:block;margin-bottom:var(--space-xs);font-size:var(--text-sm);color:var(--color-text-muted)">Name *</span>
        <input id="org-em-name" class="input" type="text" value="${currentName}" style="width:100%">
      </label>
      <label>
        <span style="display:block;margin-bottom:var(--space-xs);font-size:var(--text-sm);color:var(--color-text-muted)">Employee ID</span>
        <input id="org-em-empid" class="input" type="text" value="${currentEmpId === 'null' || !currentEmpId ? '' : currentEmpId}" style="width:100%">
      </label>
    </div>
    <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-lg);justify-content:flex-end">
      <button class="btn btn-secondary" onclick="showOrgTeamDetail('${teamId}')">Cancel</button>
      <button class="btn btn-primary" onclick="submitOrgEditMember('${teamId}', '${memberId}')">Save Changes</button>
    </div>
  `;
}

async function submitOrgEditMember(teamId, memberId) {
  const name = document.getElementById('org-em-name')?.value.trim();
  const empId = document.getElementById('org-em-empid')?.value.trim() || null;
  if (!name) { Toast.error('Name is required'); return; }
  try {
    Toast.info('Saving changes...');
    await TeamService.updateTeamMemberAdmin(teamId, memberId, { name, employee_id: empId });
    Toast.success('Member details updated');
    await showOrgTeamDetail(teamId);
    await loadOrgTeams();
  } catch (err) {
    Toast.error(err.message || 'Failed to update member');
  }
}

async function removeOrgMember(teamId, memberId, name) {
  Modal.confirm(`Remove ${name} from this team?`, async () => {
    try {
      Toast.info('Removing member...');
      await TeamService.removeTeamMemberAdmin(teamId, memberId);
      Toast.success('Member removed');
      await showOrgTeamDetail(teamId);
      await loadOrgTeams();
    } catch (err) {
      Toast.error(err.message || 'Failed to remove member');
    }
  }, 'Remove Member');
}

async function editTeamDetail(teamId) {
  try {
    const teams = await TeamService.listTeams();
    const team = teams.find(t => t.id === teamId);
    if (!team) { Toast.error('Team not found'); return; }

    const currentCode = team.team_code || team.team_id || team.code;
    const currentName = team.team_name || team.name;
    const currentLeader = team.team_leader || team.team_leader_name || '';

    window._editTeamId = teamId;
    window._editTeamMembers = JSON.parse(JSON.stringify(team.members || []));

    renderEditTeamModal(teamId, currentCode, currentName, currentLeader, team.is_active);
  } catch(err) {
    Toast.error(err.message || 'Failed to load team for editing');
  }
}

function renderEditTeamModal(teamId, currentCode, currentName, currentLeader, isActive) {
  const view = document.getElementById('team-detail-view');
  if (!view) return;

  const membersHtml = `
      <div class="table-wrapper" style="margin-top:var(--space-sm); max-height:200px; overflow-y:auto">
        <table>
          <thead>
            <tr><th>Name</th><th>Employee ID</th><th style="width:40px"></th></tr>
          </thead>
          <tbody id="edit-team-members-tbody">
            ${window._editTeamMembers.map((m, i) => `
              <tr>
                <td><input type="text" class="input" style="width:100%" value="${m.name}" onchange="window._editTeamMembers[${i}].name=this.value"></td>
                <td><input type="text" class="input" style="width:100%" value="${m.employee_id || ''}" onchange="window._editTeamMembers[${i}].employee_id=this.value"></td>
                <td><button class="btn btn-ghost btn-sm" onclick="removeEditTeamMember(${i})" title="Remove">🗑️</button></td>
              </tr>
            `).join('')}
            <tr>
              <td><input type="text" class="input" id="new-member-name" style="width:100%" placeholder="New member name"></td>
              <td><input type="text" class="input" id="new-member-empid" style="width:100%" placeholder="Employee ID"></td>
              <td><button class="btn btn-primary btn-sm" onclick="addEditTeamMember()">Add</button></td>
            </tr>
          </tbody>
        </table>
      </div>
    `;

  view.innerHTML = `
    <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-lg)">
      ${Utils.teamBadge(currentName, 56)}
      <div>
        <h3 style="font-family:var(--font-display);font-size:var(--text-xl)">Edit Team</h3>
      </div>
    </div>
    <div style="display:flex;flex-direction:column;gap:var(--space-md)">
      <label>
        <span style="display:block;margin-bottom:var(--space-xs);font-size:var(--text-sm);color:var(--color-text-muted)">Team Code</span>
        <select id="edit-team-code" class="input" style="width:100%">
          <option value="A" ${currentCode === 'A' ? 'selected' : ''}>A</option>
          <option value="B" ${currentCode === 'B' ? 'selected' : ''}>B</option>
          <option value="C" ${currentCode === 'C' ? 'selected' : ''}>C</option>
          <option value="D" ${currentCode === 'D' ? 'selected' : ''}>D</option>
          <option value="E" ${currentCode === 'E' ? 'selected' : ''}>E</option>
        </select>
      </label>
      <label>
        <span style="display:block;margin-bottom:var(--space-xs);font-size:var(--text-sm);color:var(--color-text-muted)">Team Name</span>
        <input id="edit-team-name" class="input" type="text" value="${currentName}" style="width:100%">
      </label>
      <label>
        <span style="display:block;margin-bottom:var(--space-xs);font-size:var(--text-sm);color:var(--color-text-muted)">Team Leader</span>
        <input id="edit-team-leader" class="input" type="text" value="${currentLeader}" style="width:100%">
      </label>
      <label style="display:flex;align-items:center;gap:var(--space-sm)">
        <input id="edit-team-active" type="checkbox" ${isActive ? 'checked' : ''}>
        <span style="font-size:var(--text-sm)">Active</span>
      </label>
      
      <div style="margin-top:var(--space-md)">
        <h4 style="font-family:var(--font-display);font-size:var(--text-base);margin:0">Team Members</h4>
        ${membersHtml}
      </div>
    </div>
    <div style="display:flex;gap:var(--space-sm);margin-top:var(--space-lg);justify-content:flex-end">
      <button class="btn btn-secondary" onclick="showOrgTeamDetail('${teamId}')">Cancel</button>
      <button class="btn btn-primary" onclick="saveTeamEdit('${teamId}')">Save Changes</button>
    </div>
  `;
}

function addEditTeamMember() {
  const nameEl = document.getElementById('new-member-name');
  const empIdEl = document.getElementById('new-member-empid');
  const name = nameEl.value.trim();
  const empId = empIdEl.value.trim() || null;
  if (!name) { Toast.error('Name is required'); return; }
  window._editTeamMembers.push({ id: null, name, employee_id: empId });
  
  const currentCode = document.getElementById('edit-team-code').value;
  const currentName = document.getElementById('edit-team-name').value;
  const currentLeader = document.getElementById('edit-team-leader').value;
  const isActive = document.getElementById('edit-team-active').checked;
  renderEditTeamModal(window._editTeamId, currentCode, currentName, currentLeader, isActive);
}

function removeEditTeamMember(index) {
  window._editTeamMembers.splice(index, 1);
  const currentCode = document.getElementById('edit-team-code').value;
  const currentName = document.getElementById('edit-team-name').value;
  const currentLeader = document.getElementById('edit-team-leader').value;
  const isActive = document.getElementById('edit-team-active').checked;
  renderEditTeamModal(window._editTeamId, currentCode, currentName, currentLeader, isActive);
}

async function saveTeamEdit(teamId) {
  const teamCode = document.getElementById('edit-team-code').value;
  const teamName = document.getElementById('edit-team-name').value.trim();
  const teamLeader = document.getElementById('edit-team-leader').value.trim();
  const isActive = document.getElementById('edit-team-active').checked;

  if (!teamCode) { Toast.error('Please select a team code'); return; }
  if (!teamName) { Toast.error('Please enter a team name'); return; }

  const payload = {
    team_code: teamCode,
    name: teamName,
    team_leader_name: teamLeader || '',
    is_active: isActive,
  };

  payload.members = window._editTeamMembers.map(m => ({
    id: m.id,
    name: m.name,
    employee_id: m.employee_id
  }));

  try {
    Toast.info('Saving changes...');
    await TeamService.updateTeam(teamId, payload);
    Toast.success('Team updated successfully');
    await showOrgTeamDetail(teamId);
    await loadOrgTeams();
  } catch (err) {
    Toast.error(err.message || 'Failed to update team');
  }
}


async function uploadTeamsCsv(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const ext = file.name.split('.').pop().toLowerCase();
  if (ext !== 'csv' && ext !== 'xlsx') {
    Toast.error('Invalid file format. Please select a CSV or Excel file (.csv, .xlsx)');
    event.target.value = '';
    return;
  }
  
  const formData = new FormData();
  formData.append('file', file);
  
  try {
    Toast.info('Uploading file...');
    const res = await TeamService.uploadTeamsCsv(formData);
    Toast.success(res.message || 'File uploaded successfully');
    await loadOrgTeams();
  } catch (err) {
    Toast.error(err.message || 'Failed to upload file');
  } finally {
    event.target.value = '';
  }
}
