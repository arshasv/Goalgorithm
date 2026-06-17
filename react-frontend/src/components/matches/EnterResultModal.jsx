import React, { useState, useEffect } from 'react';
import { ResultService } from '../../api/resultService';

const EnterResultModal = ({ match, isOpen, onClose, onResultEntered }) => {
  const [homeGoals, setHomeGoals] = useState(0);
  const [awayGoals, setAwayGoals] = useState(0);
  const [homeScorers, setHomeScorers] = useState([]);
  const [awayScorers, setAwayScorers] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setHomeGoals(0);
      setAwayGoals(0);
      setHomeScorers([]);
      setAwayScorers([]);
      setError('');
    }
  }, [isOpen]);

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
      player_results: playerResults
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

  return (
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
  );
};

export default EnterResultModal;
