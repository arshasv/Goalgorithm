import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { PredictionService } from '../../api/predictionService';
import { MatchService } from '../../api/matchService';
import SubmitPredictionModal from '../../components/predictions/SubmitPredictionModal';
import { useScrollLock } from '../../hooks/useScrollLock';

const statusBadge = (status) => {
  const map = {
    'PENDING_VALIDATION': 'badge-warning',
    'VALIDATED': 'badge-success',
    'SCORED': 'badge-success',
    'INVALID': 'badge-error',
    'LATE': 'badge-info',
  };
  const label = status ? status.replace('_', ' ') : 'unknown';
  return <span className={`badge ${map[status] || 'badge-info'}`}>{label}</span>;
};

const capitalize = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : '—';

const PredictionsView = () => {
  const { isOrganizer, isTeamLeader } = useAuth();
  const [searchParams] = useSearchParams();
  const [predictions, setPredictions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterMatch, setFilterMatch] = useState(searchParams.get('match') || '');
  const [filterStatus, setFilterStatus] = useState('');
  const [selectedPred, setSelectedPred] = useState(null);
  const [editModePred, setEditModePred] = useState(null);

  useScrollLock(!!selectedPred);

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

  // Helper: render a probability bar
  const ProbBar = ({ label, value, color }) => (
    <div style={{ marginBottom: '6px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-xs)', marginBottom: '2px' }}>
        <span style={{ color: 'var(--color-text-secondary)' }}>{label}</span>
        <span style={{ fontWeight: 600 }}>{value != null ? `${value}%` : '—'}</span>
      </div>
      <div style={{ background: 'var(--color-surface-secondary)', borderRadius: '4px', height: '6px', overflow: 'hidden' }}>
        <div style={{ width: `${value || 0}%`, height: '100%', background: color || 'var(--color-primary)', borderRadius: '4px', transition: 'width 0.3s ease' }} />
      </div>
    </div>
  );

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
                  <option value="SCORED">Scored</option>
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

                      const m = matchById[p.match_id];
                      const matchDisplay = m
                        ? (p.match_label || `M${m.match_number}: ${m.home_team_name} vs ${m.away_team_name}`)
                        : 'Deleted Match';

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
          <div className="modal" onClick={e => e.stopPropagation()} style={{ minWidth: '560px', maxWidth: '680px', maxHeight: '90vh', overflowY: 'auto' }}>
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
                  <strong>
                    {matchById[selectedPred.match_id]
                      ? (selectedPred.match_label || `M${matchById[selectedPred.match_id].match_number}: ${matchById[selectedPred.match_id].home_team_name} vs ${matchById[selectedPred.match_id].away_team_name}`)
                      : 'Deleted Match'}
                  </strong>
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
                  <span style={{ display: 'block', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Total Goals</span>
                  <strong style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-lg)' }}>
                    {selectedPred.match_prediction?.total_goals_prediction ?? '—'}
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

              {/* Win Probabilities */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h4 style={{ marginBottom: 'var(--space-sm)', textTransform: 'uppercase', fontSize: 'var(--text-xs)', letterSpacing: '0.04em' }}>🎯 Win Probabilities</h4>
                <div style={{ background: 'var(--color-surface)', padding: 'var(--space-md)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-small)' }}>
                  <ProbBar label="Home Win" value={selectedPred.match_prediction?.probabilities?.home_win_probability} color="var(--color-primary)" />
                  <ProbBar label="Draw" value={selectedPred.match_prediction?.probabilities?.draw_probability} color="var(--color-warning)" />
                  <ProbBar label="Away Win" value={selectedPred.match_prediction?.probabilities?.away_win_probability} color="var(--color-accent)" />
                </div>
              </div>

              {/* Goal Insights */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <h4 style={{ marginBottom: 'var(--space-sm)', textTransform: 'uppercase', fontSize: 'var(--text-xs)', letterSpacing: '0.04em' }}>⚽ Goal Insights</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                  <div className="card" style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>Both Teams to Score</div>
                    {(() => {
                      const btts = selectedPred.match_prediction?.both_teams_to_score;
                      if (btts && btts.prediction !== null && btts.prediction !== undefined) {
                        return (
                          <>
                            <div style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)', color: btts.prediction ? 'var(--color-success)' : 'var(--color-error)' }}>
                              {btts.prediction ? 'YES' : 'NO'}
                            </div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{btts.probability != null ? `${btts.probability}%` : ''}</div>
                          </>
                        );
                      }
                      // Legacy fallback
                      const prob = selectedPred.match_prediction?.both_teams_to_score_probability;
                      return <div style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>{prob != null ? `${prob}%` : '—'}</div>;
                    })()}
                  </div>
                  <div className="card" style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: '4px' }}>First Team to Score</div>
                    {(() => {
                      const fts = selectedPred.match_prediction?.first_team_to_score;
                      if (fts && fts.team) {
                        return (
                          <>
                            <div style={{ fontWeight: 'bold', textTransform: 'capitalize' }}>{fts.team}</div>
                            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{fts.probability != null ? `${fts.probability}%` : ''}</div>
                          </>
                        );
                      }
                      // Legacy fallback
                      return <div style={{ fontWeight: 'bold' }}>{capitalize(selectedPred.match_prediction?.first_goal_team)}</div>;
                    })()}
                  </div>
                </div>
              </div>

              {/* Goal scorers */}
              < div style={{ marginBottom: 'var(--space-lg)' }}>
                <h4 style={{ marginBottom: 'var(--space-sm)', textTransform: 'uppercase', fontSize: 'var(--text-xs)', letterSpacing: '0.04em' }}>
                  🥅 Predicted Scorers
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>

                  <div style={{ background: 'var(--color-surface)', padding: 'var(--space-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-small)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-primary)' }}>
                      Home Team
                    </div>

                    <ul style={{ margin: 0, paddingLeft: 'var(--space-md)' }}>
                      {selectedPred.match_prediction?.goal_scorers?.home?.length > 0
                        ? selectedPred.match_prediction.goal_scorers.home.map((s, i) => (
                          <li key={i}>
                            ⚽ {
                              typeof s === "object"
                                ? `${s.name} (${s.predicted_goals ?? 0} goal, ${s.probability ?? 0}%)`
                                : s
                            }
                          </li>
                        ))
                        : <li style={{ color: 'var(--color-text-muted)', listStyle: 'none' }}>
                          None
                        </li>
                      }
                    </ul>
                  </div>


                  <div style={{ background: 'var(--color-surface)', padding: 'var(--space-sm)', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-small)' }}>
                    <div style={{ fontWeight: 600, marginBottom: 4, color: 'var(--color-accent)' }}>
                      Away Team
                    </div>

                    <ul style={{ margin: 0, paddingLeft: 'var(--space-md)' }}>
                      {selectedPred.match_prediction?.goal_scorers?.away?.length > 0
                        ? selectedPred.match_prediction.goal_scorers.away.map((s, i) => (
                          <li key={i}>
                            ⚽ {
                              typeof s === "object"
                                ? `${s.name} (${s.predicted_goals ?? 0} goal, ${s.probability ?? 0}%)`
                                : s
                            }
                          </li>
                        ))
                        : <li style={{ color: 'var(--color-text-muted)', listStyle: 'none' }}>
                          None
                        </li>
                      }
                    </ul>
                  </div>

                </div>
              </div>

              {/* Player predictions */}
              {selectedPred.player_predictions?.length > 0 && (
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <h4 style={{ marginBottom: 'var(--space-sm)', textTransform: 'uppercase', fontSize: 'var(--text-xs)', letterSpacing: '0.04em' }}>👤 Player Predictions</h4>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Player</th>
                          <th>Team</th>
                          <th>Goals</th>
                          <th>Probability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPred.player_predictions.map((pp, i) => (
                          <tr key={i}>
                            <td><strong>{pp.player_name}</strong></td>
                            <td style={{ textTransform: 'capitalize', color: 'var(--color-text-secondary)' }}>{pp.team || '—'}</td>
                            <td style={{ fontFamily: 'var(--font-score)', fontWeight: 600 }}>{pp.predicted_goals ?? 0}</td>
                            <td>{pp.probability != null ? `${pp.probability}%` : (pp.goal_probability != null ? `${pp.goal_probability}%` : '—')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Clean sheet predictions */}
              {selectedPred.match_prediction?.clean_sheet_predictions?.length > 0 && (
                <div style={{ marginBottom: 'var(--space-lg)' }}>
                  <h4 style={{ marginBottom: 'var(--space-sm)', textTransform: 'uppercase', fontSize: 'var(--text-xs)', letterSpacing: '0.04em' }}>🧤 Clean Sheet Predictions</h4>
                  <div className="table-wrapper">
                    <table>
                      <thead>
                        <tr>
                          <th>Goalkeeper</th>
                          <th>Prediction</th>
                          <th>Probability</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedPred.match_prediction.clean_sheet_predictions.map((cs, i) => (
                          <tr key={i}>
                            <td><strong>{cs.goalkeeper}</strong></td>
                            <td>
                              <span className={`badge ${cs.prediction ? 'badge-success' : 'badge-error'}`}>
                                {cs.prediction ? 'Yes' : 'No'}
                              </span>
                            </td>
                            <td>{cs.probability != null ? `${cs.probability}%` : '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Legacy clean sheet (backward compat display) */}
              {(!selectedPred.match_prediction?.clean_sheet_predictions?.length) && (
                selectedPred.match_prediction?.clean_sheet_probability?.home_team != null ||
                selectedPred.match_prediction?.clean_sheet_probability?.away_team != null
              ) && (
                  <div style={{ marginBottom: 'var(--space-lg)' }}>
                    <h4 style={{ marginBottom: 'var(--space-sm)', textTransform: 'uppercase', fontSize: 'var(--text-xs)', letterSpacing: '0.04em' }}>🧤 Clean Sheet Probability</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                      <div className="card" style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Home CS</div>
                        <div style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>{selectedPred.match_prediction?.clean_sheet_probability?.home_team ?? 0}%</div>
                      </div>
                      <div className="card" style={{ padding: 'var(--space-sm)', textAlign: 'center' }}>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Away CS</div>
                        <div style={{ fontWeight: 'bold', fontSize: 'var(--text-lg)' }}>{selectedPred.match_prediction?.clean_sheet_probability?.away_team ?? 0}%</div>
                      </div>
                    </div>
                  </div>
                )}

              <div className="modal-footer" style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                <button className="btn btn-secondary" onClick={() => { setEditModePred(selectedPred); setSelectedPred(null); }}>✏️ Edit Prediction</button>
                <button className="btn btn-ghost" onClick={() => setSelectedPred(null)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )
      }

      {/* Edit prediction modal — passes real match team names */}
      {
        editModePred && (
          <SubmitPredictionModal
            match={getMatchForEdit(editModePred)}
            isOpen={true}
            onClose={() => setEditModePred(null)}
            onPredictionSubmitted={() => { setEditModePred(null); loadData(); }}
            existingPrediction={editModePred}
          />
        )
      }
    </div >
  );
};

export default PredictionsView;
