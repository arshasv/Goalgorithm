import React, { useState, useEffect } from 'react';
import { AnalyticsService } from '../../api/analyticsService';
import { getModelAnalytics } from '../../api/modelEvaluationService';
import { fmt1 } from '../../utils/helpers';
import { useAuth } from '../../contexts/AuthContext';

const ANALYTICS_COLORS = {
  primaryGold: '#B8860B',
  softGold: '#C9A227',
  darkGold: '#8B6F1D',
  blue: '#2563EB',
  darkBlue: '#0F172A',
  lightBlue: '#38BDF8',
  white: '#FFFFFF',
  gray: '#94A3B8'
};

const useTheme = () => {
  const [isDark, setIsDark] = useState(document.documentElement.getAttribute('data-theme') !== 'light');
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.getAttribute('data-theme') !== 'light');
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    return () => observer.disconnect();
  }, []);
  return isDark;
};

const SVG_BAR = ({ data, labelKey, valKey, maxVal, height = 240, barColor, bottomPad = 45, labelFontSize = 9 }) => {
  const isDark = useTheme();
  const themeColors = {
    grid: 'var(--color-border, rgba(148, 163, 184, 0.2))',
    text: 'var(--color-text-primary, #FFFFFF)',
    textMuted: 'var(--color-text-muted, #94A3B8)'
  };

  if (!data || data.length === 0) return null;
  const pad = 35, rightPad = 10, topPad = 15;
  const w = 600;
  const mx = maxVal || Math.max(...data.map(d => d[valKey] || 0), 1);
  const barW = Math.max(15, Math.min(30, (w - pad - rightPad - (data.length * 4)) / data.length));
  const totalW = pad + data.length * (barW + 4);

  return (
    <svg viewBox={`0 0 ${Math.max(totalW + rightPad, w)} ${height}`} style={{ width: '100%', height: '100%', maxHeight: '260px', overflow: 'visible' }}>
      <defs>
        <linearGradient id="barGradientGold" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ANALYTICS_COLORS.primaryGold} />
          <stop offset="100%" stopColor={ANALYTICS_COLORS.primaryGold} stopOpacity="0.6" />
        </linearGradient>
        <linearGradient id="barGradientBlue" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ANALYTICS_COLORS.lightBlue} />
          <stop offset="100%" stopColor={ANALYTICS_COLORS.blue} stopOpacity="0.6" />
        </linearGradient>
        <filter id="glowGold" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={ANALYTICS_COLORS.darkGold} floodOpacity="0.3" />
        </filter>
        <filter id="glowBlue" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor={ANALYTICS_COLORS.blue} floodOpacity="0.3" />
        </filter>
      </defs>
      {[0, 0.25, 0.5, 0.75, 1].map(f => {
        const y = topPad + (1 - f) * (height - topPad - bottomPad);
        return (
          <g key={f}>
            <line x1={pad} y1={y} x2={Math.max(totalW + rightPad, w) - rightPad} y2={y} stroke={themeColors.grid} strokeDasharray="4 4" />
            <line x1={pad - 4} y1={y} x2={pad} y2={y} stroke={themeColors.textMuted} strokeWidth="1" />
            <text x={pad - 8} y={y + 4} textAnchor="end" fill={themeColors.textMuted} fontSize="10" fontFamily="var(--font-data)">{Math.round(f * mx)}</text>
          </g>
        );
      })}
      {/* Axes Lines */}
      <line x1={pad} y1={topPad} x2={pad} y2={height - bottomPad} stroke={themeColors.textMuted} strokeWidth="1" />
      <line x1={pad} y1={height - bottomPad} x2={Math.max(totalW + rightPad, w) - rightPad} y2={height - bottomPad} stroke={themeColors.textMuted} strokeWidth="1" />
      {data.map((d, i) => {
        const x = pad + i * (barW + 4);
        const val = d[valKey] || 0;
        const barH = (val / mx) * (height - topPad - bottomPad);
        const y = height - bottomPad - barH;
        
        const isGold = barColor === ANALYTICS_COLORS.primaryGold || i === 0; // Rank 1 is Gold
        const fillStyle = barColor ? barColor : (isGold ? "url(#barGradientGold)" : "url(#barGradientBlue)");
        const glowFilter = barColor ? "none" : (isGold ? "url(#glowGold)" : "url(#glowBlue)");
        
        return (
          <g key={i}>
            <rect x={x} y={y} width={barW} height={barH} fill={fillStyle} rx="4" filter={glowFilter}>
              <animate attributeName="height" from="0" to={barH} dur="0.8s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
              <animate attributeName="y" from={height - bottomPad} to={y} dur="0.8s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
            </rect>
            <line x1={x + barW / 2} y1={height - bottomPad} x2={x + barW / 2} y2={height - bottomPad + 4} stroke={themeColors.textMuted} strokeWidth="1" />
            <text x={x + barW / 2} y={height - bottomPad + 14} textAnchor="end" fill={themeColors.text} fontSize={labelFontSize} fontWeight="500" transform={`rotate(-45, ${x + barW / 2}, ${height - bottomPad + 14})`}>
              {String(d[labelKey]).length > 15 ? String(d[labelKey]).slice(0, 13) + '…' : d[labelKey]}
              <title>{d[labelKey]}</title>
            </text>
          </g>
        );
      })}
    </svg>
  );
};

