import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MatchService } from '../../api/matchService';
import { ScoringService } from '../../api/scoringService';
import { ScoresService } from '../../api/scoresService';

const ScoringView = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const initialMatchId = searchParams.get('match');

  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(initialMatchId || '');
  const [matchBreakdown, setMatchBreakdown] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const matchesData = await MatchService.listMatches();
      setMatches(matchesData);
      
      if (!selectedMatchId && matchesData.length > 0) {
        setSelectedMatchId(matchesData[0].id);
      }
      
      const breakdownData = await ScoresService.getMatchBreakdown();
      setMatchBreakdown(breakdownData);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load scoring data');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!selectedMatchId) return;
    
    if (!window.confirm(`Calculate scores for selected match? This will compute scores for all teams.`)) return;
    
    setCalculating(true);
    setError('');
    setSuccessMsg('');
    try {
      const res = await ScoringService.calculateMatchScoreBulk(selectedMatchId);
      if (res.status === 'no_predictions') {
        setError('No predictions found for this match.');
      } else {
        setSuccessMsg(`✅ Scores calculated successfully for ${res.calculated_count} teams!`);
      }
      
      // Reload breakdown
      const breakdownData = await ScoresService.getMatchBreakdown();
      setMatchBreakdown(breakdownData);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Calculation failed');
    } finally {
      setCalculating(false);
    }
  };

  const getScoreColor = (score, max) => {
    const ratio = score / max;
    if (ratio >= 0.8) return {color: 'var(--color-status-success)'};
    if (ratio >= 0.5) return {color: 'var(--color-status-warning)'};
    return {color: 'var(--color-status-error)'};
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="rank-badge rank-1">🥇 1st</span>;
    if (rank === 2) return <span className="rank-badge rank-2">🥈 2nd</span>;
    if (rank === 3) return <span className="rank-badge rank-3">🥉 3rd</span>;
    return <span className="rank-badge">{rank}th</span>;
  };

  // Find selected match data from breakdown
  const selectedMatchBreakdown = matchBreakdown?.find(m => m.match_id === selectedMatchId);
  
  // Sort teams by base_score descending
  const sortedTeams = selectedMatchBreakdown?.teams ? [...selectedMatchBreakdown.teams].sort((a, b) => {
    return (b.score_breakdown?.base_score || 0) - (a.score_breakdown?.base_score || 0);
  }).map((t, index) => ({ ...t, rank: index + 1 })) : [];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">⚡ Scoring Engine</h1>
          <p className="page-subtitle">Match score breakdown — Winner · Scoreline · Probability · Player</p>
        </div>
        <div className="page-header-actions" style={{display: 'flex', gap: 'var(--space-md)', alignItems: 'center'}}>
          <select 
            className="form-select" 
            style={{width: '250px'}} 
            value={selectedMatchId} 
            onChange={(e) => {
              setSelectedMatchId(e.target.value);
              setSuccessMsg('');
              setError('');
            }}
          >
            {matches.map(m => (
              <option key={m.id} value={m.id}>
                Match M{m.match_number} — {m.home_team_name} vs {m.away_team_name}
              </option>
            ))}
          </select>
          <button 
            className={`btn btn-primary ${calculating ? 'loading' : ''}`} 
            onClick={handleCalculate}
            disabled={calculating || !selectedMatchId}
          >
            <span>{calculating ? 'Calculating...' : '⚡ Calculate Scores'}</span>
            {calculating && <span className="spinner"></span>}
          </button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{marginBottom: 'var(--space-md)'}}>{error}</div>}
      {successMsg && <div className="alert alert-success" style={{marginBottom: 'var(--space-md)'}}>{successMsg}</div>}

      {loading ? (
        <div style={{display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)'}}>
          <span className="spinner" style={{width: '32px', height: '32px', borderWidth: '4px'}}></span>
        </div>
      ) : sortedTeams.length === 0 ? (
        <div className="empty-state" style={{marginTop: 'var(--space-lg)'}}>
          <div className="empty-icon">📊</div>
          <h2 className="empty-title">No Scores Yet</h2>
          <p className="empty-desc">Click "Calculate Scores" to evaluate team predictions against the actual result.</p>
        </div>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'var(--space-lg)'}}>
          {sortedTeams.map((team, i) => {
            const br = team.score_breakdown || {};
            const baseScore = br.base_score || 0;
            const winner = br.winner_points || 0;
            const scoreline = br.scoreline_points || 0;
            const prob = br.probability_points || 0;
            const player = br.player_points || 0;
            
            return (
              <div key={team.team_id} className={`score-breakdown-card ${team.rank === 1 ? 'rank-1-card' : ''}`} style={{animation: `slideUp ${400 + i*100}ms var(--ease-out) both`}}>
                <div className="card-header">
                  <div style={{display: 'flex', alignItems: 'center', gap: 'var(--space-sm)'}}>
                    {getRankBadge(team.rank)}
                    <strong style={{fontFamily: 'var(--font-display)', textTransform: 'uppercase', letterSpacing: '0.03em'}}>{team.team_name}</strong>
                  </div>
                </div>
                
                <div className="dimension-row">
                  <span className="dimension-label">Winner Prediction</span>
                  <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width: `${(winner/5)*100}%`}}></div></div>
                  <span className="dimension-score" style={getScoreColor(winner, 5)}>{winner}/5</span>
                  <span className="dimension-icon">{winner === 5 ? '✅' : winner === 0 ? '❌' : '〜'}</span>
                </div>
                
                <div className="dimension-row">
                  <span className="dimension-label">Scoreline Exactness</span>
                  <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width: `${(scoreline/10)*100}%`}}></div></div>
                  <span className="dimension-score" style={getScoreColor(scoreline, 10)}>{scoreline}/10</span>
                  <span className="dimension-icon">{scoreline === 10 ? '✅' : scoreline === 0 ? '❌' : '〜'}</span>
                </div>
                
                <div className="dimension-row">
                  <span className="dimension-label">Probability Accuracy</span>
                  <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width: `${(prob/5)*100}%`}}></div></div>
                  <span className="dimension-score" style={getScoreColor(prob, 5)}>{prob}/5</span>
                  <span className="dimension-icon">{prob === 5 ? '✅' : prob === 0 ? '❌' : '〜'}</span>
                </div>
                
                <div className="dimension-row">
                  <span className="dimension-label">Player Performance</span>
                  <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width: `${(player/5)*100}%`}}></div></div>
                  <span className="dimension-score" style={getScoreColor(player, 5)}>{player}/5</span>
                  <span className="dimension-icon">{player === 5 ? '✅' : player === 0 ? '❌' : '〜'}</span>
                </div>
                
                <div className="score-total-row">
                  <div>
                    <div className="base-score-label">Base Score</div>
                    <div className="base-score-value">{baseScore}<span style={{color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)'}}>/25</span></div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      <div className="card section" style={{marginTop: 'var(--space-xl)'}}>
        <div className="card-header"><span className="card-title">📐 Phase 1 Normalization</span></div>
        <div className="formula-card">
          <div className="formula-title">Formula</div>
          <div className="formula-text">
            Phase 1 Score = (Total Earned / Max Earned) × 60<br/>
            Example: Base score determines rank, and multiplier determines final points (Implementation varies per configuration).
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScoringView;
