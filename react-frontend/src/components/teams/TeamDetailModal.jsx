import React, { useState, useEffect } from 'react';
import { TeamService } from '../../api/teamService';

const TeamDetailModal = ({ team, isOpen, onClose, onTeamUpdated }) => {
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [memberForm, setMemberForm] = useState({ id: null, name: '', employee_id: '' });

  useEffect(() => {
    if (isOpen && team) {
      setError('');
    }
  }, [isOpen, team]);

  const submitMemberAction = async () => {
    if (!memberForm.name) { setError('Name is required'); return; }
    setIsSubmitting(true);
    try {
      await TeamService.addTeamMemberAdmin(team.id, { name: memberForm.name, employee_id: memberForm.employee_id || null });
      onTeamUpdated();
      setMemberForm({ id: null, name: '', employee_id: '' });
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

  const code = team.team_code || team.team_id || team.code;
  const name = team.team_name || team.name;
  const leader = team.team_leader_name || team.team_leader || '\u2014';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ minWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{code} — {name}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

          <div id="team-detail-view">
            <div style={{display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)'}}>
              {formatBadge(name, 56)}
              <div>
                <h3 style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)'}}>Group {code}</h3>
                <p style={{color: 'var(--color-text-secondary)', margin: 0}}>{name}</p>
              </div>
            </div>

            <div style={{marginBottom: 'var(--space-lg)'}}>
              <h4 style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)'}}>
                {'\uD83D\uDC64'} Team Leader
              </h4>
              <p style={{fontSize: 'var(--text-base)', margin: 0}}>{leader}</p>
            </div>

            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)'}}>
              <h4 style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', textTransform: 'uppercase', color: 'var(--color-text-muted)', margin: 0}}>
                {'\uD83D\uDC65'} Members ({(team.members || []).length})
              </h4>
              <button className="btn btn-primary btn-sm" onClick={() => { setMemberForm({id:null, name:'', employee_id:''}); }}>+ Add Member</button>
            </div>

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Employee ID</th>
                    <th>Name</th>
                    <th style={{textAlign: 'right', width: '80px'}}></th>
                  </tr>
                </thead>
                <tbody>
                  {(!team.members || team.members.length === 0) ? (
                    <tr><td colSpan="3" style={{textAlign: 'center', color: 'var(--color-text-muted)'}}>No members</td></tr>
                  ) : (
                    team.members.map(m => (
                      <tr key={m.id}>
                        <td style={{fontFamily: 'var(--font-data)'}}>{m.employee_id || '\u2014'}</td>
                        <td>{m.name}</td>
                        <td style={{textAlign: 'right'}}>
                          <button className="btn btn-ghost btn-sm" title="Remove Member" onClick={() => removeMemberAdmin(m.id, m.name)}>{'\uD83D\uDDD1\uFE0F'}</button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {memberForm && (
              <div style={{display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-md)', alignItems: 'flex-end'}}>
                <label style={{flex: 1}}>
                  <span style={{display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Employee ID</span>
                  <input className="input" type="text" placeholder="Optional" style={{width: '100%'}} value={memberForm.employee_id} onChange={e => setMemberForm({...memberForm, employee_id: e.target.value})} />
                </label>
                <label style={{flex: 2}}>
                  <span style={{display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Name</span>
                  <input className="input" type="text" placeholder="Full name" style={{width: '100%'}} value={memberForm.name} onChange={e => setMemberForm({...memberForm, name: e.target.value})} />
                </label>
                <button className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting} onClick={submitMemberAction}>
                  {isSubmitting ? 'Saving...' : 'Add'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeamDetailModal;
