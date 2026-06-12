

const presData = [
  {team:'A',name:'Team A',ai_exp:18,qa:13,delivery:14},
  {team:'B',name:'Team B',ai_exp:15,qa:12,delivery:12},
  {team:'C',name:'Team C',ai_exp:14,qa:11,delivery:11},
  {team:'D',name:'Team D',ai_exp:10,qa:8,delivery:9},
  {team:'E',name:'Team E',ai_exp:7,qa:5,delivery:6},
];
Router.register('presentation', () => {
  const el = document.getElementById('page-content');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">🎤 Presentation Evaluation</h1>
        <p class="page-subtitle">Phase 3 · Peer Review · AI Explanation /20 + Q&A /15 + Delivery /15 = Raw /50 → Normalized /20</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-primary" onclick="submitPresScores()">✓ Submit All Presentation Scores</button>
      </div>
    </div>
    <div class="alert alert-info">ℹ️ Scores are ranked and graded (A/B/C). Formula: Raw × Multiplier ÷ 150 × 20 = Final Score</div>
    <div class="card section">
      <div class="card-header"><span class="card-title">📝 Score Entry</span></div>
      <div class="table-wrapper">
        <table>
          <thead><tr>
            <th>Team</th>
            <th class="score-header">AI Explanation /20</th>
            <th class="score-header">Q&A /15</th>
            <th class="score-header">Delivery /15</th>
            <th class="score-header">Raw Total /50</th>
          </tr></thead>
          <tbody>${presData.map((t,i)=>`
            <tr style="animation:fadeIn ${300+i*80}ms var(--ease-out) both">
              <td style="font-weight:600;font-family:var(--font-display);text-transform:uppercase">Team ${t.team} — ${t.name}</td>
              <td class="score-cell"><input class="form-input score-input" type="number" min="0" max="20" value="${t.ai_exp}" id="p-${t.team}-ai" onchange="updatePresTotal('${t.team}')" oninput="validateScoreInput(this,20)"></td>
              <td class="score-cell"><input class="form-input score-input" type="number" min="0" max="15" value="${t.qa}" id="p-${t.team}-qa" onchange="updatePresTotal('${t.team}')" oninput="validateScoreInput(this,15)"></td>
              <td class="score-cell"><input class="form-input score-input" type="number" min="0" max="15" value="${t.delivery}" id="p-${t.team}-del" onchange="updatePresTotal('${t.team}')" oninput="validateScoreInput(this,15)"></td>
              <td class="score-cell"><span id="pres-total-${t.team}" style="font-family:var(--font-score);font-size:var(--text-2xl);font-weight:700">${t.ai_exp+t.qa+t.delivery}</span><span style="color:var(--color-text-secondary)">/50</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Results after submit -->
    <div class="card section" id="pres-results" style="display:none">
      <div class="card-header"><span class="card-title">🏆 Phase 3 Results</span></div>
      <div id="pres-results-body"></div>
    </div>

    <div class="formula-card section">
      <div class="formula-title">Phase 3 Formula</div>
      <div class="formula-text">Raw Score × Multiplier ÷ 150 × 20 = Final Score<br>
      Example (Rank 1 — Top Team): 45 × 3 ÷ 150 × 20 = <strong>18.00</strong></div>
    </div>
  `;
});
function updatePresTotal(team) {
  const ai=+document.getElementById(`p-${team}-ai`)?.value||0;
  const qa=+document.getElementById(`p-${team}-qa`)?.value||0;
  const del=+document.getElementById(`p-${team}-del`)?.value||0;
  const t=ai+qa+del;
  const el=document.getElementById('pres-total-'+team);
  if(el){el.textContent=t;el.style.cssText=`font-family:var(--font-score);font-size:var(--text-2xl);font-weight:700;${t===50?'color:var(--color-status-success)':t<25?'color:var(--color-status-error)':''}`;}
}
async function submitPresScores() {
  Modal.confirm('Submit Phase 3 presentation scores for all 5 teams?', async () => {
    const payload = presData.map(t=>({
      team_id:t.team,
      ai_explanation_score:+document.getElementById(`p-${t.team}-ai`)?.value||0,
      qa_score:+document.getElementById(`p-${t.team}-qa`)?.value||0,
      delivery_score:+document.getElementById(`p-${t.team}-del`)?.value||0,
    }));
    try {
      await ScoringService.calculatePresentation(payload);
      Toast.success('Presentation scores submitted and ranked!');
      showPresResults(payload);
    } catch(e) { Toast.error(e.message||'Submission failed'); }
  }, 'Submit Phase 3 Presentation Scores');
}
function showPresResults(payload) {
  const ranked = payload.map(p=>{
    const raw = p.ai_explanation_score+p.qa_score+p.delivery_score;
    return {...p, raw};
  }).sort((a,b)=>b.raw-a.raw).map((p,i)=>{
    const rank=i+1;
    const mult=rank===1?3:rank===payload.length?1:2;
    const grade=rank===1?'A':rank===payload.length?'C':'B';
    const final=((p.raw*mult)/150)*20;
    return {...p,rank,mult,grade,final};
  });
  const el = document.getElementById('pres-results');
  el.style.display='block';
  el.style.animation='slideUp 400ms var(--ease-out)';
  document.getElementById('pres-results-body').innerHTML = `
    <table style="width:100%"><thead><tr>
      <th>Rank</th><th>Team</th>
      <th class="score-header">Raw /50</th>
      <th>Grade</th>
      <th class="score-header">Multiplier</th>
      <th class="score-header">Final /20</th>
    </tr></thead>
    <tbody>${ranked.map((r, i)=>`<tr class="rank-${r.rank<=3?r.rank:'n'}" style="animation:fadeIn ${400+i*80}ms var(--ease-out) both">
      <td>${Utils.rankBadge(r.rank)}</td>
      <td style="font-weight:600;font-family:var(--font-display);text-transform:uppercase">${(() => { const pt = presData.find(p => p.team === r.team_id); return pt ? `Team ${pt.team} — ${pt.name}` : r.team_id; })()}</td>
      <td class="score-cell">${r.raw}/50</td>
      <td>${Utils.gradeBadge(r.grade)}</td>
      <td class="score-cell">${r.mult}×</td>
      <td class="score-cell" style="font-weight:800;font-size:var(--text-lg);font-family:var(--font-score)">${r.final.toFixed(2)}</td>
    </tr>`).join('')}</tbody></table>
    <div style="margin-top:var(--space-lg)">
      <button class="btn btn-primary" onclick="Router.navigate('leaderboard')">→ Calculate Final Leaderboard</button>
    </div>`;
}
