import React, { useState, useEffect } from 'react';
import { PredictionService } from '../../api/predictionService';
import { useAuth } from '../../contexts/AuthContext';
import { TeamService } from '../../api/teamService';

/**
 * SubmitPredictionModal — handles both new submissions and edits.
 * Produces a payload that satisfies the strict PredictionSubmission Pydantic schema:
 *   - goal_scorers.home.length === predicted_scoreline.home_team_goals
 *   - goal_scorers.away.length === predicted_scoreline.away_team_goals
 *   - player_predictions cannot be empty
 */
const SubmitPredictionModal = ({ match, isOpen, onClose, onPredictionSubmitted, existingPrediction }) => {
  const { isOrganizer } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
      setFirstGoalTeam(mp.first_goal_team || 'home');
      setBttsProb(mp.both_teams_to_score_probability ?? 50);
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

    // Build player_predictions from scorers (must be non-empty per schema)
    const allScorers = [
      ...homeScorers.map(name => ({ name, side: 'home' })),
      ...awayScorers.map(name => ({ name, side: 'away' })),
    ];
    // If 0-0, backend needs at least one player_prediction — use a placeholder
    const playerPredictions = allScorers.length > 0
      ? allScorers.map((s, i) => ({
          player_id: `P${i + 1}`,
          player_name: s.name.trim(),
          goal_probability: 70,
          predicted_goals: 1,
          assist_probability: 20,
        }))
      : [{ player_id: 'P0', player_name: 'No Scorers', goal_probability: 0, predicted_goals: 0, assist_probability: 0 }];

    const payload = {
      team_id: isOrganizer ? orgTeam : 'self',  // backend resolves 'self' via user_id for team leaders
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
        clean_sheet_probability: {
          home_team: awayGoals === 0 ? 80 : 10,
          away_team: homeGoals === 0 ? 80 : 10,
        },
        first_goal_team: predictedWinner === 'draw' ? firstGoalTeam : predictedWinner,
        both_teams_to_score_probability: parseFloat(bttsProb),
        total_goals_prediction: homeGoals + awayGoals,
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

          <form onSubmit={handleSubmit}>
            {/* Organizer: team selector */}
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
                  <input type="number" className="form-input" min="0" max="100" value={homeWinProb}
                    onChange={e => setHomeWinProb(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Draw</label>
                  <input type="number" className="form-input" min="0" max="100" value={drawProb}
                    onChange={e => setDrawProb(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Away Win</label>
                  <input type="number" className="form-input" min="0" max="100" value={awayWinProb}
                    onChange={e => setAwayWinProb(e.target.value)} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Both Teams to Score (%)</label>
                <input type="number" className="form-input" min="0" max="100" value={bttsProb}
                  onChange={e => setBttsProb(e.target.value)} required />
              </div>
            </div>

            <div className="modal-footer" style={{ marginTop: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${loading ? 'loading' : ''}`} disabled={loading}>
                {loading ? 'Submitting...' : (existingPrediction ? '💾 Update Prediction' : '📤 Submit Prediction')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SubmitPredictionModal;