const SVG_LINE = ({ points, labels, tooltips, height = 240, maxVal, yLabel }) => {
  const isDark = useTheme();
  const themeColors = {
    grid: 'var(--color-border, rgba(148, 163, 184, 0.2))',
    text: 'var(--color-text-primary, #FFFFFF)',
    textMuted: 'var(--color-text-muted, #94A3B8)'
  };

  if (!points || points.length === 0) return null;
  const pad = 40, rightPad = 20, topPad = 15, bottomPad = 45;
  const w = 600;
  const mx = maxVal || Math.max(...points, 1);
  const xStep = (w - pad - rightPad) / Math.max(points.length - 1, 1);

  const px = (i) => pad + i * xStep;
  const py = (v) => topPad + (1 - v / mx) * (height - topPad - bottomPad);

  const areaPoints = [
    `${px(0)},${height - bottomPad}`, 
    ...points.map((v, i) => `${px(i)},${py(v)}`), 
    `${px(points.length - 1)},${height - bottomPad}`
  ].join(' ');

  const linePoints = points.map((v, i) => `${px(i)},${py(v)}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${height}`} style={{ width: '100%', height: '100%', maxHeight: '260px', overflow: 'visible' }}>
      <defs>
        <linearGradient id="areaGradientLine" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={ANALYTICS_COLORS.primaryGold} stopOpacity="0.3" />
          <stop offset="100%" stopColor={ANALYTICS_COLORS.primaryGold} stopOpacity="0" />
        </linearGradient>
        <filter id="lineGlowGold" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor={ANALYTICS_COLORS.darkGold} floodOpacity="0.4" />
        </filter>
      </defs>
      {[0, 0.2, 0.4, 0.6, 0.8, 1].map(f => {
        const y = topPad + (1 - f) * (height - topPad - bottomPad);
        return (
          <g key={f}>
            <line x1={pad} y1={y} x2={w - rightPad} y2={y} stroke={themeColors.grid} strokeDasharray="4 4" />
            <line x1={pad - 4} y1={y} x2={pad} y2={y} stroke={themeColors.textMuted} strokeWidth="1" />
            <text x={pad - 8} y={y + 4} textAnchor="end" fill={themeColors.textMuted} fontSize="10" fontFamily="var(--font-data)">{Math.round(f * mx)}</text>
          </g>
        );
      })}
      
      {/* Axes Lines */}
      <line x1={pad} y1={topPad} x2={pad} y2={height - bottomPad} stroke={themeColors.textMuted} strokeWidth="1" />
      <line x1={pad} y1={height - bottomPad} x2={w - rightPad} y2={height - bottomPad} stroke={themeColors.textMuted} strokeWidth="1" />
      
      {yLabel && (
        <text x={10} y={height / 2} transform={`rotate(-90 10,${height/2})`} textAnchor="middle" fill={themeColors.textMuted} fontSize="10" fontWeight="500">
          {yLabel}
        </text>
      )}

      <polygon points={areaPoints} fill="url(#areaGradientLine)">
        <animate attributeName="opacity" from="0" to="1" dur="1s" fill="freeze" />
      </polygon>
      
      <polyline
        points={linePoints}
        fill="none" stroke={ANALYTICS_COLORS.primaryGold} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        filter="url(#lineGlowGold)"
      >
        <animate attributeName="stroke-dasharray" values="2000;2000" dur="1.5s" fill="freeze" />
        <animate attributeName="stroke-dashoffset" from="2000" to="0" dur="1.5s" fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1" />
      </polyline>
      
      {points.map((v, i) => (
        <circle key={i} cx={px(i)} cy={py(v)} r="5" fill={isDark ? ANALYTICS_COLORS.darkBlue : ANALYTICS_COLORS.white} stroke={ANALYTICS_COLORS.primaryGold} strokeWidth="2" filter="url(#lineGlowGold)">
          <animate attributeName="r" values="0;7;4" dur="0.8s" begin={`${i * 0.1}s`} fill="freeze" calcMode="spline" keySplines="0.4 0 0.2 1" keyTimes="0;1;1" />
          {tooltips && tooltips[i] && <title>{tooltips[i]}</title>}
        </circle>
      ))}
      
      {labels && labels.map((label, i) => (
        <g key={`l-${i}`}>
          <line x1={px(i)} y1={height - bottomPad} x2={px(i)} y2={height - bottomPad + 4} stroke={themeColors.textMuted} strokeWidth="1" />
          <text x={px(i)} y={height - bottomPad + 14} textAnchor="end" fill={themeColors.text} fontSize="9" fontWeight="500"
            transform={`rotate(-45, ${px(i)}, ${height - bottomPad + 14})`}
          >
            {String(label).length > 15 ? String(label).slice(0, 13) + '…' : label}
            <title>{label}</title>
          </text>
        </g>
      ))}
    </svg>
  );
};

