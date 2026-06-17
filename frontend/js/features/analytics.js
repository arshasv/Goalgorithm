

Router.register('analytics', () => {
  const el = document.getElementById('page-content');
  el.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">📈 Analytics</h1>
        <p class="page-subtitle">Score progression, dimension profiles and cross-team comparison</p>
      </div>
      <div class="page-header-actions">
            <select class="form-select" style="width:200px">
            <option>All Teams</option><option>Team A</option><option>Team B</option><option>Team C</option><option>Team D</option><option>Team E</option>
          </select>
      </div>
    </div>

    <!-- Insight Stats -->
    <div class="grid-4 section">
      <div class="stat-card fade-in-up"><div class="card-icon">🏅</div><div class="stat-value score-digit" style="color:var(--color-status-success)">75</div><div class="stat-label">Best Match Score (Grade A)</div></div>
      <div class="stat-card fade-in-up" style="animation-delay:80ms"><div class="card-icon">📉</div><div class="stat-value score-digit" style="color:var(--color-status-error)">0</div><div class="stat-label">Worst Match Score (Grade C)</div></div>
      <div class="stat-card fade-in-up" style="animation-delay:160ms"><div class="card-icon">💡</div><div class="stat-value score-digit">8.2</div><div class="stat-label">Strongest Dim: Scoreline avg</div></div>
      <div class="stat-card fade-in-up" style="animation-delay:240ms"><div class="card-icon">⚠️</div><div class="stat-value score-digit" style="color:var(--color-status-warning)">0.8</div><div class="stat-label">Weakest Dim: Probability avg</div></div>
    </div>

    <!-- Charts row -->
    <div style="display:grid;grid-template-columns:2fr 1fr;gap:var(--space-lg)" class="section">
      <div class="card">
        <div class="card-header"><span class="card-title">📊 Score Progression</span></div>
        <div id="line-chart" style="padding:var(--space-md)"></div>
      </div>
      <div class="card">
        <div class="card-header"><span class="card-title">🎯 Phase Contribution</span></div>
        <div id="donut-chart" style="padding:var(--space-md);display:flex;flex-direction:column;gap:var(--space-sm)"></div>
      </div>
    </div>

    <!-- Dimension Radar -->
    <div class="card section">
      <div class="card-header"><span class="card-title">🕸 Dimension Profile — (Top Team Example)</span></div>
      <div id="radar-chart" style="padding:var(--space-md)"></div>
    </div>

    <!-- Per-match comparison -->
    <div class="card section">
      <div class="card-header">
        <span class="card-title">⚔️ Per-Match Comparison — Match #32</span>
        <select class="form-select" style="width:220px"><option>Match #32</option><option>Match #31</option></select>
      </div>
      <div id="match-bars" style="padding:var(--space-md)"></div>
    </div>
  `;

  // Line chart (SVG sparkline)
  const matches=[1,2,3,4,5,6,7,8];
  const earned=[0,34,34,75,75,109,109,109];
  const maxE=Math.max(...earned);
  const W=500,H=180,pad=40;
  const px=i=>pad+(i/(matches.length-1))*(W-2*pad);
  const py=v=>H-pad-(v/maxE)*(H-2*pad);
  const pts=earned.map((v,i)=>`${px(i)},${py(v)}`).join(' ');
  document.getElementById('line-chart').innerHTML=`<svg viewBox="0 0 ${W} ${H}" style="width:100%;height:200px">
    <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="var(--color-chart-1)" stop-opacity=".3"/><stop offset="100%" stop-color="var(--color-chart-1)" stop-opacity="0"/></linearGradient></defs>
    ${[0,maxE/2,maxE].map(v=>`<line x1="${pad}" y1="${py(v)}" x2="${W-pad}" y2="${py(v)}" stroke="var(--color-border)" stroke-dasharray="4"/><text x="${pad-4}" y="${py(v)+4}" text-anchor="end" fill="var(--color-text-muted)" font-size="11">${v}</text>`).join('')}
    <polyline points="${pts}" fill="none" stroke="var(--color-chart-1)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
    ${earned.map((v,i)=>`<circle cx="${px(i)}" cy="${py(v)}" r="4" fill="var(--color-chart-1)"><animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite"/></circle>`).join('')}
    ${matches.map((_,i)=>`<text x="${px(i)}" y="${H-8}" text-anchor="middle" fill="var(--color-text-muted)" font-size="11">M${i+1}</text>`).join('')}
  </svg>`;

  // Donut (segmented bar + legend)
  const phases=[{label:'AI Accuracy (Phase 1)',val:60,color:'var(--color-chart-1)'},
    {label:'Technical (Phase 2)',val:19,color:'var(--color-chart-2)'},
    {label:'Presentation (Phase 3)',val:19.2,color:'var(--color-chart-3)'}];
  const total=phases.reduce((a,b)=>a+b.val,0);
  document.getElementById('donut-chart').innerHTML=`
    <div style="text-align:center;font-family:var(--font-score);font-size:var(--text-5xl);font-weight:700;margin:var(--space-lg) 0;letter-spacing:0.02em">98.2<span style="color:var(--color-text-muted);font-size:var(--text-xl)">/100</span></div>
    <div class="phase-bar" style="height:20px">${phases.map(p=>`<div class="phase-bar-seg" style="width:${(p.val/total)*100}%;background:${p.color}"></div>`).join('')}</div>
    ${phases.map(p=>`<div style="display:flex;align-items:center;gap:var(--space-sm);font-size:var(--text-sm)"><span style="width:12px;height:12px;border-radius:2px;background:${p.color};display:inline-block;flex-shrink:0"></span>${p.label}: <strong style="font-family:var(--font-data)">${p.val}</strong></div>`).join('')}`;

  // Radar as bars
  const dims=[{label:'Winner',avg:5,max:5},{label:'Scoreline',avg:8.2,max:10},{label:'Probability',avg:0.8,max:5},{label:'Player',avg:3.2,max:5}];
  document.getElementById('radar-chart').innerHTML=dims.map((d,i)=>`
    <div class="dimension-row" style="animation:fadeInUp ${400+i*80}ms var(--ease-out) both">
      <span class="dimension-label" style="width:120px">${d.label}</span>
      <div class="dimension-bar-wrap"><div class="dimension-bar-fill" style="width:${(d.avg/d.max)*100}%"></div></div>
      <span class="dimension-score" style="font-weight:800">${d.avg}/${d.max}</span>
    </div>`).join('');

  // Per-match bars
  const perMatch=[{code:'A',name:'Team A',base:25,grade:'A'},{code:'B',name:'Team B',base:17,grade:'B'},{code:'C',name:'Team C',base:15,grade:'B'},{code:'D',name:'Team D',base:7,grade:'B'},{code:'E',name:'Team E',base:0,grade:'C'}];
  document.getElementById('match-bars').innerHTML=perMatch.map((t,i)=>`
    <div style="display:flex;align-items:center;gap:var(--space-md);margin-bottom:var(--space-sm);animation:fadeInUp ${500+i*80}ms var(--ease-out) both">
      <span style="width:120px;font-size:var(--text-sm);text-align:right;font-weight:600;font-family:var(--font-display);text-transform:uppercase">${Utils.formatTeamDisplay({team_id: t.code, name: t.name})}</span>
      <div style="flex:1"><div class="progress-bar" style="height:20px"><div class="progress-fill" style="width:${(t.base/25)*100}%;background:${i===0?'var(--color-chart-1)':'var(--color-chart-2)'}"></div></div></div>
      <span style="font-family:var(--font-data);font-weight:700;width:40px">${t.base}/25</span>
      ${Utils.gradeBadge(t.grade)}
    </div>`).join('');
});
