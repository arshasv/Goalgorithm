import React, { useState, useEffect } from 'react';
import { TeamService } from '../../api/teamService';

const TeamDetailModal = ({ team, isOpen, onClose, onTeamUpdated }) => {
  const [mode, setMode] = useState('view'); // view, edit, add_member, edit_member
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Edit Team State
  const [editCode, setEditCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editLeader, setEditLeader] = useState('');
  const [editActive, setEditActive] = useState(false);
  const [editMembers, setEditMembers] = useState([]);
  
  // Member Form State
  const [memberForm, setMemberForm] = useState({ id: null, name: '', employee_id: '' });

  useEffect(() => {
    if (isOpen && team) {
      setMode('view');
      setError('');
    }
  }, [isOpen, team]);

  const startEditTeam = () => {
    setEditCode(team.team_code || team.team_id || team.code);
    setEditName(team.team_name || team.name);
    setEditLeader(team.team_leader || team.team_leader_name || '');
    setEditActive(team.is_active);
    setEditMembers(JSON.parse(JSON.stringify(team.members || [])));
    setMode('edit');
  };

  const handleSaveTeamEdit = async () => {
    setError('');
    if (!editCode) { setError('Please select a team code'); return; }
    if (!editName) { setError('Please enter a team name'); return; }

    setIsSubmitting(true);
    try {
      await TeamService.updateTeam(team.id, {
        team_code: editCode,
        name: editName,
        team_leader_name: editLeader,
        is_active: editActive,
        members: editMembers.map(m => ({ id: m.id, name: m.name, employee_id: m.employee_id }))
      });
      onTeamUpdated();
      setMode('view');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitMemberAction = async () => {
    if (!memberForm.name) { setError('Name is required'); return; }
    setIsSubmitting(true);
    try {
      if (mode === 'add_member') {
        await TeamService.addTeamMemberAdmin(team.id, { name: memberForm.name, employee_id: memberForm.employee_id || null });
      } else if (mode === 'edit_member') {
        await TeamService.updateTeamMemberAdmin(team.id, memberForm.id, { name: memberForm.name, employee_id: memberForm.employee_id || null });
      }
      onTeamUpdated();
      setMode('view');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to save member');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeMemberAdmin = async (memberId, memberName) => {
    if (!window.confirm(`Remove ${memberName} from this team?`)) return;
    try {
      await TeamService.removeTeamMemberAdmin(team.id, memberId);
      onTeamUpdated();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to remove member');
    }
  };

  // UI Helpers
  const formatBadge = (name, size) => (
    <div style={{
      width: size, height: size, borderRadius: '50%', background: 'var(--color-primary)', 
      color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: size * 0.4, fontWeight: 'bold'
    }}>
      {name ? name[0].toUpperCase() : 'T'}
    </div>
  );

  if (!isOpen || !team) return null;

  const teamCode = team.team_code || team.team_id || team.code;
  const teamName = team.team_name || team.name;
  const teamLeader = team.team_leader || team.team_leader_name || '—';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ minWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{teamName}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

          {/* VIEW MODE */}
          {mode === 'view' && (
            <div id="team-detail-view">
              <div style={{display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)'}}>
                {formatBadge(teamName, 56)}
                <div>
                  <h3 style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)'}}>Group {teamCode} - {teamName}</h3>
                </div>
              </div>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)'}}>
                <div>
                  <span style={{display: 'block', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Team Code</span>
                  <span style={{fontFamily: 'var(--font-data)', fontSize: 'var(--text-base)'}}>{teamCode}</span>
                </div>
                <div>
                  <span style={{display: 'block', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Team Name</span>
                  <span style={{fontSize: 'var(--text-base)'}}>{teamName}</span>
                </div>
                <div>
                  <span style={{display: 'block', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Team Leader</span>
                  <span style={{fontSize: 'var(--text-base)'}}>{teamLeader}</span>
                </div>
                <div>
                  <span style={{display: 'block', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Status</span>
                  <span className={`badge ${team.is_active ? 'badge-success' : 'badge-error'}`}>{team.is_active ? 'Active' : 'Inactive'}</span>
                </div>
              </div>

              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)'}}>
                <h4 style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: 0}}>Members</h4>
                <button className="btn btn-primary btn-sm" onClick={() => { setMemberForm({id:null, name:'', employee_id:''}); setMode('add_member'); }}>+ Add Member</button>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Employee ID</th>
                      <th style={{textAlign: 'right', width: '80px'}}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {(!team.members || team.members.length === 0) ? (
                      <tr><td colSpan="3" style={{textAlign: 'center', color: 'var(--color-text-muted)'}}>No members</td></tr>
                    ) : (
                      team.members.map(m => (
                        <tr key={m.id}>
                          <td>{m.name}</td>
                          <td>{m.employee_id || '—'}</td>
                          <td style={{textAlign: 'right'}}>
                            <button className="btn btn-ghost btn-sm" title="Edit Member" onClick={() => {
                              setMemberForm({ id: m.id, name: m.name, employee_id: m.employee_id || '' });
                              setMode('edit_member');
                            }}>✏️</button>
                            <button className="btn btn-ghost btn-sm" title="Remove Member" onClick={() => removeMemberAdmin(m.id, m.name)}>🗑️</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div style={{display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', justifyContent: 'flex-end'}}>
                <button className="btn btn-secondary" onClick={startEditTeam}>✏️ Edit Team</button>
              </div>
            </div>
          )}

          {/* EDIT TEAM MODE */}
          {mode === 'edit' && (
            <div>
              <div style={{display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)'}}>
                {formatBadge(editName, 56)}
                <div><h3 style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)'}}>Edit Team</h3></div>
              </div>
              <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-md)'}}>
                <label>
                  <span style={{display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Team Code</span>
                  <select className="input" style={{width: '100%'}} value={editCode} onChange={e => setEditCode(e.target.value)}>
                    <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option><option value="E">E</option>
                  </select>
                </label>
                <label>
                  <span style={{display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Team Name</span>
                  <input className="input" type="text" value={editName} onChange={e => setEditName(e.target.value)} style={{width: '100%'}} />
                </label>
                <label>
                  <span style={{display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Team Leader</span>
                  <input className="input" type="text" value={editLeader} onChange={e => setEditLeader(e.target.value)} style={{width: '100%'}} />
                </label>
                <label style={{display: 'flex', alignItems: 'center', gap: 'var(--space-sm)'}}>
                  <input type="checkbox" checked={editActive} onChange={e => setEditActive(e.target.checked)} />
                  <span style={{fontSize: 'var(--text-sm)'}}>Active</span>
                </label>
                
                <div style={{marginTop: 'var(--space-md)'}}>
                  <h4 style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', margin: 0}}>Team Members</h4>
                  <div className="table-wrapper" style={{marginTop: 'var(--space-sm)', maxHeight: '200px', overflowY: 'auto'}}>
                    <table>
                      <thead><tr><th>Name</th><th>Employee ID</th><th style={{width: '40px'}}></th></tr></thead>
                      <tbody>
                        {editMembers.map((m, i) => (
                          <tr key={i}>
                            <td><input type="text" className="input" style={{width: '100%'}} value={m.name} onChange={e => { const nm = [...editMembers]; nm[i].name = e.target.value; setEditMembers(nm); }} /></td>
                            <td><input type="text" className="input" style={{width: '100%'}} value={m.employee_id || ''} onChange={e => { const nm = [...editMembers]; nm[i].employee_id = e.target.value; setEditMembers(nm); }} /></td>
                            <td><button className="btn btn-ghost btn-sm" onClick={() => { const nm = [...editMembers]; nm.splice(i, 1); setEditMembers(nm); }} title="Remove">🗑️</button></td>
                          </tr>
                        ))}
                        <tr>
                          <td><input type="text" className="input" style={{width: '100%'}} placeholder="New member name" value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} /></td>
                          <td><input type="text" className="input" style={{width: '100%'}} placeholder="Employee ID" value={memberForm.employee_id} onChange={e => setMemberForm({...memberForm, employee_id: e.target.value})} /></td>
                          <td><button className="btn btn-primary btn-sm" onClick={() => {
                            if(!memberForm.name) return;
                            setEditMembers([...editMembers, { id: null, name: memberForm.name, employee_id: memberForm.employee_id || null }]);
                            setMemberForm({id:null, name:'', employee_id:''});
                          }}>Add</button></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
              <div style={{display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', justifyContent: 'flex-end'}}>
                <button className="btn btn-secondary" onClick={() => setMode('view')}>Cancel</button>
                <button className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting} onClick={handleSaveTeamEdit}>
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ADD/EDIT MEMBER DIRECTLY MODE */}
          {(mode === 'add_member' || mode === 'edit_member') && (
            <div>
              <h3 style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', marginBottom: 'var(--space-md)'}}>
                {mode === 'add_member' ? 'Add Team Member' : 'Edit Team Member'}
              </h3>
              <div style={{display: 'flex', flexDirection: 'column', gap: 'var(--space-md)'}}>
                <label>
                  <span style={{display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Name *</span>
                  <input className="input" type="text" placeholder="Full name" style={{width: '100%'}} value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} />
                </label>
                <label>
                  <span style={{display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Employee ID</span>
                  <input className="input" type="text" placeholder="Employee ID (optional)" style={{width: '100%'}} value={memberForm.employee_id} onChange={e => setMemberForm({...memberForm, employee_id: e.target.value})} />
                </label>
              </div>
              <div style={{display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', justifyContent: 'flex-end'}}>
                <button className="btn btn-secondary" onClick={() => setMode('view')}>Cancel</button>
                <button className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting} onClick={submitMemberAction}>
                  {isSubmitting ? 'Saving...' : (mode === 'add_member' ? 'Add Member' : 'Save Changes')}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default TeamDetailModal;
