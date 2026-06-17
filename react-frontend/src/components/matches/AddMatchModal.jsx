import React, { useState } from 'react';
import { MatchService } from '../../api/matchService';

const AddMatchModal = ({ isOpen, onClose, onMatchCreated }) => {
  const [matchNumber, setMatchNumber] = useState('');
  const [round, setRound] = useState('');
  const [homeTeam, setHomeTeam] = useState('');
  const [awayTeam, setAwayTeam] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!matchNumber || !homeTeam || !awayTeam || !scheduledAt) {
      setError('Please fill in all required fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await MatchService.createMatch({
        match_number: parseInt(matchNumber, 10),
        home_team_name: homeTeam,
        away_team_name: awayTeam,
        scheduled_at: new Date(scheduledAt).toISOString(),
        round: round || null
      });
      onMatchCreated();
      onClose();
      // Reset form
      setMatchNumber('');
      setRound('');
      setHomeTeam('');
      setAwayTeam('');
      setScheduledAt('');
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to create match');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ minWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)'}}>+ Add New Match</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Match Number <span className="required">*</span></label>
                <input className="form-input" type="number" min="1" placeholder="1" value={matchNumber} onChange={e => setMatchNumber(e.target.value)} required style={{width: '100%'}} />
              </div>
              <div className="form-group">
                <label className="form-label">Round / Stage</label>
                <input className="form-input" placeholder="Group Stage, Final..." value={round} onChange={e => setRound(e.target.value)} style={{width: '100%'}} />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginTop: 'var(--space-md)' }}>
              <div className="form-group">
                <label className="form-label">Home Team <span className="required">*</span></label>
                <input className="form-input" placeholder="Argentina" value={homeTeam} onChange={e => setHomeTeam(e.target.value)} required style={{width: '100%'}} />
              </div>
              <div className="form-group">
                <label className="form-label">Away Team <span className="required">*</span></label>
                <input className="form-input" placeholder="Brazil" value={awayTeam} onChange={e => setAwayTeam(e.target.value)} required style={{width: '100%'}} />
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
              <label className="form-label">Kickoff Date &amp; Time <span className="required">*</span></label>
              <input className="form-input" type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} required style={{width: '100%'}} />
            </div>
            <div className="modal-footer" style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
                <span>{isSubmitting ? 'Creating...' : 'Create Match'}</span>
                {isSubmitting && <span className="spinner"></span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddMatchModal;
