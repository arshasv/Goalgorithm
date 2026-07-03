import React, { useState } from 'react';
import { TeamService } from '../../api/teamService';
import { useScrollLock } from '../../hooks/useScrollLock';

const CreateTeamModal = ({ isOpen, onClose, onTeamCreated }) => {
  useScrollLock(isOpen);
  const [teamCode, setTeamCode] = useState('');
  const [teamName, setTeamName] = useState('');
  const [teamLeader, setTeamLeader] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!teamCode) { setError('Please select a team code'); return; }
    if (!teamName) { setError('Please enter a team name'); return; }

    setIsSubmitting(true);
    setError('');
    try {
      await TeamService.createTeam({
        team_code: teamCode,
        team_name: teamName,
        team_leader: teamLeader || ''
      });
      onTeamCreated();
      onClose();
      // Reset form
      setTeamCode('');
      setTeamName('');
      setTeamLeader('');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create team');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ minWidth: '400px' }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)'}}>Create New Team</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
            <label>
              <span style={{display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Team Code</span>
              <select className="input" style={{width: '100%'}} value={teamCode} onChange={e => setTeamCode(e.target.value)}>
                <option value="">Select code...</option>
                <option value="A">A</option>
                <option value="B">B</option>
                <option value="C">C</option>
                <option value="D">D</option>
                <option value="E">E</option>
              </select>
            </label>
            <label>
              <span style={{display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Team Name</span>
              <input className="input" type="text" placeholder="e.g. Prediction Masters" style={{width: '100%'}} value={teamName} onChange={e => setTeamName(e.target.value)} />
            </label>
            <label>
              <span style={{display: 'block', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Team Leader</span>
              <input className="input" type="text" placeholder="e.g. John Doe" style={{width: '100%'}} value={teamLeader} onChange={e => setTeamLeader(e.target.value)} />
            </label>
            <div style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
                <span>{isSubmitting ? 'Creating...' : 'Create Team'}</span>
                {isSubmitting && <span className="spinner"></span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateTeamModal;
