import React, { useState } from 'react';

const mockScores = [
  {rank:1, code:'A', name:'Team A', winner:5, scoreline:10, probability:5, player:5, base:25, grade:'A', multiplier:3, earned:75},
  {rank:2, code:'B', name:'Team B', winner:5, scoreline:5, probability:5, player:2, base:17, grade:'B', multiplier:2, earned:34},
  {rank:3, code:'C', name:'Team C', winner:5, scoreline:5, probability:0, player:5, base:15, grade:'B', multiplier:2, earned:30},
  {rank:4, code:'D', name:'Team D', winner:0, scoreline:5, probability:0, player:2, base:7, grade:'B', multiplier:2, earned:14},
  {rank:5, code:'E', name:'Team E', winner:0, scoreline:0, probability:0, player:0, base:0, grade:'C', multiplier:1, earned:0},
];

const scoreColor = (val, max) => {
  if (val === 0) return {color:'var(--color-status-error)'};
  if (val >= max) return {color:'var(--color-status-success)'};
  return {};
};

const rankBadge = (rank) => {
  if (rank === 1) return <span className="rank-badge rank-badge-1">🏆</span>;
  if (rank === 2) return <span className="rank-badge rank-badge-2">🥈</span>;
  if (rank === 3) return <span className="rank-badge rank-badge-3">🥉</span>;
  return <span className="rank-badge rank-badge-n">#{rank}</span>;
};

const formatTeamDisplay = (e) => {
  const code = e.team_id || e.code || '';
  const name = e.name || '';
  return code ? `${code} – ${name}` : name;
};

const gradeBadge = (grade) => {
  const colors = {A:'badge-success', B:'badge-info', C:'badge-warning', D:'badge-error'};
  return <span className={`badge ${colors[grade] || 'badge-warning'}`}>Grade {grade}</span>;
};

const dimensionIcon = (val, max) => {
  if (val >= max) return '✅';
  if (val === 0) return '❌';
  return '〜';
};

const ScoringView = () => {
  const [selectedMatch, setSelectedMatch] = useState('Match #32 — Arsenal vs Chelsea');

  const handleCalculate = () => {
    if (window.confirm('Calculate scores for Match #32? This will compute scores for all 5 teams.')) {
      window.alert('Scores calculated for Match #32!');
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">⚡ Scoring Engine</h1>
          <p className="page-subtitle">Match score breakdown — Winner · Scoreline · Probability · Player</p>
        </div>
        <div className="page-header-actions">
          <select className="form-select" style={{width:'200px'}} value={selectedMatch} onChange={e => setSelectedMatch(e.target.value)}>
            <option>Match #32 — Arsenal vs Chelsea</option>
          </select>
          <button className="btn btn-primary" onClick={handleCalculate}>⚡ Calculate Scores</button>
        </div>
      </div>

      <div className="alert alert-success">✅ Scores calculated for Match #32 · Base Score = Σ(Winner+Scoreline+Probability+Player) · Max 25</div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:'var(--space-lg)'}}>
        {mockScores.map((s, i) => (
          <div key={s.rank} className={`score-breakdown-card ${s.rank === 1 ? 'rank-1-card' : ''}`} style={{animation:`slideUp ${400 + i * 100}ms var(--ease-out) both`}}>
            <div className="card-header">
              <div style={{display:'flex',alignItems:'center',gap:'var(--space-sm)'}}>
                {rankBadge(s.rank)}
                <strong style={{fontFamily:'var(--font-display)',textTransform:'uppercase',letterSpacing:'0.03em'}}>{formatTeamDisplay({team_id:s.code,name:s.name})}</strong>
              </div>
              {gradeBadge(s.grade)}
            </div>
            <div className="dimension-row">
              <span className="dimension-label">Winner Prediction</span>
              <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width:`${(s.winner / 5) * 100}%`}}></div></div>
              <span className="dimension-score" style={scoreColor(s.winner, 5)}>{s.winner}/5</span>
              <span className="dimension-icon">{dimensionIcon(s.winner, 5)}</span>
            </div>
            <div className="dimension-row">
              <span className="dimension-label">Scoreline Exactness</span>
              <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width:`${(s.scoreline / 10) * 100}%`}}></div></div>
              <span className="dimension-score" style={scoreColor(s.scoreline, 10)}>{s.scoreline}/10</span>
              <span className="dimension-icon">{dimensionIcon(s.scoreline, 10)}</span>
            </div>
            <div className="dimension-row">
              <span className="dimension-label">Probability Accuracy</span>
              <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width:`${(s.probability / 5) * 100}%`}}></div></div>
              <span className="dimension-score" style={scoreColor(s.probability, 5)}>{s.probability}/5</span>
              <span className="dimension-icon">{dimensionIcon(s.probability, 5)}</span>
            </div>
            <div className="dimension-row">
              <span className="dimension-label">Player Performance</span>
              <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{width:`${(s.player / 5) * 100}%`}}></div></div>
              <span className="dimension-score" style={scoreColor(s.player, 5)}>{s.player}/5</span>
              <span className="dimension-icon">{dimensionIcon(s.player, 5)}</span>
            </div>
            <div className="score-total-row">
              <div>
                <div className="base-score-label">Base Score</div>
                <div className="base-score-value">{s.base}<span style={{color:'var(--color-text-secondary)',fontSize:'var(--text-lg)'}}>/25</span></div>
              </div>
              <div style={{textAlign:'right'}}>
                <div style={{fontSize:'var(--text-xs)',color:'var(--color-text-secondary)',textTransform:'uppercase',letterSpacing:'0.04em'}}>Earned Points</div>
                <div className="earned-score score-digit">{s.earned} pts</div>
              </div>
            </div>
          </div>
        ))}
      </div>

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
    </div>
  );
};

export default ScoringView;
