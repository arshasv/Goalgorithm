import React, { useState } from 'react';
import { MatchService } from '../../api/matchService';
import { PredictionService } from '../../api/predictionService';
import { TeamService } from '../../api/teamService';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import SubmitPredictionModal from '../predictions/SubmitPredictionModal';
import { useScrollLock } from '../../hooks/useScrollLock';

const MatchDetailModal = ({ match, isOpen, onClose, onMatchUpdated, onEnterResult }) => {
  useScrollLock(isOpen);
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const { isOrganizer, isTeamLeader } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [teams, setTeams] = useState([]);
  const [jsonView, setJsonView] = useState(null);
  
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [submitMode, setSubmitMode] = useState('manual');

  React.useEffect(() => {
    if (isOpen && match) {
      PredictionService.listPredictions().then(res => {
        setPredictions((Array.isArray(res) ? res : (res.predictions || [res])).filter(p => p.match_id === match.id));
      }).catch(() => {});
      TeamService.listTeams().then(res => {
        setTeams(res);
      }).catch(() => {});
    }
  }, [isOpen, match]);

  if (!isOpen || !match) return null;

  const home = match.home_team_name || match.home || '?';
  const away = match.away_team_name || match.away || '?';
  const status = (match.status || 'scheduled').toLowerCase();
  const isScored = status === 'scored' || status === 'completed' || status === 'result_entered';
  const matchNum = match.match_number || '?';
  
  const dateObj = match.scheduled_at ? new Date(match.scheduled_at) : null;
  const dateStr = dateObj ? dateObj.toLocaleDateString() : '?';
  const timeStr = dateObj ? dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';

  const homeScore = match.home_score ?? match.actual_home_goals ?? match.home_goals;
  const awayScore = match.away_score ?? match.actual_away_goals ?? match.away_goals;

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
      case 'awaiting_result':
      case 'awaiting result':
        return <span className="badge badge-info">AWAITING RESULT</span>;
      default:
        return <span className="badge badge-info">{status.replace('_', ' ').toUpperCase()}</span>;
    }
  };

  const teamBadge = (name, size) => {
    const initial = (name || '?').charAt(0).toUpperCase();
    return (
      <div style={{ width: size, height: size, borderRadius: 'var(--radius-round)', background: 'var(--color-surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: Math.round(size * 0.45), fontWeight: 700, color: 'var(--color-text-primary)', flexShrink: 0 }}>
        {initial}
      </div>
    );
  };

  const predByTeamId = {};
  predictions.forEach(p => { predByTeamId[p.team_id] = p; });
  const predCount = predictions.length;

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
            
            {homeScore != null && awayScore != null ? (
              <div className="match-score-display" style={{fontSize: 'var(--text-5xl)', color: 'var(--color-status-success)'}}>{homeScore} &ndash; {awayScore}</div>
            ) : (
              <div className="match-score-display" style={{fontSize: 'var(--text-5xl)', color: 'var(--color-text-muted)'}}>? &ndash; ?</div>
            )}
            
            <div style={{marginTop: 'var(--space-sm)'}}>{statusBadge()}</div>
          </div>

          <h4 style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-md)'}}>Team Predictions</h4>
          
          <div className="table-wrapper" style={{marginBottom: 'var(--space-lg)'}}>
            <table style={{width: '100%'}}>
              <thead>
                <tr>
                  <th>Team</th>
                  <th>Status</th>
                  <th>Submitted</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 && predictions.length === 0 ? (
                  <tr><td colSpan={4} style={{textAlign:'center',color:'var(--color-text-muted)',padding:'var(--space-md)'}}>Loading...</td></tr>
                ) : teams.length === 0 ? (
                  predictions.map((pred, i) => (
                    <tr key={pred.id} style={{animation: `fadeIn ${300 + i * 60}ms var(--ease-out) both`}}>
                      <td style={{display: 'flex', alignItems: 'center', gap: 'var(--space-sm)'}}>
                        {teamBadge(pred.team_name || pred.team_code || '?', 28)}
                        <span style={{fontWeight: 600}}>{pred.team_name || pred.team_code || pred.team_id}</span>
                      </td>
                      <td><span className="badge badge-success">✓ Submitted</span></td>
                      <td style={{fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)'}}>
                        {pred.submitted_at ? new Date(pred.submitted_at).toLocaleDateString() : '—'}
                      </td>
                      <td><button className="btn btn-ghost btn-sm" onClick={() => setJsonView(pred)}>View</button></td>
                    </tr>
                  ))
                ) : (
                  teams.map((teamObj, i) => {
                    const pred = predByTeamId[teamObj.id];
                    const display = teamObj.team_id ? `${teamObj.team_id} – ${teamObj.name}` : teamObj.name;
                    const submitted = !!pred;
                    return (
                      <tr key={teamObj.id} style={{animation: `fadeIn ${300 + i * 60}ms var(--ease-out) both`}}>
                        <td style={{display: 'flex', alignItems: 'center', gap: 'var(--space-sm)'}}>
                          {teamBadge(teamObj.name, 28)}
                          <span style={{fontWeight: 600}}>{display}</span>
                        </td>
                        <td>{submitted ? <span className="badge badge-success">✓ Submitted</span> : <span className="badge badge-error">✗ Not submitted</span>}</td>
                        <td style={{fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)'}}>
                          {submitted && pred.submitted_at ? new Date(pred.submitted_at).toLocaleDateString() : '—'}
                        </td>
                        <td>
                          {submitted && <button className="btn btn-ghost btn-sm" onClick={() => setJsonView(pred)}>View</button>}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {isOrganizer && (
            <div style={{marginBottom: 'var(--space-lg)'}}>
              <div className="progress-bar"><div className="progress-fill" style={{width: `${(predCount / 5) * 100}%`}}></div></div>
              <div style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '4px'}}>{predCount} of 5 teams submitted</div>
            </div>
          )}

          <h4 style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 'var(--space-md)', marginTop: 'var(--space-lg)'}}>Predictions Log</h4>
          <div className="card" style={{ padding: 'var(--space-md)', marginBottom: 'var(--space-lg)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-medium)', background: 'var(--color-surface-secondary)' }}>
            {predictions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--color-text-muted)' }}>No prediction changes recorded</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {predictions.map((pred, i) => (
                  <div key={pred.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm)', background: 'var(--color-surface-primary)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                      <span className="badge badge-info" style={{ fontSize: '10px' }}>LOG</span>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{pred.team_name || pred.team_id || 'System'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
                      <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                        {pred.submitted_at ? new Date(pred.submitted_at).toLocaleString() : '—'}
                      </span>
                      <button className="btn btn-ghost btn-sm" onClick={() => setJsonView(pred)}>View</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{display: 'flex', flexWrap: 'wrap', gap: 'var(--space-sm)'}}>
            {isOrganizer && (
              <>
                <button className="btn btn-secondary" style={{flex: '1 1 calc(50% - var(--space-sm))'}} onClick={() => { setSubmitMode('manual'); setShowSubmitModal(true); }}>➕ Add Prediction</button>
                <button className="btn btn-secondary" style={{flex: '1 1 calc(50% - var(--space-sm))'}} onClick={() => { setSubmitMode('json'); setShowSubmitModal(true); }}>📄 Upload Prediction JSON</button>
              </>
            )}

            {!isEditing ? (
              isOrganizer && <button className="btn btn-secondary" style={{flex: '1 1 calc(50% - var(--space-sm))'}} onClick={handleStartEdit}>✏️ Edit Time</button>
            ) : (
              <button className={`btn btn-secondary ${isSubmitting ? 'loading' : ''}`} style={{flex: '1 1 calc(50% - var(--space-sm))'}} disabled={isSubmitting} onClick={handleSaveEdit}>
                {isSubmitting ? 'Saving...' : '💾 Save Time'}
              </button>
            )}
            
            {isOrganizer && (
              <button className="btn btn-primary" style={{flex: '1 1 calc(50% - var(--space-sm))'}} onClick={() => { onClose(); onEnterResult(); }}>📋 Enter Result</button>
            )}

            {(status === 'completed' || status === 'scored' || status === 'result_entered') && isOrganizer && (
              <button className="btn btn-primary" style={{flex: '1 1 calc(50% - var(--space-sm))'}} onClick={() => { onClose(); navigate(`/scoring?match=${match.id}`); }}>⚡ Calculate Scores</button>
            )}
          </div>
        </div>
      </div>

      <SubmitPredictionModal 
        match={match} 
        isOpen={showSubmitModal} 
        onClose={() => setShowSubmitModal(false)} 
        onPredictionSubmitted={() => {
          PredictionService.listPredictions().then(res => {
            setPredictions((Array.isArray(res) ? res : (res.predictions || [res])).filter(p => p.match_id === match.id));
          }).catch(() => {});
        }} 
        initialMode={submitMode}
      />

      {jsonView && (
        <div className="modal-overlay" style={{zIndex: 1100}} onClick={() => setJsonView(null)}>
          <div className="modal-container" onClick={e => e.stopPropagation()} style={{minWidth: '600px'}}>
            <div className="modal-header">
              <h3 className="modal-title">Prediction Detail — {jsonView.team_name || jsonView.team_id}</h3>
              <button className="modal-close" onClick={() => setJsonView(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <pre style={{background: 'var(--color-surface-secondary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', overflowX: 'auto', fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)'}}>
                {JSON.stringify(jsonView, null, 2)}
              </pre>
              <div className="modal-footer" style={{marginTop: 'var(--space-lg)'}}>
                <button className="btn btn-primary" onClick={() => setJsonView(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MatchDetailModal;
