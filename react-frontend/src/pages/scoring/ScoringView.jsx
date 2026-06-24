import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ScoringService } from '../../api/scoringService';

const scoreColor = (val, max) => {
  if (val === 0) return {color:'var(--color-status-error)'};
  if (val >= max) return {color:'var(--color-status-success)'};
  return {};
};


const formatTeamDisplay = (e) => {
  const code = e.team_id || e.code || '';
  const name = e.name || '';
  return code ? `${code} – ${name}` : name;
};


const dimensionIcon = (val, max) => {
  if (val >= max) return '✅';
  if (val === 0) return '❌';
  return '〜';
};

const ScoringView = () => {
  const [searchParams] = useSearchParams();
  const [matches, setMatches] = useState([]);
  const [selectedMatchId, setSelectedMatchId] = useState(searchParams.get('match') || '');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [calculating, setCalculating] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await ScoringService.getMatchBreakdown();
      setMatches(data);
      if (data.length > 0 && !selectedMatchId) {
        setSelectedMatchId(data[data.length - 1].match_id); // Default to last match
      }
    } catch (err) {
      setError('Failed to load scoring data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCalculate = async () => {
    if (!selectedMatchId) return;
    const match = matches.find(m => m.match_id === selectedMatchId);
    if (window.confirm(`Calculate scores for Match ${match?.match_number}? This will compute scores for all teams.`)) {
      setCalculating(true);
      try {
        await ScoringService.calculateMatchScoreBulk(selectedMatchId);
        window.alert(`Scores calculated for Match ${match?.match_number}!`);
        await loadData();
      } catch (err) {
        window.alert(err.response?.data?.detail || 'Failed to calculate scores');
      } finally {
        setCalculating(false);
      }
    }
  };

  if (loading) return <div className="loading-spinner"></div>;
  if (error) return <div className="alert alert-error">{error}</div>;
  if (matches.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">⚡</div>
        <p>No matches available for scoring yet.</p>
      </div>
    );
  }

  const selectedMatch = matches.find(m => m.match_id === selectedMatchId);
  const matchTeams = selectedMatch?.teams || [];

  // Sort teams by earned_points
  const sortedTeams = [...matchTeams].sort((a, b) => {
    return (b.score_breakdown?.earned_points || 0) - (a.score_breakdown?.earned_points || 0);
  });
  
  // Calculate dynamic rank handling ties
  let currentRank = 1;
  sortedTeams.forEach((t, index) => {
    const breakdown = t.score_breakdown || {};
    
    // If not scored, do not assign a rank
    if (breakdown.base_score == null) {
      t.displayRank = null;
      return;
    }

    if (index > 0) {
      const prev = sortedTeams[index - 1].score_breakdown || {};
      if (breakdown.earned_points !== prev.earned_points) {
        currentRank = index + 1;
      }
    }
    t.displayRank = currentRank;


  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">⚡ Scoring Engine</h1>
          <p className="page-subtitle">Match score breakdown — Winner · Scoreline · Probability · Player</p>
        </div>
        <div className="page-header-actions">
          <select className="form-select" style={{width:'250px'}} value={selectedMatchId} onChange={e => setSelectedMatchId(e.target.value)}>
            {matches.map(m => (
              <option key={m.match_id} value={m.match_id}>Match #{m.match_number} — {m.home_team_name} vs {m.away_team_name}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleCalculate} disabled={calculating}>
            {calculating ? '⚡ Calculating...' : '⚡ Calculate Scores'}
          </button>
        </div>
      </div>

      {!matchTeams.some(t => t.score_breakdown?.base_score !== null) ? (
        <div className="empty-state">
          <div className="empty-state-icon">📊</div>
          <p>No scores calculated for this match yet. Enter the actual result and click Calculate Scores.</p>
        </div>
      ) : (
        <>
          <div className="alert alert-success">✅ Scores calculated for Match #{selectedMatch?.match_number} · Base Score = Σ(Winner+Scoreline+Probability+Player) · Max 25</div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'var(--space-lg)'}}>
            {sortedTeams.map((s, i) => {
              const breakdown = s.score_breakdown || {};
              if (breakdown.base_score === null) return null;
              
              return (
                <div key={s.team_id} className={`score-breakdown-card ${s.displayRank === 1 ? 'rank-1-card' : ''}`} style={{animation:`slideUp ${400 + i * 100}ms var(--ease-out) both`}}>
                  <div className="card-header">
                    <div style={{display:'flex',alignItems:'center',gap:'var(--space-sm)'}}>
                      <strong style={{fontFamily:'var(--font-display)',textTransform:'uppercase',letterSpacing:'0.03em'}}>{formatTeamDisplay({team_id:s.team_code,name:s.team_name})}</strong>
                    </div>
                  </div>
                  <div className="dimension-row">
                    <span className="dimension-label">Winner Prediction</span>
                    <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width:`${(breakdown.winner_points / 5) * 100}%`}}></div></div>
                    <span className="dimension-score" style={scoreColor(breakdown.winner_points, 5)}>{breakdown.winner_points}/5</span>
                    <span className="dimension-icon">{dimensionIcon(breakdown.winner_points, 5)}</span>
                  </div>
                  <div className="dimension-row">
                    <span className="dimension-label">Scoreline Exactness</span>
                    <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width:`${(breakdown.scoreline_points / 10) * 100}%`}}></div></div>
                    <span className="dimension-score" style={scoreColor(breakdown.scoreline_points, 10)}>{breakdown.scoreline_points}/10</span>
                    <span className="dimension-icon">{dimensionIcon(breakdown.scoreline_points, 10)}</span>
                  </div>
                  <div className="dimension-row">
                    <span className="dimension-label">Probability Accuracy</span>
                    <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width:`${(breakdown.probability_points / 5) * 100}%`}}></div></div>
                    <span className="dimension-score" style={scoreColor(breakdown.probability_points, 5)}>{breakdown.probability_points}/5</span>
                    <span className="dimension-icon">{dimensionIcon(breakdown.probability_points, 5)}</span>
                  </div>
                  <div className="dimension-row">
                    <span className="dimension-label">Player Performance</span>
                    <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width:`${(breakdown.player_points / 5) * 100}%`}}></div></div>
                    <span className="dimension-score" style={scoreColor(breakdown.player_points, 5)}>{breakdown.player_points}/5</span>
                    <span className="dimension-icon">{dimensionIcon(breakdown.player_points, 5)}</span>
                  </div>
                  <div className="score-total-row">
                    <div>
                      <div className="base-score-label">Base Score</div>
                      <div className="base-score-value">{breakdown.base_score}<span style={{color:'var(--color-text-secondary)',fontSize:'var(--text-lg)'}}>/25</span></div>
                    </div>
                    <div style={{textAlign:'right'}}>
                      <div style={{fontSize:'var(--text-xs)',color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.04em'}}>Earned Points</div>
                      <div className="earned-score score-digit">{breakdown.earned_points} pts</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="card section" style={{marginTop:'var(--space-xl)'}}>
        <div className="card-header"><span className="card-title">📐 Phase 1 Normalization</span></div>
        <div className="formula-card">
          <div className="formula-title">Formula</div>
          <div className="formula-text">
            Phase 1 Score = (Total Earned / Max Earned) × 60<br />
            Example (Top Team): (75 / 75) × 60 = <strong>60.0 / 60</strong>
          </div>
        </div>
      </div>

      <div className="card section" style={{marginTop:'var(--space-xl)', border: '1px solid var(--color-status-error)'}}>
        <div className="card-header" style={{borderBottom: '1px solid var(--color-status-error)', backgroundColor: 'rgba(239, 68, 68, 0.05)'}}>
          <span className="card-title" style={{color: 'var(--color-status-error)'}}>⚠️ Danger Zone</span>
        </div>
        <div style={{padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)'}}>
          
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: 'var(--space-md)', borderBottom: '1px solid var(--color-border)'}}>
            <div>
              <h4 style={{margin: '0 0 var(--space-xs) 0'}}>Clear Prediction Scores</h4>
              <p style={{margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)'}}>
                Deletes calculated Phase 1 scores. Leaderboard Phase 1 values will be cleared. Predictions and results are preserved.
              </p>
            </div>
            <button className="btn btn-secondary" style={{borderColor: 'var(--color-status-error)', color: 'var(--color-status-error)'}} onClick={async () => {
              if (window.confirm('Are you sure? This cannot be undone. All Phase 1 prediction scores will be deleted.')) {
                try {
                  await ScoringService.resetPredictionScores();
                  window.alert('Prediction scores reset successfully.');
                  loadData();
                } catch (err) {
                  window.alert(err.response?.data?.detail || 'Failed to reset prediction scores');
                }
              }
            }}>Clear Phase 1 Scores</button>
          </div>

          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
            <div>
              <h4 style={{margin: '0 0 var(--space-xs) 0'}}>Clear All Scores</h4>
              <p style={{margin: 0, fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)'}}>
                Resets Phase 1, Phase 2, Phase 3, and all Leaderboard totals to zero. Data like teams, models, and match results are kept.
              </p>
            </div>
            <button className="btn btn-primary" style={{backgroundColor: 'var(--color-status-error)', borderColor: 'var(--color-status-error)'}} onClick={async () => {
              if (window.confirm('Are you absolutely sure? This cannot be undone. ALL scores across ALL phases will be permanently deleted and leaderboards reset to zero.')) {
                try {
                  await ScoringService.resetAllScores();
                  window.alert('All scores reset successfully. Leaderboard zeroed.');
                  loadData();
                } catch (err) {
                  window.alert(err.response?.data?.detail || 'Failed to reset all scores');
                }
              }
            }}>Clear All Scores</button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ScoringView;
