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

const calculateScorelineSubcategory = (prediction, actualResult) => {
  if (!prediction || !actualResult) return 0.0;
  const predHome = prediction.predicted_home_goals;
  const predAway = prediction.predicted_away_goals;
  const actHome = actualResult.actual_home_goals;
  const actAway = actualResult.actual_away_goals;
  
  if (predHome == null || predAway == null || actHome == null || actAway == null) return 0.0;
  
  const pHome = parseInt(predHome, 10);
  const pAway = parseInt(predAway, 10);
  const aHome = parseInt(actHome, 10);
  const aAway = parseInt(actAway, 10);
  
  if (pHome === aHome && pAway === aAway) {
    return 7.5;
  }
  if (pHome === aHome || pAway === aAway) {
    return 4.0;
  }
  if ((pHome - pAway) === (aHome - aAway)) {
    return 3.0;
  }
  return 0.0;
};

const calculateProbabilitySubcategories = (prediction, actualResult) => {
  let winnerConfPoints = 0.0;
  let bttsProbPoints = 0.0;
  let ftsProbPoints = 0.0;
  
  if (!prediction || !actualResult) {
    return { winnerConfPoints, bttsProbPoints, ftsProbPoints };
  }
  
  const getTierPoints = (prob, highT, highP, medT, medP, lowT, lowP) => {
    if (prob == null) return 0.0;
    let val = parseFloat(prob);
    if (isNaN(val)) return 0.0;
    if (val > 0.0 && val <= 1.0) {
      val = val * 100.0;
    }
    if (val >= highT) return parseFloat(highP);
    if (val >= medT) return parseFloat(medP);
    if (val >= lowT) return parseFloat(lowP);
    return 0.0;
  };

  // 1. Winner Confidence
  const predWinner = (prediction.predicted_winner || '').toLowerCase().trim();
  const actWinner = (actualResult.actual_winner || '').toLowerCase().trim();
  if (predWinner && predWinner === actWinner) {
    let winnerProb = 0.0;
    if (predWinner === 'home') winnerProb = prediction.home_win_probability;
    else if (predWinner === 'away') winnerProb = prediction.away_win_probability;
    else if (predWinner === 'draw') winnerProb = prediction.draw_probability;
    
    winnerConfPoints = getTierPoints(winnerProb, 70.0, 2.0, 50.0, 1.5, 30.0, 1.0);
  }
  
  // 2. BTTS Probability
  const actHome = actualResult.actual_home_goals != null ? parseInt(actualResult.actual_home_goals, 10) : null;
  const actAway = actualResult.actual_away_goals != null ? parseInt(actualResult.actual_away_goals, 10) : null;
  const actBtts = (actHome > 0 && actAway > 0);
  
  let predBtts = prediction.both_teams_to_score_prediction;
  const bttsProb = prediction.both_teams_to_score_probability;
  if (predBtts === null || predBtts === undefined) {
    if (bttsProb != null && parseFloat(bttsProb) > 0.0) {
      const bp = parseFloat(bttsProb);
      predBtts = (bp >= 50.0 || (bp <= 1.0 && bp >= 0.5));
    } else {
      const pHome = prediction.predicted_home_goals != null ? parseInt(prediction.predicted_home_goals, 10) : 0;
      const pAway = prediction.predicted_away_goals != null ? parseInt(prediction.predicted_away_goals, 10) : 0;
      predBtts = (pHome > 0 && pAway > 0);
    }
  }
  
  if (predBtts === actBtts) {
    bttsProbPoints = getTierPoints(bttsProb, 70.0, 1.0, 50.0, 0.75, 30.0, 0.5);
  }
  
  // 3. First Team To Score Probability
  const predFirstTeam = (prediction.first_goal_team || '').toLowerCase().trim();
  const actFirstTeam = (actualResult.first_team_to_score || 'none').toLowerCase().trim();
  if (predFirstTeam && predFirstTeam === actFirstTeam) {
    const firstTeamProb = prediction.first_goal_team_probability;
    ftsProbPoints = getTierPoints(firstTeamProb, 70.0, 2.0, 50.0, 1.5, 30.0, 1.0);
  }
  
  return { winnerConfPoints, bttsProbPoints, ftsProbPoints };
};

