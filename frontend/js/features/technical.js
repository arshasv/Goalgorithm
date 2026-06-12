

const teams = ['Team A','Team B','Team C','Team D','Team E'];
const techData = [
  {team:'A',name:'Team A',code:5,backend:5,teamwork:5,ai:4},
  {team:'B',name:'Team B',code:4,backend:4,teamwork:4,ai:5},
  {team:'C',name:'Team C',code:3,backend:4,teamwork:4,ai:4},
  {team:'D',name:'Team D',code:3,backend:3,teamwork:2,ai:2},
  {team:'E',name:'Team E',code:1,backend:1,teamwork:1,ai:2},
];
Router.register('technical', () => {
  const el = document.getElementById('page-content');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">💻 Technical Evaluation</h1>
        <p class="page-subtitle">Phase 2 · Committee Score Entry · 4 sub-dimensions × 5 points = 20 total</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-ghost btn-sm" onclick="resetTechForm()">↺ Reset</button>
        <button class="btn btn-primary" onclick="submitTechScores()">✓ Submit All Technical Scores</button>
      </div>
    </div>
    <div class="alert alert-info">ℹ️ Enter integer scores 0–5 for each sub-dimension. Live total auto-calculates per team.</div>
    <div class="card section">
      <div class="card-header"><span class="card-title">📝 Score Entry Form</span></div>
      <div class="table-wrapper">
        <table id="tech-form-table">
          <thead><tr>
            <th>Team</th>
            <th class="score-header">Code Quality /5</th>
            <th class="score-header">Backend Quality /5</th>
            <th class="score-header">Teamwork /5</th>
            <th class="score-header">AI Explanation /5</th>
            <th class="score-header">Total /20</th>
          </tr></thead>
          <tbody id="tech-tbody"></tbody>
        </table>
      </div>
    </div>
  `;
  renderTechTable();
});
function renderTechTable() {
  const tb = document.getElementById('tech-tbody');
  if (!tb) return;
  tb.innerHTML = techData.map((t,i)=>`
    <tr style="animation:fadeIn ${300+i*80}ms var(--ease-out) both">
      <td style="font-weight:600;font-family:var(--font-display);text-transform:uppercase">Team ${t.team} — ${t.name}</td>
      ${['code','backend','teamwork','ai'].map(k=>`
        <td class="score-cell">
          <input class="form-input score-input" type="number" min="0" max="5" value="${t[k]}"
            id="tech-${t.team}-${k}" onchange="updateTechTotal('${t.team}')" oninput="validateScoreInput(this,5)">
        </td>`).join('')}
      <td class="score-cell"><span id="total-${t.team}" style="font-family:var(--font-score);font-size:var(--text-2xl);font-weight:700;${getTotalColor(t.code+t.backend+t.teamwork+t.ai)}">${t.code+t.backend+t.teamwork+t.ai}</span><span style="color:var(--color-text-secondary)">/20</span></td>
    </tr>`).join('');
}
function getTotalColor(v){return v===20?'color:var(--color-status-success)':v<10?'color:var(--color-status-error)':'';}
function updateTechTotal(team) {
  const vals = ['code','backend','teamwork','ai'].map(k=>+document.getElementById(`tech-${team}-${k}`)?.value||0);
  const total = vals.reduce((a,b)=>a+b,0);
  const el = document.getElementById('total-'+team);
  if (el) { el.textContent=total; el.style.cssText=`font-family:var(--font-score);font-size:var(--text-2xl);font-weight:700;${getTotalColor(total)}`; }
}
function validateScoreInput(el,max) {
  const v=+el.value;
  if(v<0||v>max){el.classList.add('error');el.title=`Must be 0–${max}`;}else{el.classList.remove('error');}
}
function resetTechForm() { techData.forEach(t=>{t.code=0;t.backend=0;t.teamwork=0;t.ai=0;}); renderTechTable(); }
async function submitTechScores() {
  Modal.confirm('Submit Phase 2 technical scores for all 5 teams?', async () => {
    for (const t of techData) {
      const payload = {team_id:t.team,
        code_quality:+document.getElementById(`tech-${t.team}-code`)?.value||0,
        backend_quality:+document.getElementById(`tech-${t.team}-backend`)?.value||0,
        teamwork:+document.getElementById(`tech-${t.team}-teamwork`)?.value||0,
        ai_explanation:+document.getElementById(`tech-${t.team}-ai`)?.value||0};
      try { await ScoringService.calculateTechnical(payload); }
      catch(e) { Toast.error(`Failed for ${t.name}: ${e.message}`); }
    }
    Toast.success('Technical scores submitted successfully!');
  }, 'Submit Phase 2 Technical Scores');
}