const COMPETITION_OVERVIEW_CARDS = ({ overview }) => {
  const cards = [
    { icon: '👥', label: 'Total Teams', value: String(overview.total_teams), color: ANALYTICS_COLORS.lightBlue },
    { icon: '🏆', label: 'Current Leader', value: overview.top_team?.team_name || '—', color: ANALYTICS_COLORS.softGold, small: true },
    { icon: '⭐', label: 'Highest Score', value: fmt1(overview.top_score) || '—', color: ANALYTICS_COLORS.blue, small: true },
    { icon: '🎤', label: 'Highest Presentation', value: overview.average_scores?.presentation_average != null ? fmt1(overview.average_scores.presentation_average) : '—', color: ANALYTICS_COLORS.gray },
  ];

  return (
    <div className="grid-4 section">
      {cards.map((c, i) => (
        <div key={c.label} className="stat-card fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
          <div className="card-icon">{c.icon}</div>
          {c.small ? (
            <div className="stat-value" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', marginTop: '8px', color: c.color }}>
              {c.value}
            </div>
          ) : (
            <div className="stat-value score-digit" style={{ color: c.color }}>{c.value}</div>
          )}
          <div className="stat-label">{c.label}</div>
        </div>
      ))}
    </div>
  );
};
const MODEL_PERFORMANCE = ({ modelEvalData, selectedTeamName }) => {
  if (!modelEvalData) return null;
  
  if (!modelEvalData.team_rankings || modelEvalData.team_rankings.length === 0) {
    return (
      <div className="empty-state" style={{ minHeight: 120 }}>
        <p className="empty-desc">No model evaluations completed yet</p>
      </div>
    );
  }

  if (selectedTeamName === 'ALL') {
    const scoreData = modelEvalData.team_rankings
      .filter(m => m.final_ai_score != null)
      .map(m => ({ team: m.team_name, score: m.final_ai_score }))
      .sort((a, b) => b.score - a.score);

    const accData = modelEvalData.accuracy_comparison
      .filter(m => m.overall_accuracy != null)
      .map(m => ({ team: m.team_name, accuracy: m.overall_accuracy }))
      .sort((a, b) => b.accuracy - a.accuracy);

    return (
      <div className="grid-2 section">
        <div className="card">
          <div className="card-header"><span className="card-title">🏆 Model Ranking</span></div>
          <div style={{ padding: 'var(--space-md)', overflowX: 'auto' }}>
            {scoreData.length > 0 ? (
              <SVG_BAR data={scoreData} labelKey="team" valKey="score" maxVal={Math.max(...scoreData.map(s => s.score), 10)} barColor={ANALYTICS_COLORS.primaryGold} />
            ) : (
              <div className="empty-state" style={{ minHeight: 120 }}><p className="empty-desc">No model evaluations completed yet</p></div>
            )}
          </div>
        </div>
        
        <div className="card">
          <div className="card-header"><span className="card-title">🎯 Accuracy Comparison</span></div>
          <div style={{ padding: 'var(--space-md)', overflowX: 'auto' }}>
            {accData.length > 0 ? (
              <SVG_BAR data={accData} labelKey="team" valKey="accuracy" maxVal={100} barColor={ANALYTICS_COLORS.blue} />
            ) : (
              <div className="empty-state" style={{ minHeight: 120 }}><p className="empty-desc">No model evaluations completed yet</p></div>
            )}
          </div>
        </div>
      </div>
    );
  }

  const teamData = modelEvalData.team_rankings.find(m => m.team_name === selectedTeamName);
  if (!teamData) {
    return (
      <div className="empty-state section" style={{ minHeight: 120 }}>
        <p className="empty-desc">No model evaluations completed yet</p>
      </div>
    );
  }

  const versionHistoryData = modelEvalData.version_history.find(v => v.team_name === selectedTeamName)?.history || [];
  
  const vPoints = versionHistoryData.map(v => v.accuracy || 0);
  const vLabels = versionHistoryData.map(v => `v${v.version}`);
  const vTooltips = versionHistoryData.map(v => `Version ${v.version}: ${v.accuracy}%`);

  const categoryData = [
    { label: 'Winner', value: teamData.winner_prediction_accuracy || 0 },
    { label: 'Scoreline', value: teamData.scoreline_accuracy || 0 },
    { label: 'Probability', value: teamData.probability_accuracy || 0 },
    { label: 'Player', value: teamData.player_prediction_accuracy || 0 },
  ];

  return (
    <div className="grid-2 section">
      <div className="card">
        <div className="card-header"><span className="card-title">📈 Version Improvement</span></div>
        <div style={{ padding: 'var(--space-md)', overflowX: 'auto' }}>
          {versionHistoryData.length === 0 ? (
            <div className="empty-state" style={{ minHeight: 120 }}>
              <p className="empty-desc">No version history available.</p>
            </div>
          ) : (
            <SVG_LINE points={vPoints} labels={vLabels} tooltips={vTooltips} maxVal={100} yLabel="Accuracy %" />
          )}
        </div>
      </div>
      
      <div className="card">
        <div className="card-header"><span className="card-title">💪 Category Breakdown</span></div>
        <div style={{ padding: 'var(--space-md)', overflowX: 'auto' }}>
          <SVG_BAR data={categoryData} labelKey="label" valKey="value" maxVal={100} barColor={ANALYTICS_COLORS.lightBlue} />
        </div>
      </div>
    </div>
  );
};

