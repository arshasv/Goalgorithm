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

const scoreColor = (val, max) => {
  if (val === 0) return 'color:var(--color-status-error)';
  if (val >= max) return 'color:var(--color-status-success)';
  return '';
};

const rankBadge = (rank) => {
  if (rank === 1) return <span className="rank-badge rank-badge-1">🏆</span>;
  if (rank === 2) return <span className="rank-badge rank-badge-2">🥈</span>;
  if (rank === 3) return <span className="rank-badge rank-badge-3">🥉</span>;
  return <span className="rank-badge rank-badge-n">#{rank}</span>;
};

const gradeBadge = (grade) => {
  const colors = { A: 'badge-success', B: 'badge-info', C: 'badge-warning', D: 'badge-error' };
  return <span className={`badge ${colors[grade] || 'badge-warning'}`}>Grade {grade}</span>;
};

const MockTeams = [
  { id: 'T1', team_id: 'A', code: 'A', name: 'Team A', is_active: true },
  { id: 'T2', team_id: 'B', code: 'B', name: 'Team B', is_active: true },
  { id: 'T3', team_id: 'C', code: 'C', name: 'Team C', is_active: true },
  { id: 'T4', team_id: 'D', code: 'D', name: 'Team D', is_active: true },
  { id: 'T5', team_id: 'E', code: 'E', name: 'Team E', is_active: true },
];

const MockMatches = [
  { id: 'M32', home: 'Arsenal', away: 'Chelsea', status: 'completed', homeGoals: 2, awayGoals: 1 },
  { id: 'M31', home: 'Liverpool', away: 'Man City', status: 'completed', homeGoals: 1, awayGoals: 1 },
];

const generateMockDailyScores = () => {
  const days = [
    { date: '2026-06-10', label: 'Jun 10' },
    { date: '2026-06-08', label: 'Jun 8' },
  ];
  return days.map(day => {
    const entries = MockTeams.map((t, i) => ({
      team_code: t.team_id || t.code,
      team_name: t.name,
      total_score: Math.round((85 - i * 7 + Math.random() * 10) * 10) / 10,
    }));
    entries.sort((a, b) => b.total_score - a.total_score);
    entries.forEach((e, i) => e.rank = i + 1);
    return { date: day.date, teams: entries };
  });
};

const generateMockMatchBreakdown = () => {
  const baseVals = [
    { w: 5, sl: 10, pr: 5, pl: 5, bs: 25 },
    { w: 5, sl: 5, pr: 0, pl: 5, bs: 15 },
    { w: 0, sl: 5, pr: 5, pl: 0, bs: 10 },
    { w: 5, sl: 0, pr: 0, pl: 5, bs: 10 },
    { w: 0, sl: 0, pr: 0, pl: 0, bs: 0 },
  ];
  return MockMatches.filter(m => m.status === 'scored' || m.status === 'completed').map((m, mi) => ({
    match_id: m.id,
    match_number: parseInt(m.id.replace('M', '')),
    home_team_name: m.home,
    away_team_name: m.away,
    scheduled_at: '2026-06-' + String(10 - mi * 2).padStart(2, '0') + 'T18:00:00',
    status: m.status,
    actual_result: m.homeGoals != null ? {
      actual_winner: m.homeGoals > m.awayGoals ? 'home' : m.homeGoals < m.awayGoals ? 'away' : 'draw',
      actual_home_goals: m.homeGoals,
      actual_away_goals: m.awayGoals,
    } : null,
    teams: MockTeams.map((t, ti) => {
      const v = baseVals[ti % baseVals.length];
      return {
        team_id: t.id,
        team_code: t.team_id || t.code || '',
        team_name: t.name,
        prediction: {
          predicted_winner: v.w === 5 ? 'home' : v.w === 0 ? 'away' : 'draw',
          predicted_home_goals: m.homeGoals != null ? m.homeGoals : 1,
          predicted_away_goals: m.awayGoals != null ? m.awayGoals : 1,
        },
        score_breakdown: {
          winner_points: v.w,
          scoreline_points: v.sl,
          probability_points: v.pr,
          player_points: v.pl,
          base_score: v.bs,
          earned_points: v.bs,
        },
      };
    }),
  }));
};

const generateMockTechEvals = () => {
  return MockTeams.filter(t => t.is_active !== false).map((t, i) => ({
    team_id: t.id,
    team_code: t.team_id || t.code || '',
    team_name: t.name,
    code_quality: Math.min(5, 3 + i),
    backend_quality: Math.min(5, 4 + (i % 2)),
    teamwork: Math.min(5, 3 + (i % 3)),
    ai_explanation: Math.min(5, 4 - (i % 2)),
    total_score: 18 - i * 1.5,
    submitted_at: '2026-06-11T10:00:00Z',
  }));
};

