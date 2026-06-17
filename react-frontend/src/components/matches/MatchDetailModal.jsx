import React, { useState } from 'react';
import { MatchService } from '../../api/matchService';

const MatchDetailModal = ({ match, isOpen, onClose, onMatchUpdated, onEnterResult }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !match) return null;

  const home = match.home_team_name || match.home || '?';
  const away = match.away_team_name || match.away || '?';
  const status = (match.status || 'scheduled').toLowerCase();
  const isScored = status === 'scored' || status === 'completed' || status === 'result_entered';
  const matchNum = match.match_number || '?';
  
  const dateObj = match.scheduled_at ? new Date(match.scheduled_at) : null;
  const dateStr = dateObj ? dateObj.toLocaleDateString() : '?';
  const timeStr = dateObj ? dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

  const homeScore = match.actual_home_goals ?? match.home_goals;
  const awayScore = match.actual_away_goals ?? match.away_goals;

  const handleStartEdit = () => {
    // format for datetime-local input
    if (dateObj) {
      const tzoffset = (new Date()).getTimezoneOffset() * 60000;
      const localISOTime = (new Date(dateObj - tzoffset)).toISOString().slice(0, 16);
      setScheduledAt(localISOTime);
    }
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsSubmitting(true);
    setError('');
    try {
      await MatchService.updateMatch(match.id, {
        scheduled_at: new Date(scheduledAt).toISOString()
      });
      setIsEditing(false);
      onMatchUpdated();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to update match');
    } finally {
      setIsSubmitting(false);
    }
  };

  const statusBadge = () => {
    switch (status) {
      case 'completed':
      case 'scored':
        return <span className="badge badge-success">COMPLETED</span>;
      case 'frozen':
        return <span className="badge badge-error">FROZEN</span>;
      case 'scheduled':
        return <span className="badge badge-warning">SCHEDULED</span>;
      default:
        return <span className="badge badge-info">{status.toUpperCase()}</span>;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ minWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title">Match M{matchNum} — {home} vs {away}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

          <div style={{textAlign: 'center', padding: 'var(--space-lg) 0', background: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-medium)', marginBottom: 'var(--space-lg)', position: 'relative', overflow: 'hidden'}}>
            
            {!isEditing ? (
              <div style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em'}}>
                {dateStr} {timeStr}
              </div>
            ) : (
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 'var(--space-sm)' }}>
                <input type="datetime-local" className="form-input" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} />
              </div>
            )}

            <div style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-2xl)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em', margin: 'var(--space-sm) 0'}}>
              {home} <span style={{color: 'var(--color-text-muted)', fontFamily: 'var(--font-data)'}}>vs</span> {away}
            </div>
            
            {isScored && homeScore != null ? (
              <div className="match-score-display" style={{fontSize: 'var(--text-5xl)', color: 'var(--color-status-success)'}}>{homeScore} – {awayScore}</div>
            ) : (
              <div className="match-vs-label">TBD</div>
            )}
            
            <div style={{marginTop: 'var(--space-sm)'}}>{statusBadge()}</div>
          </div>

          <h4 style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-md)'}}>Team Predictions</h4>
          <div className="alert alert-info" style={{marginBottom: 'var(--space-lg)'}}>
            Predictions feature is disabled for Phase 4 migration. Coming soon!
          </div>

          <div style={{display: 'flex', gap: 'var(--space-sm)'}}>
            {!isEditing ? (
              <button className="btn btn-secondary" style={{flex: 1}} onClick={handleStartEdit}>✏️ Edit Time</button>
            ) : (
              <button className={`btn btn-secondary ${isSubmitting ? 'loading' : ''}`} style={{flex: 1}} disabled={isSubmitting} onClick={handleSaveEdit}>
                {isSubmitting ? 'Saving...' : '💾 Save Time'}
              </button>
            )}
            
            {(status === 'scheduled' || status === 'frozen') && (
              <button className="btn btn-primary" style={{flex: 1}} onClick={() => { onClose(); onEnterResult(); }}>📋 Enter Result</button>
            )}

            {(status === 'completed' || status === 'scored' || status === 'result_entered') && (
              <button className="btn btn-primary" style={{flex: 1}} onClick={() => { onClose(); window.location.hash = '#/scoring?match=' + match.id; }}>⚡ Calculate Scores</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchDetailModal;
