import React, { useState, useEffect } from 'react';
import { ResultService } from '../../api/resultService';
import { useScrollLock } from '../../hooks/useScrollLock';

const EnterResultModal = ({ match, isOpen, onClose, onResultEntered }) => {
  useScrollLock(isOpen);
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [homeScorers, setHomeScorers] = useState([]);
  const [awayScorers, setAwayScorers] = useState([]);
  const [firstTeamToScore, setFirstTeamToScore] = useState('none');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showJsonRef, setShowJsonRef] = useState(false);

  useEffect(() => {
    const fetchExistingResult = async () => {
      if (isOpen && match && match.id) {
        setError('');
        setHomeGoals(0);
        setAwayGoals(0);
        setHomeScorers([]);
        setAwayScorers([]);
        setFirstTeamToScore('none');
        
        try {
          const res = await ResultService.getActualResult(match.id);
          if (res) {
            setHomeGoals(res.final_score?.home_team_goals || 0);
            setAwayGoals(res.final_score?.away_team_goals || 0);
            setHomeScorers(res.goal_scorers?.home || []);
            setAwayScorers(res.goal_scorers?.away || []);
            setFirstTeamToScore(res.first_team_to_score || 'none');
          }
        } catch (err) {
          if (err.response?.status !== 404) {
            setError(err.response?.data?.detail || err.message || 'Failed to load existing result');
          }
        }
      }
    };
    fetchExistingResult();
  }, [isOpen, match]);

  useEffect(() => {
    setHomeScorers(prev => Array.from({length: homeGoals}, (_, i) => prev[i] || ''));
  }, [homeGoals]);

  useEffect(() => {
    setAwayScorers(prev => Array.from({length: awayGoals}, (_, i) => prev[i] || ''));
  }, [awayGoals]);

  if (!isOpen || !match) return null;

  const home = match.home_team_name || match.home || 'Home Team';
  const away = match.away_team_name || match.away || 'Away Team';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Require all scorer names if there are goals
    if (homeScorers.some(s => !s.trim()) || awayScorers.some(s => !s.trim())) {
      setError('Please provide names for all goal scorers.');
      return;
    }

    const winner = homeGoals > awayGoals ? 'home' : (homeGoals < awayGoals ? 'away' : 'draw');

    // Build unique player list from scorers to satisfy the player_results required array
    const allScorers = [];
    homeScorers.forEach(s => allScorers.push(s.trim()));
    awayScorers.forEach(s => allScorers.push(s.trim()));
    
    // Group by name to count goals per player
    const playerMap = {};
    allScorers.forEach(name => {
      if (!playerMap[name]) playerMap[name] = 0;
      playerMap[name] += 1;
    });

    // Pydantic validation requires player_results array
    const playerResults = Object.keys(playerMap).map((name, i) => ({
      player_id: `P${i+1}`,
      player_name: name,
      actual_goals: playerMap[name]
    }));

    // If 0-0, player_results can't be empty according to validation, but Pydantic says it can't be empty
    if (playerResults.length === 0) {
      playerResults.push({
        player_id: 'NONE',
        player_name: 'No Scorers',
        actual_goals: 0
      });
    }

    const payload = {
      match_id: match.id,
      actual_winner: winner,
      final_score: { home_team_goals: parseInt(homeGoals), away_team_goals: parseInt(awayGoals) },
      goal_scorers: {
        home: homeScorers.map(s => s.trim()),
        away: awayScorers.map(s => s.trim())
      },
      player_results: playerResults,
      first_team_to_score: firstTeamToScore
    };

    setIsSubmitting(true);
    try {
      await ResultService.submitActualResult(payload);
      onResultEntered();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJsonUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const content = event.target.result;
        const data = JSON.parse(content);
        
        if (data.match_id && data.match_id !== match.id) {
          setError(`JSON match_id (${data.match_id}) does not match current match (${match.id}).`);
          return;
        }

        const payload = {
          match_id: match.id,
          actual_winner: data.actual_winner,
          final_score: data.final_score,
          goal_scorers: data.goal_scorers || { home: [], away: [] },
          player_results: data.player_results || [],
          first_team_to_score: data.first_team_to_score || 'none'
        };

        setIsSubmitting(true);
        await ResultService.submitActualResult(payload);
        onResultEntered();
        onClose();
      } catch (err) {
        setError(err.response?.data?.detail || err.message || 'Invalid JSON format');
        e.target.value = null; // reset input
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <>
      <div className="modal-overlay" onClick={onClose}>
      <div className="modal-container" onClick={e => e.stopPropagation()} style={{ minWidth: '500px' }}>
        <div className="modal-header">
          <h2 className="modal-title" style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)'}}>Enter Match Result</h2>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        <div className="modal-body">
          {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div style={{textAlign: 'center', padding: 'var(--space-md)', background: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-medium)', marginBottom: 'var(--space-md)'}}>
              <div style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em'}}>
                {home} vs {away}
              </div>
            </div>
            
            <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)'}}>
              <div className="form-group">
                <label className="form-label">{home} Goals <span className="required">*</span></label>
                <input className="form-input score-input" type="number" min="0" value={homeGoals} onChange={e => setHomeGoals(parseInt(e.target.value) || 0)} required style={{width: '100%'}} />
                <div style={{marginTop: 'var(--space-sm)'}}>
                  {homeScorers.map((val, i) => (
                    <input key={i} type="text" className="form-input" placeholder={`${home} scorer ${i+1}`} value={val} onChange={e => { const ns = [...homeScorers]; ns[i] = e.target.value; setHomeScorers(ns); }} style={{width: '100%', marginBottom: '4px', fontSize: 'var(--text-sm)', padding: '6px'}} required />
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">{away} Goals <span className="required">*</span></label>
                <input className="form-input score-input" type="number" min="0" value={awayGoals} onChange={e => setAwayGoals(parseInt(e.target.value) || 0)} required style={{width: '100%'}} />
                <div style={{marginTop: 'var(--space-sm)'}}>
                  {awayScorers.map((val, i) => (
                    <input key={i} type="text" className="form-input" placeholder={`${away} scorer ${i+1}`} value={val} onChange={e => { const ns = [...awayScorers]; ns[i] = e.target.value; setAwayScorers(ns); }} style={{width: '100%', marginBottom: '4px', fontSize: 'var(--text-sm)', padding: '6px'}} required />
                  ))}
                </div>
            </div>
            </div>
            
            <div className="form-group" style={{ marginTop: 'var(--space-md)' }}>
              <label className="form-label">First Team to Score <span className="required">*</span></label>
              <select className="form-input" value={firstTeamToScore} onChange={e => setFirstTeamToScore(e.target.value)} required style={{ width: '100%' }}>
                <option value="none">None (0-0 / No goals)</option>
                <option value="home">{home}</option>
                <option value="away">{away}</option>
              </select>
            </div>

            <div style={{ marginTop: 'var(--space-md)', padding: 'var(--space-md)', background: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-medium)' }}>
              <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, marginBottom: 'var(--space-xs)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>📁 JSON Upload</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-sm)' }}>
                Upload the full actual result JSON payload.
              </div>
              <div className="form-group">
                <label className="form-label" style={{ fontSize: 'var(--text-xs)' }}>Upload Result File (.json)</label>
                <input type="file" className="form-input" accept=".json" onChange={handleJsonUpload} disabled={isSubmitting} style={{ fontSize: 'var(--text-xs)', padding: '6px' }} />
              </div>
              <button type="button" className="btn btn-secondary btn-sm" style={{ marginTop: 'var(--space-xs)' }} onClick={() => setShowJsonRef(true)}>📄 View JSON Format</button>
            </div>

            <div className="modal-footer" style={{ display: 'flex', gap: 'var(--space-sm)', marginTop: 'var(--space-lg)', justifyContent: 'flex-end' }}>
              <button type="button" className="btn btn-ghost" onClick={onClose} disabled={isSubmitting}>Cancel</button>
              <button type="submit" className={`btn btn-primary ${isSubmitting ? 'loading' : ''}`} disabled={isSubmitting}>
                <span>{isSubmitting ? 'Submitting...' : '✓ Submit Result'}</span>
                {isSubmitting && <span className="spinner"></span>}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    {showJsonRef && (
      <div className="modal-overlay" style={{ zIndex: 1100 }} onClick={() => setShowJsonRef(false)}>
        <div className="modal-container" onClick={e => e.stopPropagation()} style={{ minWidth: '600px' }}>
          <div className="modal-header">
            <h3 className="modal-title">JSON Format Reference</h3>
            <button className="modal-close" onClick={() => setShowJsonRef(false)}>&times;</button>
          </div>
          <div className="modal-body">
            <p style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
              The JSON file must match this schema exactly. <code>goal_scorers</code> arrays must contain exactly as many names as <code>final_score</code> goals.
            </p>
            <pre style={{ background: 'var(--color-surface-secondary)', padding: 'var(--space-md)', borderRadius: 'var(--radius-md)', overflowX: 'auto', fontFamily: 'monospace', fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}>
{JSON.stringify({
  match_id: match?.id || "MATCH_ID",
  actual_winner: "home | away | draw",
  final_score: { home_team_goals: 2, away_team_goals: 1 },
  goal_scorers: {
    home: ["Player Name 1", "Player Name 2"],
    away: ["Player Name 3"]
  },
  player_results: [
    { player_id: "P1", player_name: "Player Name 1", actual_goals: 1 },
    { player_id: "P2", player_name: "Player Name 2", actual_goals: 1 },
    { player_id: "P3", player_name: "Player Name 3", actual_goals: 1 }
  ],
  first_team_to_score: "home | away | none"
}, null, 2)}
            </pre>
            <div className="modal-footer" style={{ marginTop: 'var(--space-lg)' }}>
              <button className="btn btn-primary" onClick={() => setShowJsonRef(false)}>Got it</button>
            </div>
          </div>
        </div>
      </div>
    )}
    </>
  );
};

export default EnterResultModal;