const generateMockPresEvals = () => {
  return MockTeams.filter(t => t.is_active !== false).map((t, i) => ({
    team_id: t.id,
    team_code: t.team_id || t.code || '',
    team_name: t.name,
    ai_explanation_score: 18 - i * 2,
    qa_score: 13 - i,
    delivery_score: 13 - i,
    raw_total: 44 - i * 3,
    presentation_score: Math.round((17.5 - i * 1.5) * 10) / 10,
    rank: i + 1,
    grade: ['A', 'B', 'B', 'C', 'C'][i] || 'C',
    multiplier: [3, 2, 2, 1, 1][i] || 1,
    submitted_at: '2026-06-12T14:00:00Z',
  }));
};

const renderTechCard = (tech) => {
  const dims = [
    { label: 'Code Quality', score: tech.code_quality, max: 5 },
    { label: 'Backend Quality', score: tech.backend_quality, max: 5 },
    { label: 'Teamwork', score: tech.teamwork, max: 5 },
    { label: 'AI Explanation', score: tech.ai_explanation, max: 5 },
  ];
  return (
    <div className="score-breakdown-card">
      <div className="card-header"><strong className="card-title">🔧 Technical Evaluation</strong></div>
      {dims.map(d => (
        <div key={d.label} className="dimension-row">
          <span className="dimension-label">{d.label}</span>
          <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{ width: `${(d.score / d.max) * 100}%` }}></div></div>
          <span className={`dimension-score ${scoreColor(d.score, d.max)}`}>{d.score}/{d.max}</span>
        </div>
      ))}
      <div className="score-total-row">
        <div>
          <div className="base-score-label">Total Score</div>
          <div className="base-score-value">{tech.total_score}<span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)' }}>/20</span></div>
        </div>
      </div>
    </div>
  );
};

