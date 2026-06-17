import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { PredictionService } from '../../api/predictionService';
import { MatchService } from '../../api/matchService';
import SubmitPredictionModal from '../../components/predictions/SubmitPredictionModal';

const statusBadge = (status) => {
  const map = {
    'PENDING_VALIDATION': 'badge-warning',
    'VALIDATED': 'badge-success',
    'INVALID': 'badge-error',
    'LATE': 'badge-info',
  };
  const label = status ? status.replace('_', ' ') : 'unknown';
  return <span className={`badge ${map[status] || 'badge-info'}`}>{label}</span>;
};

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

const PredictionsView = () => {
  const { isOrganizer, isTeamLeader } = useAuth();
  const [predictions, setPredictions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterMatch, setFilterMatch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedPred, setSelectedPred] = useState(null);
  const [editModePred, setEditModePred] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [preds, matchList] = await Promise.all([
        PredictionService.listPredictions().catch(() => []),
        MatchService.listMatches().catch(() => []),
      ]);

      setPredictions(Array.isArray(preds) ? preds : (preds.predictions || []));
      setMatches(Array.isArray(matchList) ? matchList : []);
    } catch (err) {
      setError('Failed to load predictions: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Build match lookup by id for enriching edit modal with team names
  const matchById = {};
  matches.forEach(m => { matchById[m.id] = m; });
  // Also index by match_id string (e.g. "M32")
  matches.forEach(m => { if (m.match_number) matchById[`M${m.match_number}`] = m; });

  const preds = Array.isArray(predictions) ? predictions : [];
  const teamCount = new Set(preds.map(p => p.team_id)).size;
  const scoredCount = preds.filter(p => p.status === 'VALIDATED' || p.status === 'scored').length;

  const filtered = preds.filter(p => {
    const matchText = (p.match_label || p.match_id || '').toLowerCase();
    const teamText = `${p.team_name || ''} ${p.team_code || ''}`.toLowerCase();
    const searchMatch = !filterMatch || matchText.includes(filterMatch.toLowerCase()) || teamText.includes(filterMatch.toLowerCase());
    const statusMatch = !filterStatus || p.status === filterStatus;
    return searchMatch && statusMatch;
  });

  // Build a match object for the edit modal with real team names
  const getMatchForEdit = (pred) => {
    const m = matchById[pred.match_id];
    return {
      id: pred.match_id,
      home_team_name: m?.home_team_name || 'Home',
      away_team_name: m?.away_team_name || 'Away',
    };
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">📋 Predictions Log</h1>
          <p className="page-subtitle">{isOrganizer ? 'All team predictions across matches' : 'Your submitted predictions'}</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={loadData}>🔄 Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

      {loading ? (
        <div className="grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card stat-card">
              <div className="stat-label"><div className="skeleton skeleton-text" style={{ width: '60%' }}></div></div>
              <div className="stat-value"><div className="skeleton skeleton-text" style={{ width: '40%' }}></div></div>
            </div>
          ))}
        </div>
      ) : preds.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2 className="empty-title">No Predictions Yet</h2>
          <p className="empty-desc">
            {isTeamLeader
              ? 'Go to Matches and click "Predict" on any scheduled match.'
              : 'No predictions have been submitted by teams yet.'}
          </p>
          {isTeamLeader && (
            <a className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }} href="#/matches">View Matches</a>
          )}
        </div>
      ) : (
        <>
          {/* Stat cards */}
          <div className="grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
            <div className="card stat-card">
              <div className="stat-label">Total Predictions</div>
              <div className="stat-value" style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)' }}>{preds.length}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Teams Submitted</div>
              <div className="stat-value" style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)' }}>{teamCount}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Validated</div>
              <div className="stat-value" style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)' }}>{scoredCount}</div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">All Predictions</div>
              <span className="badge badge-info">{preds.length} entries</span>
            </div>
            <div style={{ padding: 'var(--space-md)' }}>
              <div style={{ display: 'flex', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)', flexWrap: 'wrap' }}>
                <input className="form-input" placeholder="Filter by match or team..." style={{ maxWidth: '220px' }}
                  value={filterMatch} onChange={e => setFilterMatch(e.target.value)} />
                <select className="form-select" style={{ maxWidth: '160px' }}
                  value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                  <option value="">All status</option>
                  <option value="PENDING_VALIDATION">Pending</option>
                  <option value="VALIDATED">Validated</option>
                  <option value="INVALID">Invalid</option>
                  <option value="LATE">Late</option>
                </select>
              </div>
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Team</th>
                      {isOrganizer && <th>Team Leader</th>}
                      <th>Match</th>
                      <th>Winner</th>
                      <th>Scoreline</th>
                      <th>Status</th>
                      <th>Submitted</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(p => {
                      const teamDisplay = p.team_code
                        ? `${p.team_code} – ${p.team_name || ''}`
                        : (p.team_name || p.team_id);
                      const matchDisplay = p.match_label || p.match_id;

                      return (
                        <tr key={p.id} className="pred-row" style={{ cursor: 'pointer' }} onClick={() => setSelectedPred(p)}>
                          <td><strong>{teamDisplay}</strong></td>
                          {isOrganizer && (
                            <td style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                              {p.team_leader_name || '—'}
                            </td>
                          )}
                          <td style={{ fontSize: 'var(--text-sm)' }}>{matchDisplay}</td>
                          <td style={{ textTransform: 'capitalize' }}>{p.match_prediction?.predicted_winner || '—'}</td>
                          <td style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-lg)', fontWeight: 600 }}>
                            {p.match_prediction?.predicted_scoreline?.home_team_goals ?? '?'} – {p.match_prediction?.predicted_scoreline?.away_team_goals ?? '?'}
                          </td>
                          <td>{statusBadge(p.status)}</td>
                          <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                            {p.submitted_at ? new Date(p.submitted_at).toLocaleString() : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Prediction detail modal */}
      {selectedPred && (
        <div className="modal-overlay" onClick={() => setSelectedPred(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: '520px' }}>
            <div className="modal-header">
              <span className="modal-title">Prediction Details</span>
              <button className="btn btn-ghost btn-sm" onClick={() => setSelectedPred(null)}>✕</button>
            </div>
            <div className="modal-body" style={{ fontSize: 'var(--text-sm)' }}>
              {/* Summary grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)', marginBottom: 'var(--space-lg)', background: 'var(--color-surface-secondary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-medium)' }}>
                <div>
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Team</span>
                  <strong>
                    {selectedPred.team_code
                      ? `${selectedPred.team_code} – ${selectedPred.team_name}`
                      : (selectedPred.team_name || selectedPred.team_id)}
                  </strong>
                </div>
                {selectedPred.team_leader_name && (
                  <div>
                    <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Team Leader</span>
                    <strong>{selectedPred.team_leader_name}</strong>
                  </div>
                )}
                <div style={{ gridColumn: selectedPred.team_leader_name ? '1 / -1' : 'auto' }}>
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Match</span>
                  <strong>{selectedPred.match_label || selectedPred.match_id}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Predicted Winner</span>
                  <strong style={{ textTransform: 'capitalize' }}>{selectedPred.match_prediction?.predicted_winner || '—'}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Predicted Score</span>
                  <strong style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-xl)' }}>
                    {selectedPred.match_prediction?.predicted_scoreline?.home_team_goals ?? 0} – {selectedPred.match_prediction?.predicted_scoreline?.away_team_goals ?? 0}
                  </strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Status</span>
                  {statusBadge(selectedPred.status)}
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Submitted</span>
                  <span>{selectedPred.submitted_at ? new Date(selectedPred.submitted_at).toLocaleString() : '—'}</span>
                </div>
              </div>

              {/* Goal scorers */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h4 style={{ marginBottom: 'var(--space-sm)', textTransform: 'uppercase', fontSize: 'var(--text-xs)', letterSpacing: '0.04em' }}>Predicted Scorers</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div style={{ background: 'var(--color-surface)', padding: 'var(--space-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-small)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-primary)' }}>Home Team</div>
                    <ul style={{ margin: 0, paddingLeft: 'var(--space-md)' }}>
                      {selectedPred.match_prediction?.goal_scorers?.home?.length > 0
                        ? selectedPred.match_prediction.goal_scorers.home.map((s, i) => <li key={i}>⚽ {s}</li>)
                        : <li style={{ color: 'var(--color-text-muted)', listStyle: 'none' }}>None</li>}
                    </ul>
                  </div>
                  <div style={{ background: 'var(--color-surface)', padding: 'var(--space-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-small)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-accent)' }}>Away Team</div>
                    <ul style={{ margin: 0, paddingLeft: 'var(--space-md)' }}>
                      {selectedPred.match_prediction?.goal_scorers?.away?.length > 0
                        ? selectedPred.match_prediction.goal_scorers.away.map((s, i) => <li key={i}>⚽ {s}</li>)
                        : <li style={{ color: 'var(--color-text-muted)', listStyle: 'none' }}>None</li>}
                    </ul>
                  </div>
                </div>
              </div>

              {/* Probabilities */}
              <div style={{ marginBottom: 'var(--space-md)' }}>
                <h4 style={{ marginBottom: 'var(--space-sm)', textTransform: 'uppercase', fontSize: 'var(--text-xs)', letterSpacing: '0.04em' }}>Probabilities & Stats</h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-sm)' }}>
                  {[
                    { label: 'Home Win', val: selectedPred.match_prediction?.probabilities?.home_win_probability },
                    { label: 'Draw', val: selectedPred.match_prediction?.probabilities?.draw_probability },
                    { label: 'Away Win', val: selectedPred.match_prediction?.probabilities?.away_win_probability },
                  ].map(({ label, val }) => (
                    <div key={label} className="card" style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{label}</div>
                      <div style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>{val ?? 0}%</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)', marginTop: 'var(--space-sm)' }}>
                  <div className="card" style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>First Goal</div>
                    <div style={{ fontWeight: 'bold' }}>{capitalize(selectedPred.match_prediction?.first_goal_team)}</div>
                  </div>
                  <div className="card" style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>BTTS</div>
                    <div style={{ fontWeight: 'bold' }}>{selectedPred.match_prediction?.both_teams_to_score_probability ?? 0}%</div>
                  </div>
                </div>
              </div>

              <div className="modal-footer" style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => { setEditModePred(selectedPred); setSelectedPred(null); }}>✏️ Edit Prediction</button>
                <button className="btn btn-ghost" onClick={() => setSelectedPred(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit prediction modal — passes real match team names */}
      {editModePred && (
        <SubmitPredictionModal
          match={getMatchForEdit(editModePred)}
          isOpen={true}
          onClose={() => setEditModePred(null)}
          onPredictionSubmitted={() => { setEditModePred(null); loadData(); }}
          existingPrediction={editModePred}
        />
      )}
    </div>
  );
};

export default PredictionsView;
