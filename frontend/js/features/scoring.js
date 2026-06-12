

const mockScores = [
  {rank:1,code:'A',name:'Team A',winner:5,scoreline:10,probability:5,player:5,base:25,grade:'A',multiplier:3,earned:75},
  {rank:2,code:'B',name:'Team B',winner:5,scoreline:5,probability:5,player:2,base:17,grade:'B',multiplier:2,earned:34},
  {rank:3,code:'C',name:'Team C',winner:5,scoreline:5,probability:0,player:5,base:15,grade:'B',multiplier:2,earned:30},
  {rank:4,code:'D',name:'Team D',winner:0,scoreline:5,probability:0,player:2,base:7,grade:'B',multiplier:2,earned:14},
  {rank:5,code:'E',name:'Team E',winner:0,scoreline:0,probability:0,player:0,base:0,grade:'C',multiplier:1,earned:0},
];

Router.register('scoring', () => {
  const el = document.getElementById('page-content');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">⚡ Scoring Engine</h1>
        <p class="page-subtitle">Match score breakdown — Winner · Scoreline · Probability · Player</p>
      </div>
      <div class="page-header-actions">
        <select class="form-select" style="width:200px"><option>Match #32 — Arsenal vs Chelsea</option></select>
        <button class="btn btn-primary" onclick="triggerScoreCalc()">⚡ Calculate Scores</button>
      </div>
    </div>
    <div class="alert alert-success">✅ Scores calculated for Match #32 · Base Score = Σ(Winner+Scoreline+Probability+Player) · Max 25</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:var(--space-lg)" id="score-cards"></div>
    <div class="card section" style="margin-top:var(--space-xl)">
      <div class="card-header"><span class="card-title">📐 Phase 1 Normalization</span></div>
      <div class="formula-card">
        <div class="formula-title">Formula</div>
        <div class="formula-text">Phase 1 Score = (Total Earned / Max Earned) × 60<br>Example (Top Team): (75 / 75) × 60 = <strong>60.0 / 60</strong></div>
      </div>
    </div>
  `;
  document.getElementById('score-cards').innerHTML = mockScores.map((s, i) => `
    <div class="score-breakdown-card ${s.rank===1?'rank-1-card':''}" style="animation:slideUp ${400+i*100}ms var(--ease-out) both">
      <div class="card-header">
        <div style="display:flex;align-items:center;gap:var(--space-sm)">${Utils.rankBadge(s.rank)}<strong style="font-family:var(--font-display);text-transform:uppercase;letter-spacing:0.03em">Team ${s.code} — ${s.name}</strong></div>
        ${Utils.gradeBadge(s.grade)}
      </div>
      <div class="dimension-row">
        <span class="dimension-label">Winner Prediction</span>
        <div class="dimension-bar-wrap"><div class="dimension-bar-fill" style="width:${(s.winner/5)*100}%"></div></div>
        <span class="dimension-score" style="${Utils.scoreColor(s.winner,5)}">${s.winner}/5</span>
        <span class="dimension-icon">${s.winner===5?'✅':s.winner===0?'❌':'〜'}</span>
      </div>
      <div class="dimension-row">
        <span class="dimension-label">Scoreline Exactness</span>
        <div class="dimension-bar-wrap"><div class="dimension-bar-fill" style="width:${(s.scoreline/10)*100}%"></div></div>
        <span class="dimension-score" style="${Utils.scoreColor(s.scoreline,10)}">${s.scoreline}/10</span>
        <span class="dimension-icon">${s.scoreline===10?'✅':s.scoreline===0?'❌':'〜'}</span>
      </div>
      <div class="dimension-row">
        <span class="dimension-label">Probability Accuracy</span>
        <div class="dimension-bar-wrap"><div class="dimension-bar-fill" style="width:${(s.probability/5)*100}%"></div></div>
        <span class="dimension-score" style="${Utils.scoreColor(s.probability,5)}">${s.probability}/5</span>
        <span class="dimension-icon">${s.probability===5?'✅':s.probability===0?'❌':'〜'}</span>
      </div>
      <div class="dimension-row">
        <span class="dimension-label">Player Performance</span>
        <div class="dimension-bar-wrap"><div class="dimension-bar-fill" style="width:${(s.player/5)*100}%"></div></div>
        <span class="dimension-score" style="${Utils.scoreColor(s.player,5)}">${s.player}/5</span>
        <span class="dimension-icon">${s.player===5?'✅':s.player===0?'❌':'〜'}</span>
      </div>
      <div class="score-total-row">
        <div><div class="base-score-label">Base Score</div><div class="base-score-value">${s.base}<span style="color:var(--color-text-secondary);font-size:var(--text-lg)">/25</span></div></div>
        <div style="text-align:right"><div style="font-size:var(--text-xs);color:var(--color-text-secondary);text-transform:uppercase;letter-spacing:0.04em">Earned Points</div><div class="earned-score score-digit">${s.earned} pts</div></div>
      </div>
    </div>`).join('');
});
function triggerScoreCalc() {
  Modal.confirm('Calculate scores for Match #32? This will compute scores for all 5 teams.',
    () => Toast.success('Scores calculated for Match #32!'), 'Calculate Match Scores');
}