const CRITERIA_BARS = ({ criteriaRankings }) => {
  if (!criteriaRankings || criteriaRankings.length === 0) return null;

  return criteriaRankings.map(cr => (
    <div key={cr.criterion} style={{ marginBottom: 'var(--space-lg)' }}>
      <h4 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-base)', marginBottom: 'var(--space-sm)', color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {cr.criterion}
      </h4>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
        {cr.rankings.map((r, i) => {
          const pct = r.max_score > 0 ? (r.avg_score / r.max_score) * 100 : 0;
          return (
            <div key={r.team} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <span style={{ width: 120, fontSize: 'var(--text-sm)', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase', color: i === 0 ? ANALYTICS_COLORS.softGold : 'var(--color-text-primary)' }}>
                {r.team}
              </span>
              <div style={{ flex: 1, height: 22, background: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-small)', overflow: 'hidden' }}>
                <div style={{ width: `${pct}%`, height: '100%', background: i === 0 ? `linear-gradient(90deg, ${ANALYTICS_COLORS.primaryGold}, ${ANALYTICS_COLORS.darkGold})` : `linear-gradient(90deg, ${ANALYTICS_COLORS.lightBlue}, ${ANALYTICS_COLORS.blue})`, borderRadius: 'var(--radius-small)', transition: 'width 0.6s ease' }} />
              </div>
              <span style={{ fontFamily: 'var(--font-data)', fontWeight: 700, width: 60, fontSize: 'var(--text-sm)' }}>
                {r.avg_score}/{r.max_score}
              </span>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 'var(--space-lg)', marginTop: 'var(--space-xs)', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
        <span>🏆 Best: <strong style={{ color: ANALYTICS_COLORS.softGold }}>{cr.best_team}</strong></span>
        <span>⚠️ Needs Improvement: <strong style={{ color: ANALYTICS_COLORS.gray }}>{cr.weakest_team}</strong></span>
      </div>
    </div>
  ));
};

const STRENGTH_WEAKNESS_CARDS = ({ teams }) => {
  if (!teams || teams.length === 0) return null;

  return (
    <div className="grid-4 section">
      {teams.map((t, i) => (
        <div key={t.team} className="card fade-in-up" style={{ animationDelay: `${i * 80}ms`, padding: 'var(--space-md)' }}>
          <div className="card-header" style={{ padding: 0, marginBottom: 'var(--space-md)' }}>
            <span className="card-title" style={{ fontSize: 'var(--text-lg)' }}>{t.team}</span>
          </div>
          {t.strongest && (
            <div style={{ marginBottom: 'var(--space-sm)' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Strongest</div>
              <div style={{ fontFamily: 'var(--font-display)', color: ANALYTICS_COLORS.softGold, fontSize: 'var(--text-base)' }}>
                {t.strongest.criterion}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-data)', color: 'var(--color-text-secondary)' }}>
                {fmt1(t.strongest.score)}/{t.strongest.max_score} ({t.strongest.pct}%)
              </div>
            </div>
          )}
          {t.weakest && (
            <div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>Needs Improvement</div>
              <div style={{ fontFamily: 'var(--font-display)', color: ANALYTICS_COLORS.gray, fontSize: 'var(--text-base)' }}>
                {t.weakest.criterion}
              </div>
              <div style={{ fontSize: 'var(--text-sm)', fontFamily: 'var(--font-data)', color: 'var(--color-text-secondary)' }}>
                {fmt1(t.weakest.score)}/{t.weakest.max_score} ({t.weakest.pct}%)
              </div>
            </div>
          )}
          {!t.strongest && !t.weakest && (
            <div className="empty-state" style={{ minHeight: 60 }}>
              <p className="empty-desc">No evaluation data yet.</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const JUDGE_ANALYTICS = ({ judgeData }) => {
  if (!judgeData || !judgeData.summaries || judgeData.summaries.length === 0) {
    return (
      <div className="empty-state" style={{ minHeight: 120 }}>
        <p className="empty-desc">No judge analytics available yet</p>
      </div>
    );
  }

  const { summaries, criteria_patterns } = judgeData;
  const strictest = [...summaries].sort((a, b) => a.average_score_given - b.average_score_given)[0];
  const generous = [...summaries].sort((a, b) => b.average_score_given - a.average_score_given)[0];
  const consistent = [...summaries].sort((a, b) => a.variance - b.variance)[0];

  const cards = [
    { icon: '⚖️', label: 'Strictest Judge', value: strictest?.judge_name || '—', color: ANALYTICS_COLORS.gray, sub: `Avg: ${fmt1(strictest?.average_score_given)} /50` },
    { icon: '🎁', label: 'Generous Evaluator', value: generous?.judge_name || '—', color: ANALYTICS_COLORS.softGold, sub: `Avg: ${fmt1(generous?.average_score_given)} /50` },
    { icon: '🎯', label: 'Most Consistent', value: consistent?.judge_name || '—', color: ANALYTICS_COLORS.blue, sub: `Variance: ${fmt1(consistent?.variance)}` },
  ];

  const avgData = summaries.map(s => ({ judge: s.judge_name, score: s.average_score_given }));
  const varData = summaries.map(s => ({ judge: s.judge_name, variance: s.variance }));

  return (
    <>
      <div className="grid-3 section">
        {cards.map((c, i) => (
          <div key={c.label} className="stat-card fade-in-up" style={{ animationDelay: `${i * 80}ms` }}>
            <div className="card-icon">{c.icon}</div>
            <div className="stat-value" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', marginTop: '8px', color: c.color }}>
              {c.value}
            </div>
            <div className="stat-label">{c.label}</div>
            {c.sub && <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px' }}>{c.sub}</div>}
          </div>
        ))}
      </div>

      <div className="grid-2 section">
        <div className="card">
          <div className="card-header"><span className="card-title">⚖️ Average Score Given</span></div>
          <div style={{ padding: 'var(--space-md)', overflowX: 'auto' }}>
            <SVG_BAR data={avgData} labelKey="judge" valKey="score" maxVal={50} barColor={ANALYTICS_COLORS.primaryGold} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">🎯 Scoring Consistency (Variance)</span></div>
          <div style={{ padding: 'var(--space-md)', overflowX: 'auto' }}>
            <SVG_BAR data={varData} labelKey="judge" valKey="variance" barColor={ANALYTICS_COLORS.blue} />
          </div>
        </div>
      </div>

      <div className="card section">
        <div className="card-header" style={{ padding: '16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <span className="card-title" style={{ margin: 0 }}>🧩 Judge Criteria Patterns</span>
          <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: '1.4', fontWeight: 'normal' }}>
            Highlights scoring patterns across judging criteria to compare team strengths and weaknesses.
          </p>
        </div>
        <div className="grid-2" style={{ padding: 'var(--space-md)', gap: 'var(--space-xl)' }}>
          {criteria_patterns.map((cp, i) => {
            const highestVal = cp.criteria_averages.find(c => c.criterion === cp.strongest_scoring_category)?.average_score;
            const lowestVal = cp.criteria_averages.find(c => c.criterion === cp.lowest_scoring_category)?.average_score;
            return (
              <div key={cp.judge_id} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                <h4 style={{ fontFamily: 'var(--font-display)', color: ANALYTICS_COLORS.softGold, margin: 0, letterSpacing: '0.05em', textTransform: 'uppercase' }}>{cp.judge_name}</h4>
                <div style={{ display: 'flex', gap: 'var(--space-md)', fontSize: 'var(--text-xs)', flexWrap: 'wrap' }}>
                  <span style={{ color: ANALYTICS_COLORS.gray }}>Highest: {cp.strongest_scoring_category ? `${cp.strongest_scoring_category} (${fmt1(highestVal)}%)` : 'N/A'}</span>
                  <span style={{ color: ANALYTICS_COLORS.gray }}>Lowest: {cp.lowest_scoring_category ? `${cp.lowest_scoring_category} (${fmt1(lowestVal)}%)` : 'N/A'}</span>
                </div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Average Criteria Score (%)</div>
                <div style={{ marginTop: 'auto' }}>
                  <SVG_BAR data={cp.criteria_averages} labelKey="criterion" valKey="average_score" maxVal={100} barColor={ANALYTICS_COLORS.lightBlue} height={240} bottomPad={85} labelFontSize={10} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};

const AnalyticsView = () => {
  const { isOrganizer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [overview, setOverview] = useState(null);
  const [modelsData, setModelsData] = useState([]);
  const [presentationData, setPresentationData] = useState(null);

  const [teams, setTeams] = useState([]);
  const [selectedTeamName, setSelectedTeamName] = useState('ALL');
  const [judgeData, setJudgeData] = useState(null);
  const [modelEvalData, setModelEvalData] = useState(null);
  const [visibilitySettings, setVisibilitySettings] = useState(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      // Import the service dynamically or directly
      const { LeaderboardSettingsService } = await import('../../api/leaderboardSettingsService');
      const { TeamService } = await import('../../api/teamService');
      
      const [ov, md, pd, jd, settings, allTeams, evalData] = await Promise.all([
        AnalyticsService.getOverview().catch(() => null),
        AnalyticsService.getModels().catch(() => []),
        AnalyticsService.getPresentation().catch(() => null),
        AnalyticsService.getJudges().catch(() => null),
        LeaderboardSettingsService.getSettings().catch(() => null),
        TeamService.listTeams().catch(() => []),
        getModelAnalytics().catch(() => null)
      ]);
      setOverview(ov);
      setModelsData(md || []);
      setPresentationData(pd);
      setJudgeData(jd);
      setVisibilitySettings(settings);
      setTeams(allTeams || []);
      setModelEvalData(evalData);
    } catch (err) {
      setError('Failed to load analytics: ' + (err?.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const hasAnyData = overview?.total_teams > 0 || (modelEvalData?.team_rankings?.length > 0) || (presentationData?.teams?.length || 0) > 0;

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">📈 Analytics</h1>
            <p className="page-subtitle">Model performance, presentation analysis & competition insights</p>
          </div>
        </div>
        <div className="loading-spinner" />
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">📈 Analytics</h1>
            <p className="page-subtitle">Model performance, presentation analysis & competition insights</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary" onClick={loadData}>🔄 Retry</button>
          </div>
        </div>
        <div className="alert alert-error">{error}</div>
      </div>
    );
  }

  if (!hasAnyData) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">📈 Analytics</h1>
            <p className="page-subtitle">Model performance, presentation analysis & competition insights</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary" onClick={loadData}>🔄 Refresh</button>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2 className="empty-title">No analytics available yet</h2>
          <p className="empty-desc">Analytics will appear once teams submit models and competition scoring begins.</p>
        </div>
      </div>
    );
  }

  const showOverall = isOrganizer || visibilitySettings?.show_overall_comparison || visibilitySettings?.show_leaderboard_analytics;
  const showModel = isOrganizer || visibilitySettings?.show_model_analytics;
  const showPrediction = isOrganizer || visibilitySettings?.show_prediction_analytics;
  const showPresentation = isOrganizer || visibilitySettings?.show_presentation_analytics;
  const showJudge = isOrganizer || visibilitySettings?.show_judge_analytics;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">📈 Analytics</h1>
          <p className="page-subtitle">Model performance, presentation analysis & competition insights</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={loadData}>🔄 Refresh</button>
        </div>
      </div>

      <div className="card section" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', padding: 'var(--space-md)' }}>
        <label style={{ fontWeight: 600, color: 'var(--color-text-secondary)', margin: 0 }}>Team Filter:</label>
        <select 
          className="form-control" 
          style={{ maxWidth: 300, margin: 0 }}
          value={selectedTeamName}
          onChange={e => setSelectedTeamName(e.target.value)}
        >
          <option value="ALL">All Teams</option>
          {teams.map(t => (
            <option key={t.id} value={t.name}>{t.team_id ? `${t.team_id} - ` : ''}{t.name}</option>
          ))}
        </select>
      </div>

      {overview && showOverall && <COMPETITION_OVERVIEW_CARDS overview={overview} />}

      {(showModel || showPrediction) && modelEvalData && (
        <div className="section">
          <h2 className="section-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            🤖 Model Performance
          </h2>
          <MODEL_PERFORMANCE modelEvalData={modelEvalData} selectedTeamName={selectedTeamName} />
        </div>
      )}

      {showPresentation && presentationData && presentationData.teams && presentationData.teams.length > 0 && (
        <div className="section">
          <h2 className="section-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            🎤 Presentation Analysis
          </h2>

          <div className="card section">
            <div className="card-header">
              <span className="card-title">📊 Criteria Comparison</span>
            </div>
            <div style={{ padding: 'var(--space-md)' }}>
              <CRITERIA_BARS criteriaRankings={presentationData.criteria_rankings} />
            </div>
          </div>

          <div className="card section">
            <div className="card-header">
              <span className="card-title">💪 Strength / Weakness Analysis</span>
            </div>
            <div style={{ padding: 'var(--space-md)' }}>
              <STRENGTH_WEAKNESS_CARDS teams={presentationData.teams} />
            </div>
          </div>
        </div>
      )}

      {showJudge && judgeData && (
        <div className="section">
          <h2 className="section-title" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)', marginBottom: 'var(--space-md)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            ⚖️ Judge Analytics
          </h2>
          <JUDGE_ANALYTICS judgeData={judgeData} />
        </div>
      )}

    </div>
  );
};

export default AnalyticsView;
