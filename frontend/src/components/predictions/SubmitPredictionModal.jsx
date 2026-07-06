import React, { useState, useEffect, useCallback } from 'react';
import { PredictionService } from '../../api/predictionService';
import { useAuth } from '../../contexts/AuthContext';
import { TeamService } from '../../api/teamService';
import { useScrollLock } from '../../hooks/useScrollLock';
import { showToast } from '../../utils/toast';

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
  const [error, setError] = useState({ message: '', list: [] });
  const [entryMode, setEntryMode] = useState(initialMode);

  const getErrorDisplay = useCallback((err) => {
    const fallback = 'An unexpected error occurred.';
    if (!err) return { message: fallback, list: [fallback] };

    if (err.response?.data?.detail) {
      const detail = err.response.data.detail;
      if (Array.isArray(detail)) {
        const errors = detail.map(d => {
          const loc = d.loc ? d.loc.filter(l => l !== 'body').join(' \u2192 ') : '';
          return loc ? `${loc}: ${d.msg}` : d.msg;
        });
        return {
          message: errors.length === 1 ? errors[0] : 'Multiple validation errors:',
          list: errors,
        };
      }
      if (typeof detail === 'string') {
        return { message: detail, list: [detail] };
      }
      const str = JSON.stringify(detail);
      return { message: str, list: [str] };
    }

    const status = err.response?.status;
    if (status === 400) {
      const msg = 'Bad request. Please check your input.';
      return { message: msg, list: [msg] };
    }
    if (status === 401) {
      const msg = 'You are not authenticated. Please log in again.';
      return { message: msg, list: [msg] };
    }
    if (status === 403) {
      const msg = 'You do not have permission to perform this action.';
      return { message: msg, list: [msg] };
    }
    if (status === 404) {
      const msg = 'Resource not found.';
      return { message: msg, list: [msg] };
    }
    if (status && status >= 500) {
      const msg = 'Server error. Please try again later.';
      return { message: msg, list: [msg] };
    }

    if (err.code === 'ERR_NETWORK' || err.message === 'Network Error') {
      const msg = 'Network error. Please check your connection.';
      return { message: msg, list: [msg] };
    }

    const msg = err.message || fallback;
    return { message: msg, list: [msg] };
  }, []);

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
    setError({ message: '', list: [] });
  };

  if (!isOpen || !match) return null;

  const homeName = match.home_team_name || 'Home';
  const awayName = match.away_team_name || 'Away';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({ message: '', list: [] });

    if (isOrganizer && !orgTeam) {
      setError({ message: 'Please select a team for this prediction.', list: ['Please select a team for this prediction.'] });
      return;
    }

    // Validate scorer names filled in
    if (homeScorers.some(s => !s.trim())) {
      setError({ message: `Please enter all ${homeGoals} ${homeName} scorer name(s).`, list: [`Please enter all ${homeGoals} ${homeName} scorer name(s).`] });
      return;
    }
    if (awayScorers.some(s => !s.trim())) {
      setError({ message: `Please enter all ${awayGoals} ${awayName} scorer name(s).`, list: [`Please enter all ${awayGoals} ${awayName} scorer name(s).`] });
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
      showToast('Prediction submitted successfully', 'success');
      onPredictionSubmitted();
      onClose();
    } catch (err) {
      const display = getErrorDisplay(err);
      setError(display);
      showToast(display.message, 'error');
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
      setError({ message: 'Please select a team before uploading JSON.', list: ['Please select a team before uploading JSON.'] });
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rawJson = JSON.parse(event.target.result);

        // ---------------------------------------------------------------
        // Detect format: new AI model output or legacy prediction schema
        // ---------------------------------------------------------------
        const inner = rawJson.output ? rawJson.output : rawJson;

        const isNewFormat = (
          'score_prediction' in inner ||
          'goal_insights' in inner ||
          'player_prediction' in inner ||
          ('match_prediction' in inner && 'win_probabilities' in (inner.match_prediction || {}))
        );

        let payload;

        if (isNewFormat) {
          // ---- New AI model output format ----
          const mpRaw = inner.match_prediction || {};
          const scorePred = inner.score_prediction || {};
          const goalInsights = inner.goal_insights || {};
          const playerPredRaw = inner.player_prediction || {};

          // Win probabilities
          const winProbs = mpRaw.win_probabilities || {};
          const homeProb = winProbs.home_team?.probability ?? 0;
          const drawProb = winProbs.draw?.probability ?? 0;
          const awayProb = winProbs.away_team?.probability ?? 0;

          // Determine winner
          const probsMap = { home: homeProb, draw: drawProb, away: awayProb };
          const predictedWinner = Object.entries(probsMap).reduce(
            (best, [k, v]) => v > best[1] ? [k, v] : best, ['home', -1]
          )[0];

          // Score prediction
          const scorelineRaw = scorePred.predicted_scoreline || {};
          const homeGoals = scorelineRaw.home_goals ?? 0;
          const awayGoals = scorelineRaw.away_goals ?? 0;
          const homeTeamName = scorelineRaw.home_team;
          const awayTeamName = scorelineRaw.away_team;
          const totalGoals = scorePred.total_goals ?? (homeGoals + awayGoals);

          // First team to score
          const ftsRaw = goalInsights.first_team_to_score || {};
          let firstTeamObj = null;
          if (ftsRaw.team) {
            let normalizedTeam = ftsRaw.team;
            if (ftsRaw.team === homeTeamName) normalizedTeam = 'home';
            else if (ftsRaw.team === awayTeamName) normalizedTeam = 'away';
            firstTeamObj = { team: normalizedTeam, probability: ftsRaw.probability ?? 0 };
          }

          // BTTS
          const bttsRaw = goalInsights.both_teams_to_score || null;

          // Player predictions + clean sheet
          const playerPredictions = [];
          const cleanSheetPredictions = [];
          const goalScorers = { home: [], away: [] };

          for (const [sideKey, sideLabel] of [['home_team', 'home'], ['away_team', 'away']]) {
            const sideData = playerPredRaw[sideKey] || {};
            const goalList = sideData.goal || [];
            for (const p of goalList) {
              const name = p.name;
              const preds = p.predictions || [];
              if (!name || !preds.length) continue;
              const best = preds.reduce((a, b) => (b.probability ?? 0) > (a.probability ?? 0) ? b : a, preds[0]);
              const predictedGoals = best.goal_count ?? 0;
              const goalProb = best.probability ?? 0;
              playerPredictions.push({
                player_name: name,
                team: sideLabel,
                predicted_goals: predictedGoals,
                goal_probability: goalProb,
                probability: goalProb,
              });
              goalScorers[sideLabel].push({ name, predicted_goals: predictedGoals, probability: goalProb });
            }
            const cs = sideData.clean_sheet_prediction || {};
            if (cs && (cs.goalkeeper || cs.prediction !== undefined)) {
              cleanSheetPredictions.push(cs);
            }
          }

          payload = {
            team_id: isOrganizer ? orgTeam : 'self',
            match_id: match.id,
            submission_id: rawJson.submission_id || `sub-json-${Date.now()}`,
            match_prediction: {
              predicted_winner: predictedWinner,
              predicted_scoreline: {
                home_team_goals: homeGoals,
                away_team_goals: awayGoals,
              },
              probabilities: {
                home_win_probability: homeProb,
                draw_probability: drawProb,
                away_win_probability: awayProb,
              },
              total_goals_prediction: totalGoals,
              first_team_to_score: firstTeamObj,
              both_teams_to_score: bttsRaw,
              clean_sheet_predictions: cleanSheetPredictions,
              goal_scorers: goalScorers,
            },
            player_predictions: playerPredictions,
          };

        } else {
          // ---- Legacy format: validate required fields ----
          const missing = [];
          if (!inner.match_prediction) missing.push('match_prediction');
          if (!inner.match_prediction?.predicted_scoreline) missing.push('match_prediction.predicted_scoreline');
          if (!inner.match_prediction?.probabilities) missing.push('match_prediction.probabilities');

          if (missing.length > 0) {
            throw new Error(
              `Unsupported JSON structure. Expected either the legacy prediction schema or the official AI model output schema.\n` +
              `Missing fields: ${missing.join(', ')}`
            );
          }

          payload = {
            ...inner,
            team_id: isOrganizer ? orgTeam : 'self',
            match_id: match.id,
            submission_id: inner.submission_id || `sub-json-${Date.now()}`,
          };
        }

        // Validate match_id if present in JSON
        if (rawJson.match_id && rawJson.match_id !== match.id) {
          throw new Error(`JSON match_id (${rawJson.match_id}) does not match current match (${match.id}).`);
        }

        setLoading(true);
        await PredictionService.submitPrediction(payload);
        showToast(
          isNewFormat
            ? 'AI model output parsed and submitted successfully'
            : 'Prediction submitted successfully',
          'success'
        );
        onPredictionSubmitted();
        onClose();
      } catch (err) {
        const display = getErrorDisplay(err);
        setError(display);
        showToast(display.message, 'error');
      } finally {
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
          {error.message && (
            <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>
              {error.list.length > 1 ? (
                <>
                  <p style={{ marginBottom: 'var(--space-sm)' }}>{error.message}</p>
                  <ul style={{ margin: 0, paddingLeft: 'var(--space-lg)' }}>
                    {error.list.map((e, i) => (
                      <li key={i} style={{ marginBottom: '2px' }}>{e}</li>
                    ))}
                  </ul>
                </>
              ) : (
                <p>{error.message}</p>
              )}
            </div>
          )}

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
