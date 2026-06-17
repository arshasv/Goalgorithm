import React from 'react';

const formatTeamDisplay = (e) => {
  const code = e.team_code || e.code || '';
  const name = e.team_name || e.name || '';
  return code ? `${code} – ${name}` : name;
};

const gradeBadge = (grade) => {
  const colors = { A: 'badge-success', B: 'badge-info', C: 'badge-warning', D: 'badge-error' };
  return <span className={`badge ${colors[grade] || 'badge-warning'}`}>Grade {grade}</span>;
};

const AnalyticsView = () => {
  const matches = [1, 2, 3, 4, 5, 6, 7, 8];
  const earned = [0, 34, 34, 75, 75, 109, 109, 109];
  const maxE = Math.max(...earned);
  const W = 500, H = 180, pad = 40;
  const px = (i) => pad + (i / (matches.length - 1)) * (W - 2 * pad);
  const py = (v) => H - pad - (v / maxE) * (H - 2 * pad);
  const pts = earned.map((v, i) => `${px(i)},${py(v)}`).join(' ');

  const phases = [
    { label: 'AI Accuracy (Phase 1)', val: 60, color: 'var(--color-chart-1)' },
    { label: 'Technical (Phase 2)', val: 19, color: 'var(--color-chart-2)' },
    { label: 'Presentation (Phase 3)', val: 19.2, color: 'var(--color-chart-3)' },
  ];
  const total = phases.reduce((a, b) => a + b.val, 0);

  const dims = [
    { label: 'Winner', avg: 5, max: 5 },
    { label: 'Scoreline', avg: 8.2, max: 10 },
    { label: 'Probability', avg: 0.8, max: 5 },
    { label: 'Player', avg: 3.2, max: 5 },
  ];

  const perMatch = [
    { code: 'A', name: 'Team A', base: 25, grade: 'A' },
    { code: 'B', name: 'Team B', base: 17, grade: 'B' },
    { code: 'C', name: 'Team C', base: 15, grade: 'B' },
    { code: 'D', name: 'Team D', base: 7, grade: 'B' },
    { code: 'E', name: 'Team E', base: 0, grade: 'C' },
  ];

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">📈 Analytics</h1>
          <p className="page-subtitle">Score progression, dimension profiles and cross-team comparison</p>
        </div>
        <div className="page-header-actions">
          <select className="form-select" style={{ width: '200px' }}>
            <option>All Teams</option>
            <option>Team A</option><option>Team B</option><option>Team C</option><option>Team D</option><option>Team E</option>
          </select>
        </div>
      </div>

      <div className="grid-4 section">
        <div className="stat-card fade-in-up">
          <div className="card-icon">🏅</div>
          <div className="stat-value score-digit" style={{ color: 'var(--color-status-success)' }}>75</div>
          <div className="stat-label">Best Match Score (Grade A)</div>
        </div>
        <div className="stat-card fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="card-icon">📉</div>
          <div className="stat-value score-digit" style={{ color: 'var(--color-status-error)' }}>0</div>
          <div className="stat-label">Worst Match Score (Grade C)</div>
        </div>
        <div className="stat-card fade-in-up" style={{ animationDelay: '160ms' }}>
          <div className="card-icon">💡</div>
          <div className="stat-value score-digit">8.2</div>
          <div className="stat-label">Strongest Dim: Scoreline avg</div>
        </div>
        <div className="stat-card fade-in-up" style={{ animationDelay: '240ms' }}>
          <div className="card-icon">⚠️</div>
          <div className="stat-value score-digit" style={{ color: 'var(--color-status-warning)' }}>0.8</div>
          <div className="stat-label">Weakest Dim: Probability avg</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)' }} className="section">
        <div className="card">
          <div className="card-header"><span className="card-title">📊 Score Progression</span></div>
          <div style={{ padding: 'var(--space-md)' }}>
            <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '200px' }}>
              <defs>
                <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-chart-1)" stopOpacity=".3" />
                  <stop offset="100%" stopColor="var(--color-chart-1)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {[0, maxE / 2, maxE].map(v => (
                <g key={v}>
                  <line x1={pad} y1={py(v)} x2={W - pad} y2={py(v)} stroke="var(--color-border)" strokeDasharray="4" />
                  <text x={pad - 4} y={py(v) + 4} textAnchor="end" fill="var(--color-text-muted)" fontSize="11">{v}</text>
                </g>
              ))}
              <polyline points={pts} fill="none" stroke="var(--color-chart-1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {earned.map((v, i) => (
                <circle key={i} cx={px(i)} cy={py(v)} r="4" fill="var(--color-chart-1)">
                  <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
                </circle>
              ))}
              {matches.map((_, i) => (
                <text key={i} x={px(i)} y={H - 8} textAnchor="middle" fill="var(--color-text-muted)" fontSize="11">M{i + 1}</text>
              ))}
            </svg>
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">🎯 Phase Contribution</span></div>
          <div style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-score)', fontSize: 'var(--text-5xl)', fontWeight: 700, margin: 'var(--space-lg) 0', letterSpacing: '0.02em' }}>
              98.2<span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xl)' }}>/100</span>
            </div>
            <div className="phase-bar" style={{ height: '20px' }}>
              {phases.map(p => (
                <div key={p.label} className="phase-bar-seg" style={{ width: `${(p.val / total) * 100}%`, background: p.color }}></div>
              ))}
            </div>
            {phases.map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--text-sm)' }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: p.color, display: 'inline-block', flexShrink: 0 }}></span>
                {p.label}: <strong style={{ fontFamily: 'var(--font-data)' }}>{p.val}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card section">
        <div className="card-header"><span className="card-title">🕸 Dimension Profile — (Top Team Example)</span></div>
        <div style={{ padding: 'var(--space-md)' }}>
          {dims.map((d, i) => (
            <div key={d.label} className="dimension-row" style={{ animation: `fadeInUp ${400 + i * 80}ms var(--ease-out) both` }}>
              <span className="dimension-label" style={{ width: 120 }}>{d.label}</span>
              <div className="dimension-bar-wrap">
                <div className="dimension-bar-fill" style={{ width: `${(d.avg / d.max) * 100}%` }}></div>
              </div>
              <span className="dimension-score" style={{ fontWeight: 800 }}>{d.avg}/{d.max}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card section">
        <div className="card-header">
          <span className="card-title">⚔️ Per-Match Comparison — Match #32</span>
          <select className="form-select" style={{ width: '220px' }}>
            <option>Match #32</option>
            <option>Match #31</option>
          </select>
        </div>
        <div style={{ padding: 'var(--space-md)' }}>
          {perMatch.map((t, i) => (
            <div key={t.code} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)', animation: `fadeInUp ${500 + i * 80}ms var(--ease-out) both` }}>
              <span style={{ width: 120, fontSize: 'var(--text-sm)', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                {formatTeamDisplay({ team_code: t.code, name: t.name })}
              </span>
              <div style={{ flex: 1 }}>
                <div className="progress-bar" style={{ height: '20px' }}>
                  <div className="progress-fill" style={{ width: `${(t.base / 25) * 100}%`, background: i === 0 ? 'var(--color-chart-1)' : 'var(--color-chart-2)' }}></div>
                </div>
              </div>
              <span style={{ fontFamily: 'var(--font-data)', fontWeight: 700, width: 40 }}>{t.base}/25</span>
              {gradeBadge(t.grade)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AnalyticsView;
