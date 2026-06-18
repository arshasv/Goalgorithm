import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ScoresService } from '../../api/scoresService';
import { LeaderboardService } from '../../api/leaderboardService';
import { TeamService } from '../../api/teamService';

const formatTeamDisplay = (e) => {
  const code = e.team_code || e.code || '';
  const name = e.team_name || e.name || '';
  return code ? `${code} – ${name}` : name;
};

const fmt1 = (val) => (val != null ? Number(val).toFixed(1) : '0.0');

const AnalyticsView = () => {
  const { isOrganizer } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [dailyScores, setDailyScores] = useState([]);
  const [matchBreakdown, setMatchBreakdown] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [daily, matches, lb] = await Promise.all([
        ScoresService.getDailyScores().catch(() => []),
        ScoresService.getMatchBreakdown().catch(() => []),
        LeaderboardService.getLeaderboard().catch(() => []),
      ]);
      setDailyScores(daily);
      setMatchBreakdown(matches);
      setLeaderboard(lb);
    } catch (err) {
      setError('Failed to load analytics: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">📈 Analytics</h1>
            <p className="page-subtitle">Score progression, dimension profiles and cross-team comparison</p>
          </div>
        </div>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }

  const hasData = leaderboard.length > 0 && matchBreakdown.length > 0;

  if (!hasData) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">📈 Analytics</h1>
            <p className="page-subtitle">Score progression, dimension profiles and cross-team comparison</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary" onClick={loadData}>🔄 Refresh</button>
          </div>
        </div>
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2 className="empty-title">Not Enough Data</h2>
          <p className="empty-desc">Analytics will be available once match scoring begins.</p>
        </div>
      </div>
    );
  }

  // Calculate top team
  const topTeam = leaderboard[0];
  const topTeamScores = matchBreakdown.flatMap(m => m.teams.filter(t => t.team_id === topTeam.team_id));
  
  // Averages for top team
  const calcAvg = (key, max) => {
    if (!topTeamScores.length) return { avg: 0, max };
    let sum = 0;
    let count = 0;
    topTeamScores.forEach(t => {
      if (t.score_breakdown && t.score_breakdown[key] != null) {
        sum += t.score_breakdown[key];
        count++;
      }
    });
    return { avg: count > 0 ? (sum / count).toFixed(1) : 0, max };
  };

  const dims = [
    { label: 'Winner', ...calcAvg('winner_points', 5) },
    { label: 'Scoreline', ...calcAvg('scoreline_points', 10) },
    { label: 'Probability', ...calcAvg('probability_points', 5) },
    { label: 'Player', ...calcAvg('player_points', 5) },
  ];

  const phases = [
    { label: 'AI Accuracy (Phase 1)', val: topTeam.phase1_score || 0, color: 'var(--color-chart-1)' },
    { label: 'Technical (Phase 2)', val: topTeam.technical_score || 0, color: 'var(--color-chart-2)' },
    { label: 'Presentation (Phase 3)', val: topTeam.presentation_score || 0, color: 'var(--color-chart-3)' },
  ];
  const totalScore = topTeam.final_score || 0;

  // Latest match comparison
  const scoredMatches = matchBreakdown.filter(m => m.teams && m.teams.length > 0);
  const latestMatch = scoredMatches.length > 0 ? scoredMatches[scoredMatches.length - 1] : null;
  const perMatch = latestMatch ? latestMatch.teams.sort((a,b) => (b.score_breakdown?.base_score||0) - (a.score_breakdown?.base_score||0)).slice(0, 5) : [];

  // Progression chart using backend daily scores
  const earned = [];
  const matchLabels = [];
  const reversedDaily = [...dailyScores].reverse();
  
  reversedDaily.forEach((day, i) => {
    const t = day.teams.find(t => t.team_name === topTeam.team_name || t.team_code === topTeam.team_code);
    // Use the backend calculated total_score directly
    earned.push(t ? t.total_score : (earned.length > 0 ? earned[earned.length - 1] : 0));
    matchLabels.push(`D${i+1}`);
  });
  if (earned.length === 0) earned.push(0);
  
  const maxE = Math.max(...earned, 1);
  const W = 500, H = 180, pad = 40;
  const px = (i) => pad + (i / Math.max(matchLabels.length - 1, 1)) * (W - 2 * pad);
  const py = (v) => H - pad - (v / maxE) * (H - 2 * pad);
  const pts = earned.map((v, i) => `${px(i)},${py(v)}`).join(' ');

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">📈 Analytics</h1>
          <p className="page-subtitle">Score progression, dimension profiles and cross-team comparison</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={loadData}>🔄 Refresh</button>
        </div>
      </div>

      <div className="grid-4 section">
        <div className="stat-card fade-in-up">
          <div className="card-icon">🏅</div>
          <div className="stat-value score-digit" style={{ color: 'var(--color-status-success)' }}>{fmt1(topTeam.final_score)}</div>
          <div className="stat-label">Top Overall Score</div>
        </div>
        <div className="stat-card fade-in-up" style={{ animationDelay: '80ms' }}>
          <div className="card-icon">👥</div>
          <div className="stat-value score-digit" style={{ color: 'var(--color-status-info)' }}>{leaderboard.length}</div>
          <div className="stat-label">Active Teams</div>
        </div>
        <div className="stat-card fade-in-up" style={{ animationDelay: '160ms' }}>
          <div className="card-icon">⚽</div>
          <div className="stat-value score-digit">{scoredMatches.length}</div>
          <div className="stat-label">Scored Matches</div>
        </div>
        <div className="stat-card fade-in-up" style={{ animationDelay: '240ms' }}>
          <div className="card-icon">🏆</div>
          <div className="stat-value" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)', marginTop: '8px' }}>
            {formatTeamDisplay(topTeam)}
          </div>
          <div className="stat-label">Current Leader</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-lg)' }} className="section">
        <div className="card">
          <div className="card-header"><span className="card-title">📊 Top Team Score Progression</span></div>
          <div style={{ padding: 'var(--space-md)' }}>
            {matchLabels.length > 0 ? (
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
                    <text x={pad - 4} y={py(v) + 4} textAnchor="end" fill="var(--color-text-muted)" fontSize="11">{Math.round(v)}</text>
                  </g>
                ))}
                <polyline points={pts} fill="none" stroke="var(--color-chart-1)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                {earned.map((v, i) => (
                  <circle key={i} cx={px(i)} cy={py(v)} r="4" fill="var(--color-chart-1)">
                    <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
                  </circle>
                ))}
                {matchLabels.map((label, i) => (
                  <text key={i} x={px(i)} y={H - 8} textAnchor="middle" fill="var(--color-text-muted)" fontSize="11">{label}</text>
                ))}
              </svg>
            ) : (
              <div className="empty-state" style={{ minHeight: '150px' }}>No matches scored yet</div>
            )}
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">🎯 Top Team Phase Contribution</span></div>
          <div style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div style={{ textAlign: 'center', fontFamily: 'var(--font-score)', fontSize: 'var(--text-5xl)', fontWeight: 700, margin: 'var(--space-lg) 0', letterSpacing: '0.02em' }}>
              {fmt1(totalScore)}<span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-xl)' }}>/100</span>
            </div>
            {totalScore > 0 && (
              <div className="phase-bar" style={{ height: '20px' }}>
                {phases.map(p => (
                  <div key={p.label} className="phase-bar-seg" style={{ width: `${(p.val / totalScore) * 100}%`, background: p.color }}></div>
                ))}
              </div>
            )}
            {phases.map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', fontSize: 'var(--text-sm)' }}>
                <span style={{ width: 12, height: 12, borderRadius: 2, background: p.color, display: 'inline-block', flexShrink: 0 }}></span>
                {p.label}: <strong style={{ fontFamily: 'var(--font-data)' }}>{p.val.toFixed(1)}</strong>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card section">
        <div className="card-header"><span className="card-title">🕸 Top Team Dimension Profile (Average per match)</span></div>
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

      {latestMatch && (
        <div className="card section">
          <div className="card-header">
            <span className="card-title">⚔️ Latest Match Comparison — Match #{latestMatch.match_number}</span>
          </div>
          <div style={{ padding: 'var(--space-md)' }}>
            {perMatch.map((t, i) => {
              const baseScore = t.score_breakdown?.base_score || 0;
              return (
                <div key={t.team_id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)', marginBottom: 'var(--space-sm)', animation: `fadeInUp ${500 + i * 80}ms var(--ease-out) both` }}>
                  <span style={{ width: 120, fontSize: 'var(--text-sm)', textAlign: 'right', fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                    {formatTeamDisplay(t)}
                  </span>
                  <div style={{ flex: 1 }}>
                    <div className="progress-bar" style={{ height: '20px' }}>
                      <div className="progress-fill" style={{ width: `${(baseScore / 25) * 100}%`, background: i === 0 ? 'var(--color-chart-1)' : 'var(--color-chart-2)' }}></div>
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-data)', fontWeight: 700, width: 40 }}>{baseScore}/25</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default AnalyticsView;