const renderSubcategoryRow = (label, earned, max) => {
  const earnedFmt = Number(earned || 0).toFixed(2).replace(/\.00$/, '.0').replace(/\.50$/, '.5');
  return (
    <div key={label} className="dimension-row subcategory-row" style={{ paddingLeft: 'var(--space-md)', opacity: 0.8, fontSize: 'var(--text-sm)', borderTop: '1px dashed var(--color-border)' }}>
      <span className="dimension-label" style={{ width: '180px', color: 'var(--color-text-secondary)' }}>
        <span style={{ marginRight: 'var(--space-xs)', color: 'var(--color-primary-light)' }}>•</span> {label}
      </span>
      <div className="dimension-bar-wrap" style={{ height: '4px' }}>
        <div className="dimension-bar-fill" style={{ width: `${(earned / max) * 100}%`, background: 'var(--color-primary-light)' }}></div>
      </div>
      <span className="dimension-score" style={{ fontSize: 'var(--text-xs)' }}>
        {earnedFmt}/{max}
      </span>
      <span className="dimension-icon" style={{ fontSize: '12px' }}>
        {dimensionIcon(earned, max)}
      </span>
    </div>
  );
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

              // Subcategory calculations
              const winnerSubScore = Math.max(0, (breakdown.winner_points || 0) - (breakdown.first_team_to_score_points || 0));
              const fttsSubScore = breakdown.first_team_to_score_points || 0;

              const bttsSubScore = breakdown.btts_points || 0;
              const scorelineSubScore = calculateScorelineSubcategory(s.prediction, selectedMatch.actual_result);

              const { winnerConfPoints, bttsProbPoints, ftsProbPoints } = calculateProbabilitySubcategories(s.prediction, selectedMatch.actual_result);

              const cleanSheetSubScore = breakdown.clean_sheet_points || 0;
              const goalScorersSubScore = Math.max(0, (breakdown.player_points || 0) - cleanSheetSubScore);
              
              return (
                <div key={s.team_id} className={`score-breakdown-card ${s.displayRank === 1 ? 'rank-1-card' : ''}`} style={{animation:`slideUp ${400 + i * 100}ms var(--ease-out) both`}}>
                  <div className="card-header">
                    <div style={{display:'flex',alignItems:'center',gap:'var(--space-sm)'}}>
                      <strong style={{fontFamily:'var(--font-display)',textTransform:'uppercase',letterSpacing:'0.03em'}}>{formatTeamDisplay({team_id:s.team_code,name:s.team_name})}</strong>
                    </div>
                  </div>
                  
                  {/* Category: Winner Prediction */}
                  <div className="dimension-row" style={{ fontWeight: '700' }}>
                    <span className="dimension-label">Winner Prediction</span>
                    <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width:`${(breakdown.winner_points / 5) * 100}%`}}></div></div>
                    <span className="dimension-score" style={scoreColor(breakdown.winner_points, 5)}>{breakdown.winner_points}/5</span>
                    <span className="dimension-icon">{dimensionIcon(breakdown.winner_points, 5)}</span>
                  </div>
                  {renderSubcategoryRow("Winner", winnerSubScore, 2.5)}
                  {renderSubcategoryRow("First Team To Score", fttsSubScore, 2.5)}

                  {/* Category: Scoreline */}
                  <div className="dimension-row" style={{ fontWeight: '700', marginTop: 'var(--space-sm)' }}>
                    <span className="dimension-label">Scoreline</span>
                    <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width:`${(breakdown.scoreline_points / 7.5) * 100}%`}}></div></div>
                    <span className="dimension-score" style={scoreColor(breakdown.scoreline_points, 7.5)}>{breakdown.scoreline_points}/7.5</span>
                    <span className="dimension-icon">{dimensionIcon(breakdown.scoreline_points, 7.5)}</span>
                  </div>
                  {renderSubcategoryRow("Scoreline", scorelineSubScore, 7.5)}
                  {renderSubcategoryRow("BTTS", bttsSubScore, 2.5)}

                  {/* Category: Probability */}
                  <div className="dimension-row" style={{ fontWeight: '700', marginTop: 'var(--space-sm)' }}>
                    <span className="dimension-label">Probability</span>
                    <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width:`${(breakdown.probability_points / 5) * 100}%`}}></div></div>
                    <span className="dimension-score" style={scoreColor(breakdown.probability_points, 5)}>{breakdown.probability_points}/5</span>
                    <span className="dimension-icon">{dimensionIcon(breakdown.probability_points, 5)}</span>
                  </div>
                  {renderSubcategoryRow("Winner Confidence", winnerConfPoints, 2)}
                  {renderSubcategoryRow("BTTS Probability", bttsProbPoints, 1)}
                  {renderSubcategoryRow("First Team To Score Probability", ftsProbPoints, 2)}

                  {/* Category: Player */}
                  <div className="dimension-row" style={{ fontWeight: '700', marginTop: 'var(--space-sm)' }}>
                    <span className="dimension-label">Player</span>
                    <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width:`${(breakdown.player_points / 5) * 100}%`}}></div></div>
                    <span className="dimension-score" style={scoreColor(breakdown.player_points, 5)}>{breakdown.player_points}/5</span>
                    <span className="dimension-icon">{dimensionIcon(breakdown.player_points, 5)}</span>
                  </div>
                  {renderSubcategoryRow("Goal Scorers", goalScorersSubScore, 2.5)}
                  {renderSubcategoryRow("Clean Sheet", cleanSheetSubScore, 2.5)}

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