const renderPresCard = (pres) => {
  const dims = [
    { label: 'AI Explanation', score: pres.ai_explanation_score, max: 20 },
    { label: 'Q&A Score', score: pres.qa_score, max: 15 },
    { label: 'Delivery Score', score: pres.delivery_score, max: 15 },
  ];
  return (
    <div className="score-breakdown-card">
      <div className="card-header">
        <strong className="card-title">🎤 Presentation Evaluation</strong>
        {pres.grade ? gradeBadge(pres.grade) : null}
      </div>
      {dims.map(d => (
        <div key={d.label} className="dimension-row">
          <span className="dimension-label">{d.label}</span>
          <div className="dimension-bar-wrap"><div className="dimension-bar-fill" style={{ width: `${(d.score / d.max) * 100}%` }}></div></div>
          <span className={`dimension-score ${scoreColor(d.score, d.max)}`}>{d.score}/{d.max}</span>
        </div>
      ))}
      <div className="score-total-row">
        <div>
          <div className="base-score-label">Raw Total</div>
          <div className="base-score-value">{pres.raw_total}<span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)' }}>/50</span></div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div className="base-score-label">Final Score</div>
          <div className="earned-score score-digit">{fmt1(pres.presentation_score)}<span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)' }}>/20</span></div>
        </div>
      </div>
      {pres.multiplier ? <div style={{ marginTop: 'var(--space-sm)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>Rank #{pres.rank} · {pres.grade} ×{pres.multiplier}</div> : null}
    </div>
  );
};

const FinalScoresView = () => {
  const { isOrganizer } = useAuth();
  const [activeTab, setActiveTab] = useState('daily');
  const [dailyScores, setDailyScores] = useState([]);
  const [matchBreakdown, setMatchBreakdown] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [techEvals, setTechEvals] = useState([]);
  const [presEvals, setPresEvals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [daily, matches, lb] = await Promise.all([
        ScoresService.getMatchBreakdown ? ScoresService.getMatchBreakdown().catch(() => []) : [],
        ScoresService.getMatchBreakdown ? ScoresService.getMatchBreakdown().catch(() => []) : [],
        LeaderboardService.getLeaderboard().catch(() => []),
      ]);

      const ds = daily.length ? daily : generateMockDailyScores();
      const mb = matches.length ? matches : generateMockMatchBreakdown();
      const lbData = lb.length ? lb : [];

      setDailyScores(ds);
      setMatchBreakdown(mb);

      const tech = generateMockTechEvals();
      const pres = generateMockPresEvals();
      setTechEvals(tech);
      setPresEvals(pres);

      if (!lbData.length) {
        setLeaderboard([
          { rank: 1, team_id: 'T1', team_code: 'A', team_name: 'Team A', phase1_score: 60, technical_score: 19, presentation_score: 19, final_score: 98 },
          { rank: 2, team_id: 'T2', team_code: 'B', team_name: 'Team B', phase1_score: 34, technical_score: 18, presentation_score: 16, final_score: 68 },
          { rank: 3, team_id: 'T3', team_code: 'C', team_name: 'Team C', phase1_score: 30, technical_score: 15, presentation_score: 15, final_score: 60 },
          { rank: 4, team_id: 'T4', team_code: 'D', team_name: 'Team D', phase1_score: 14, technical_score: 10, presentation_score: 12, final_score: 36 },
          { rank: 5, team_id: 'T5', team_code: 'E', team_name: 'Team E', phase1_score: 0, technical_score: 5, presentation_score: 8, final_score: 13 },
        ]);
      } else {
        setLeaderboard(lbData);
      }
    } catch (err) {
      setError('Failed to load: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const tabs = [
    { key: 'daily', label: 'Daily Scores' },
    { key: 'matches', label: 'Match Breakdown' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'evaluations', label: isOrganizer ? 'All Evaluations' : 'My Evaluations' },
  ];

  const topScore = leaderboard.length > 0 ? leaderboard[0].final_score : 0;

  const renderDailyScoresTab = () => {
    if (!dailyScores.length) {
      return (
        <div className="empty-state">
          <div className="empty-icon">📊</div>
          <h2 className="empty-title">No Daily Scores Yet</h2>
          <p className="empty-desc">Scores will appear here once match scoring is complete.</p>
        </div>
      );
    }
    return dailyScores.map(day => (
      <div key={day.date} className="card" style={{ marginBottom: 'var(--space-lg)', animation: 'fadeInUp 0.3s ease-out' }}>
        <div className="card-header"><span className="card-title">{new Date(day.date).toLocaleDateString()}</span></div>
        <div className="table-wrapper">
          <table>
            <thead><tr><th>Rank</th><th>Team</th><th>Daily Score</th><th></th></tr></thead>
            <tbody>
              {day.teams.map((t, i) => {
                const rankClass = t.rank <= 3 ? `rank-${t.rank}` : '';
                return (
                  <tr key={t.team_code + i} className={rankClass}>
                    <td>{t.rank}</td>
                    <td><strong>{formatTeamDisplay({ team_code: t.team_code, name: t.team_name })}</strong></td>
                    <td><span className={`score-num ${scoreColor(t.total_score, 75)}`}>{fmt1(t.total_score)}</span></td>
                    <td>{rankBadge(t.rank)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    ));
  };

  const renderMatchBreakdownTab = () => {
    if (!matchBreakdown.length) {
      return (
        <div className="empty-state">
          <div className="empty-icon">⚽</div>
          <h2 className="empty-title">No Match Scores Yet</h2>
          <p className="empty-desc">Match breakdowns will appear once scoring begins.</p>
        </div>
      );
    }
    return matchBreakdown.map((match, mi) => {
      const actual = match.actual_result || {};
      const scoreline = actual.actual_home_goals != null
        ? `${actual.actual_home_goals}–${actual.actual_away_goals}`
        : '—';
      return (
        <div key={match.match_id} className="card" style={{ marginBottom: 'var(--space-lg)', animation: `fadeInUp ${300 + mi * 100}ms ease-out both` }}>
          <div className="card-header">
            <span className="card-title">Match {match.match_number} — {match.home_team_name} vs {match.away_team_name}</span>
            <span style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-xl)', color: 'var(--color-accent)' }}>{scoreline}</span>
          </div>
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Team</th><th>Prediction</th><th>Winner</th><th>Scoreline</th><th>Probability</th><th>Player</th><th>Base Score</th></tr></thead>
              <tbody>
                {(match.teams || []).map(t => {
                  const sc = t.score_breakdown || {};
                  const pred = t.prediction || {};
                  const predStr = pred.predicted_home_goals != null ? `${pred.predicted_home_goals}–${pred.predicted_away_goals}` : '—';
                  return (
                    <tr key={t.team_id}>
                      <td><strong>{formatTeamDisplay({ team_code: t.team_code, name: t.team_name })}</strong></td>
                      <td>{predStr}</td>
                      <td><span className={sc.winner_points === 5 ? 'badge badge-success' : 'badge badge-error'}>{sc.winner_points ?? '—'}/5</span></td>
                      <td><span className={sc.scoreline_points === 10 ? 'badge badge-success' : sc.scoreline_points === 5 ? 'badge badge-warning' : 'badge badge-error'}>{sc.scoreline_points ?? '—'}/10</span></td>
                      <td><span className={sc.probability_points === 5 ? 'badge badge-success' : 'badge badge-error'}>{sc.probability_points ?? '—'}/5</span></td>
                      <td><span className={sc.player_points === 5 ? 'badge badge-success' : sc.player_points >= 2 ? 'badge badge-warning' : 'badge badge-error'}>{sc.player_points ?? '—'}/5</span></td>
                      <td><strong className={`score-num ${scoreColor(sc.base_score, 25)}`}>{fmt1(sc.base_score)}</strong></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {(!match.teams || match.teams.length === 0) && (
            <div style={{ padding: 'var(--space-md)', color: 'var(--color-text-secondary)', fontStyle: 'italic' }}>No scores recorded for this match yet.</div>
          )}
        </div>
      );
    });
  };

  const renderLeaderboardTab = () => {
    if (!leaderboard.length) {
      return (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h2 className="empty-title">No Leaderboard Data</h2>
          <p className="empty-desc">The leaderboard will be generated after scoring is complete.</p>
        </div>
      );
    }
    return (
      <>
        <div className="grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="card stat-card">
            <div className="stat-label">Total Teams</div>
            <div className="stat-value" style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)' }}>{leaderboard.length}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Top Score</div>
            <div className="stat-value" style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)' }}>{fmt1(topScore)}</div>
          </div>
          <div className="card stat-card">
            <div className="stat-label">Top Team</div>
            <div className="stat-value" style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-lg)' }}>{leaderboard[0] ? formatTeamDisplay(leaderboard[0]) : '—'}</div>
          </div>
        </div>
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Rank</th><th>Team</th><th>Phase 1</th><th>Technical</th><th>Presentation</th><th>Final Score</th><th></th></tr></thead>
              <tbody>
                {leaderboard.map(e => {
                  const rankClass = e.rank <= 3 ? `rank-${e.rank}` : '';
                  return (
                    <tr key={e.team_id} className={rankClass}>
                      <td>{e.rank}</td>
                      <td><strong>{formatTeamDisplay(e)}</strong></td>
                      <td><span className={`score-num ${scoreColor(e.phase1_score, 60)}`}>{fmt1(e.phase1_score)}</span></td>
                      <td><span className={`score-num ${scoreColor(e.technical_score, 20)}`}>{fmt1(e.technical_score)}</span></td>
                      <td><span className={`score-num ${scoreColor(e.presentation_score, 20)}`}>{fmt1(e.presentation_score)}</span></td>
                      <td><strong className="score-num" style={{ fontSize: 'var(--text-lg)' }}>{fmt1(e.final_score)}</strong></td>
                      <td>{rankBadge(e.rank)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  const renderEvaluationsTab = () => {
    const allTeamIds = new Set();
    techEvals.forEach(e => allTeamIds.add(e.team_id));
    presEvals.forEach(e => allTeamIds.add(e.team_id));

    if (!allTeamIds.size) {
      return (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <h2 className="empty-title">No Evaluations Yet</h2>
          <p className="empty-desc">{isOrganizer ? 'Submit evaluations from the Technical and Presentation pages.' : 'Your evaluations will appear here once the organizer submits them.'}</p>
        </div>
      );
    }

    return Array.from(allTeamIds).map(teamId => {
      const tech = techEvals.find(e => e.team_id === teamId);
      const pres = presEvals.find(e => e.team_id === teamId);
      const teamObj = { team_code: tech?.team_code || pres?.team_code || '', team_name: tech?.team_name || pres?.team_name || '' };
      return (
        <div key={teamId} className="card" style={{ marginBottom: 'var(--space-lg)', animation: 'fadeInUp 0.3s ease-out' }}>
          <div className="card-header"><span className="card-title">{formatTeamDisplay(teamObj)}</span></div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
            {tech ? renderTechCard(tech) : <div className="alert alert-info">Technical evaluation not yet submitted.</div>}
            {pres ? renderPresCard(pres) : <div className="alert alert-info">Presentation evaluation not yet submitted.</div>}
          </div>
        </div>
      );
    });
  };

  const renderTabContent = () => {
    if (loading) {
      return <div className="grid-3">{Array(3).fill(null).map((_, i) => (
        <div key={i} className="card"><div className="skeleton skeleton-title"></div><div className="skeleton skeleton-text" style={{ marginTop: 'var(--space-md)' }}></div></div>
      ))}</div>;
    }
    switch (activeTab) {
      case 'daily': return renderDailyScoresTab();
      case 'matches': return renderMatchBreakdownTab();
      case 'leaderboard': return renderLeaderboardTab();
      case 'evaluations': return renderEvaluationsTab();
      default: return null;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Final Scores</h1>
          <p className="page-subtitle">Complete tournament scoring dashboard</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={loadAll}>🔄 Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

      <div className="tabs" style={{ marginBottom: 'var(--space-lg)' }}>
        {tabs.map(tab => (
          <button
            key={tab.key}
            className={`tab-btn ${activeTab === tab.key ? 'active' : ''}`}
            data-fs-tab={tab.key}
            onClick={() => setActiveTab(tab.key)}
          >{tab.label}</button>
        ))}
      </div>
      <div id="fs-tab-content">
        {renderTabContent()}
      </div>
    </div>
  );
};

export default FinalScoresView;
