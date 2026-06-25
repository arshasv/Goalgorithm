import React, { useState, useEffect } from 'react';
import { PredictionService } from '../../api/predictionService';
import { useAuth } from '../../contexts/AuthContext';
import { TeamService } from '../../api/teamService';
import { useScrollLock } from '../../hooks/useScrollLock';

/**
 * SubmitPredictionModal — handles both new submissions and edits.
 * Supports two entry modes:
 *   1. Manual entry → builds prediction payload with both legacy and AI-format fields
 *   2. JSON upload → accepts the final AI model output JSON directly
 *
 * Manual entry maps to the same internal fields as the AI format:
 *   - both_teams_to_score: { prediction, probability }
 *   - first_team_to_score: { team, probability }
 *   - clean_sheet_predictions: [{ goalkeeper, prediction, probability }]
 */
const SubmitPredictionModal = ({ match, isOpen, onClose, onPredictionSubmitted, existingPrediction, initialMode = 'manual' }) => {
  useScrollLock(isOpen);
  const { isOrganizer } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [entryMode, setEntryMode] = useState(initialMode);

  useEffect(() => {
    if (isOpen) {
      setEntryMode(initialMode);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, initialMode]);

  // Organizer team selection
  const [teams, setTeams] = useState([]);
  const [orgTeam, setOrgTeam] = useState('');

  // Prediction form state
  const [predictedWinner, setPredictedWinner] = useState('home');
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [homeScorers, setHomeScorers] = useState([]);
  const [awayScorers, setAwayScorers] = useState([]);

  // Probability fields
  const [homeWinProb, setHomeWinProb] = useState(50);
  const [drawProb, setDrawProb] = useState(25);
  const [awayWinProb, setAwayWinProb] = useState(25);
  const [firstGoalTeam, setFirstGoalTeam] = useState('home');
  const [bttsProb, setBttsProb] = useState(50);
  const [bttsPrediction, setBttsPrediction] = useState(true);

  // Load teams for organizer
  useEffect(() => {
    if (isOpen && isOrganizer) {
      TeamService.listTeams().then(setTeams).catch(() => {});
    }
  }, [isOpen, isOrganizer]);

  // Populate from existingPrediction when editing
  useEffect(() => {
    if (isOpen && existingPrediction) {
      const mp = existingPrediction.match_prediction || {};
      const sc = mp.predicted_scoreline || {};
      const gs = mp.goal_scorers || {};
      const prob = mp.probabilities || {};

      setPredictedWinner(mp.predicted_winner || 'home');
      const hg = sc.home_team_goals ?? 0;
      const ag = sc.away_team_goals ?? 0;
      setHomeGoals(hg);
      setAwayGoals(ag);
      setHomeScorers(gs.home?.length ? gs.home : Array(hg).fill(''));
      setAwayScorers(gs.away?.length ? gs.away : Array(ag).fill(''));
      setHomeWinProb(prob.home_win_probability ?? 50);
      setDrawProb(prob.draw_probability ?? 25);
      setAwayWinProb(prob.away_win_probability ?? 25);

      // Resolve first goal team from AI or legacy format
      const fts = mp.first_team_to_score;
      setFirstGoalTeam(fts?.team || mp.first_goal_team || 'home');

      // Resolve BTTS from AI or legacy format
      const btts = mp.both_teams_to_score;
      if (btts) {
        setBttsPrediction(btts.prediction ?? true);
        setBttsProb(btts.probability ?? 50);
      } else {
        setBttsProb(mp.both_teams_to_score_probability ?? 50);
        setBttsPrediction(true);
      }

      if (isOrganizer && existingPrediction.team_id) {
        setOrgTeam(existingPrediction.team_id);
      }
    } else if (isOpen) {
      resetForm();
    }
  }, [isOpen, existingPrediction, isOrganizer]);

  // Sync scorer arrays length when goals change
  useEffect(() => {
    setHomeScorers(prev => Array.from({ length: homeGoals }, (_, i) => prev[i] || ''));
  }, [homeGoals]);

  useEffect(() => {
    setAwayScorers(prev => Array.from({ length: awayGoals }, (_, i) => prev[i] || ''));
  }, [awayGoals]);

  const resetForm = () => {
    setPredictedWinner('home');
    setHomeGoals(0);
    setAwayGoals(0);
    setHomeScorers([]);
    setAwayScorers([]);
    setHomeWinProb(50);
    setDrawProb(25);
    setAwayWinProb(25);
    setFirstGoalTeam('home');
    setBttsProb(50);
    setBttsPrediction(true);
    setOrgTeam('');
    setError('');
  };

  if (!isOpen || !match) return null;

  const homeName = match.home_team_name || 'Home';
  const awayName = match.away_team_name || 'Away';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (isOrganizer && !orgTeam) {
      setError('Please select a team for this prediction.');
      return;
    }

    // Validate scorer names filled in
    if (homeScorers.some(s => !s.trim())) {
      setError(`Please enter all ${homeGoals} ${homeName} scorer name(s).`);
      return;
    }
    if (awayScorers.some(s => !s.trim())) {
      setError(`Please enter all ${awayGoals} ${awayName} scorer name(s).`);
      return;
    }

    // Build player_predictions from scorers
    const allScorers = [
      ...homeScorers.map(name => ({ name, side: 'home' })),
      ...awayScorers.map(name => ({ name, side: 'away' })),
    ];
    // If 0-0, allow empty player_predictions (schema no longer requires it)
    const playerPredictions = allScorers.length > 0
      ? allScorers.map((s, i) => ({
          player_id: `P${i + 1}`,
          player_name: s.name.trim(),
          team: s.side,
          goal_probability: 70,
          predicted_goals: 1,
          assist_probability: 20,
        }))
      : [];

    const payload = {
      team_id: isOrganizer ? orgTeam : 'self',
      match_id: match.id,
      submission_id: `sub-${Date.now()}`,
      match_prediction: {
        predicted_winner: predictedWinner,
        predicted_scoreline: {
          home_team_goals: homeGoals,
          away_team_goals: awayGoals,
        },
        probabilities: {
          home_win_probability: parseFloat(homeWinProb),
          draw_probability: parseFloat(drawProb),
          away_win_probability: parseFloat(awayWinProb),
        },
        total_goals_prediction: homeGoals + awayGoals,
        // AI-format fields populated from manual entry
        both_teams_to_score: {
          prediction: bttsPrediction,
          probability: parseFloat(bttsProb),
        },
        first_team_to_score: {
          team: predictedWinner === 'draw' ? firstGoalTeam : predictedWinner,
          probability: 50,
        },
        // Legacy fields for backward compat
        clean_sheet_probability: {
          home_team: awayGoals === 0 ? 80 : 10,
          away_team: homeGoals === 0 ? 80 : 10,
        },
        first_goal_team: predictedWinner === 'draw' ? firstGoalTeam : predictedWinner,
        both_teams_to_score_probability: parseFloat(bttsProb),
        goal_scorers: {
          home: homeScorers.map(s => s.trim()),
          away: awayScorers.map(s => s.trim()),
        },
      },
      player_predictions: playerPredictions,
    };

    setLoading(true);
    try {
      await PredictionService.submitPrediction(payload);
      import('../../utils/toast').then(({ showToast }) => {
        showToast('Prediction submitted successfully', 'success');
      });
      onPredictionSubmitted();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to submit prediction');
    } finally {
      setLoading(false);
    }
  };

  const updateHomeScorer = (i, val) => {
    const ns = [...homeScorers]; ns[i] = val; setHomeScorers(ns);
  };
  const updateAwayScorer = (i, val) => {
    const ns = [...awayScorers]; ns[i] = val; setAwayScorers(ns);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (isOrganizer && !orgTeam) {
      setError('Please select a team before uploading JSON.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawJson = JSON.parse(event.target.result);
        const json = rawJson.output ? rawJson.output : rawJson;

        const missing = [];
        if (!json.match_prediction) missing.push('match_prediction');
        if (!json.score_prediction && !json.match_prediction?.predicted_scoreline) missing.push('score_prediction');
        if (!json.goal_insights && !json.match_prediction?.both_teams_to_score) missing.push('goal_insights');
        if (!json.player_prediction && !json.player_predictions) missing.push('player_prediction');

        if (missing.length > 0) {
          throw new Error(`Invalid JSON format. Missing required fields: ${missing.join(', ')}`);
        }

        // Map AI format to backend schema if needed
        if (json.score_prediction && !json.match_prediction.predicted_scoreline) {
          json.match_prediction.predicted_scoreline = json.score_prediction.predicted_scoreline || json.score_prediction;
        }
        if (json.goal_insights) {
          json.match_prediction.both_teams_to_score = json.goal_insights.both_teams_to_score;
          json.match_prediction.first_team_to_score = json.goal_insights.first_team_to_score;
        }
        if (json.player_prediction && !json.player_predictions) {
          json.player_predictions = Array.isArray(json.player_prediction) ? json.player_prediction : [json.player_prediction];
        }

        // Validate match_id instead of blindly overwriting
        if (json.match_id && json.match_id !== match.id) {
          throw new Error(`JSON match_id (${json.match_id}) does not match current match (${match.id}).`);
        }
        json.match_id = match.id;
        
        json.team_id = isOrganizer ? orgTeam : 'self';
        json.submission_id = json.submission_id || `sub-json-${Date.now()}`;

        // Ensure player_predictions exists (can be empty in AI format)
        if (!json.player_predictions) {
          json.player_predictions = [];
        }

        setLoading(true);
        await PredictionService.submitPrediction(json);
        import('../../utils/toast').then(({ showToast }) => {
          showToast('Prediction submitted successfully', 'success');
        });
        onPredictionSubmitted();
        onClose();
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Failed to process JSON file');
        setLoading(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ minWidth: '520px' }}>
        <div className="modal-header">
          <h2 className="modal-title">{existingPrediction ? 'Edit Prediction' : 'Submit Prediction'}</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

          <div style={{ textAlign: 'center', marginBottom: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-medium)' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {homeName} vs {awayName}
            </div>
          </div>

          <div className="tabs" style={{ marginBottom: 'var(--space-md)', display: 'flex', borderBottom: '1px solid var(--color-border)' }}>
            <button type="button" className={`tab-btn ${entryMode === 'manual' ? 'active' : ''}`} onClick={() => setEntryMode('manual')} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: entryMode === 'manual' ? '2px solid var(--color-primary)' : '2px solid transparent', color: entryMode === 'manual' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 600 }}>Manual Entry</button>
            <button type="button" className={`tab-btn ${entryMode === 'json' ? 'active' : ''}`} onClick={() => setEntryMode('json')} style={{ padding: '8px 16px', background: 'none', border: 'none', borderBottom: entryMode === 'json' ? '2px solid var(--color-primary)' : '2px solid transparent', color: entryMode === 'json' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)', cursor: 'pointer', fontWeight: 600 }}>JSON Upload</button>
          </div>

          {/* Organizer team selection - shared between modes */}
          {isOrganizer && (
            <div className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
              <label className="form-label">Submit on behalf of Team <span className="required">*</span></label>
              <select className="form-select" value={orgTeam} onChange={e => setOrgTeam(e.target.value)} required disabled={!!existingPrediction}>
                <option value="">-- Select team --</option>
                {teams.map(t => (
                  <option key={t.id} value={t.id}>{t.team_id ? `${t.team_id} – ${t.name}` : t.name}</option>
                ))}
              </select>
            </div>
          )}

          {entryMode === 'manual' ? (
            <form onSubmit={handleSubmit}>

            {/* Match outcome */}
            <div style={{ background: 'var(--color-surface-secondary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-medium)', marginBottom: 'var(--space-md)' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>⚽ Match Outcome</div>
              <div className="form-group">
                <label className="form-label">Predicted Winner</label>
                <select className="form-select" value={predictedWinner} onChange={e => setPredictedWinner(e.target.value)}>
                  <option value="home">{homeName} (Home)</option>
                  <option value="draw">Draw</option>
                  <option value="away">{awayName} (Away)</option>
                </select>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                <div className="form-group">
                  <label className="form-label">{homeName} Goals</label>
                  <input type="number" className="form-input" min="0" max="20" value={homeGoals}
                    onChange={e => setHomeGoals(parseInt(e.target.value) || 0)} required />
                  {homeScorers.map((val, i) => (
                    <input key={i} type="text" className="form-input"
                      placeholder={`${homeName} scorer ${i + 1} *`}
                      value={val} onChange={e => updateHomeScorer(i, e.target.value)}
                      style={{ marginTop: '4px', fontSize: 'var(--text-sm)' }} required />
                  ))}
                </div>
                <div className="form-group">
                  <label className="form-label">{awayName} Goals</label>
                  <input type="number" className="form-input" min="0" max="20" value={awayGoals}
                    onChange={e => setAwayGoals(parseInt(e.target.value) || 0)} required />
                  {awayScorers.map((val, i) => (
                    <input key={i} type="text" className="form-input"
                      placeholder={`${awayName} scorer ${i + 1} *`}
                      value={val} onChange={e => updateAwayScorer(i, e.target.value)}
                      style={{ marginTop: '4px', fontSize: 'var(--text-sm)' }} required />
                  ))}
                </div>
              </div>

              {predictedWinner === 'draw' && (
                <div className="form-group" style={{ marginTop: 'var(--space-sm)' }}>
                  <label className="form-label">First Goal Team</label>
                  <select className="form-select" value={firstGoalTeam} onChange={e => setFirstGoalTeam(e.target.value)}>
                    <option value="home">{homeName}</option>
                    <option value="away">{awayName}</option>
                    <option value="none">None / No goals</option>
                  </select>
                </div>
              )}
            </div>

            {/* Probabilities */}
            <div style={{ background: 'var(--color-surface-secondary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-medium)', marginBottom: 'var(--space-md)' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-sm)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>📊 Probabilities (%)</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-sm)' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Home Win</label>
                  <input type="number" step="0.01" className="form-input" min="0" max="100" value={homeWinProb}
                    onChange={e => setHomeWinProb(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Draw</label>
                  <input type="number" step="0.01" className="form-input" min="0" max="100" value={drawProb}
                    onChange={e => setDrawProb(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Away Win</label>
                  <input type="number" step="0.01" className="form-input" min="0" max="100" value={awayWinProb}
                    onChange={e => setAwayWinProb(e.target.value)} required />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-sm)' }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Both Teams to Score (%)</label>
                  <input type="number" step="0.01" className="form-input" min="0" max="100" value={bttsProb}
                    onChange={e => setBttsProb(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>BTTS Prediction</label>
                  <select className="form-select" value={bttsPrediction ? 'yes' : 'no'} onChange={e => setBttsPrediction(e.target.value === 'yes')}>
                    <option value="yes">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? 'Submitting...' : (existingPrediction ? '💾 Update Prediction' : '📤 Submit Prediction')}
              </button>
            </div>
          </form>
          ) : (
            <div style={{ background: 'var(--color-surface)', padding: 'var(--space-lg)', borderRadius: 'var(--radius-medium)', textAlign: 'center', border: '1px dashed var(--color-border)' }}>
              <div style={{ fontSize: 'var(--text-3xl)', marginBottom: 'var(--space-sm)' }}>📄</div>
              <h3 style={{ marginBottom: 'var(--space-sm)' }}>Upload Prediction JSON</h3>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)', fontSize: 'var(--text-sm)' }}>
                Upload the AI model output JSON file. The system accepts the final prediction format with
                win probabilities, score predictions, goal insights, player predictions, and clean sheet predictions.
              </p>
              <div style={{ display: 'flex', justifyContent: 'center' }}>
                <input 
                  type="file" 
                  accept=".json" 
                  onChange={handleFileUpload} 
                  disabled={loading} 
                  className="form-input" 
                  style={{ maxWidth: '300px' }} 
                />
              </div>
              <div className="modal-footer" style={{ marginTop: 'var(--space-xl)', display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubmitPredictionModal;
