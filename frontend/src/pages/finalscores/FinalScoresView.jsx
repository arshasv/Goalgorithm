import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ScoresService } from '../../api/scoresService';
import { LeaderboardService } from '../../api/leaderboardService';
import { TeamService } from '../../api/teamService';
import { ScoringConfigService } from '../../api/scoringConfigService';

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
  const r = Number(rank);
  if (r === 1) return <span className="rank-badge rank-badge-1">🏆</span>;
  if (r === 2) return <span className="rank-badge rank-badge-2">🥈</span>;
  if (r === 3) return <span className="rank-badge rank-badge-3">🥉</span>;
  return <span className="rank-badge rank-badge-n">#{rank}</span>;
};

const gradeBadge = (grade) => {
  const colors = { A: 'badge-success', B: 'badge-info', C: 'badge-warning', D: 'badge-error' };
  return <span className={`badge ${colors[grade] || 'badge-warning'}`}>Grade {grade}</span>;
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
  let dims = [];

  if (pres.presentation_criteria_config && pres.presentation_criteria_config.length > 0) {
    const judgeScores = pres.judge_scores || [];
    dims = pres.presentation_criteria_config.map(c => {
      const name = c.name;
      const max = c.max_score || 10;

      const validScores = judgeScores
        .map(j => j.scores && j.scores[name])
        .filter(s => s != null && !isNaN(s));

      const score = validScores.length > 0
        ? validScores.reduce((sum, val) => sum + Number(val), 0) / validScores.length
        : 0;

      return { label: name, score, max };
    });
  } else {
    dims = [
      { label: 'AI Explanation', score: pres.ai_explanation_score || 0, max: 20 },
      { label: 'Q&A Score', score: pres.qa_score || 0, max: 15 },
      { label: 'Delivery Score', score: pres.delivery_score || 0, max: 15 },
    ];
  }

  const rawMax = dims.reduce((sum, d) => sum + d.max, 0);

  return (
    <div className="score-breakdown-card">
      <div className="card-header">
        <strong className="card-title">🎤 Presentation Evaluation</strong>
        {pres.grade ? gradeBadge(pres.grade) : null}
      </div>
      {dims.map(d => {
        const pct = d.max > 0 ? (d.score / d.max) * 100 : 0;
        const barColor = pct >= 80 ? '#FACC15' : '#38BDF8';
        return (
          <div key={d.label} className="dimension-row">
            <span className="dimension-label">{d.label}</span>
            <div className="dimension-bar-wrap" style={{ background: 'var(--color-surface-secondary)' }}>
              <div
                className="dimension-bar-fill"
                style={{
                  width: `${pct}%`,
                  background: barColor,
                  borderRadius: 'var(--radius-small)'
                }}
              ></div>
            </div>
            <span className={`dimension-score ${scoreColor(d.score, d.max)}`}>{fmt1(d.score)}/{d.max}</span>
          </div>
        );
      })}
      <div className="score-total-row">
        <div>
          <div className="base-score-label">Raw Total</div>
          <div className="base-score-value">{fmt1(pres.raw_total)}<span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-lg)' }}>/{rawMax}</span></div>
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
  const [activeTab, setActiveTab] = useState(isOrganizer ? 'daily' : 'leaderboard');
  const [dailyScores, setDailyScores] = useState([]);
  const [matchBreakdown, setMatchBreakdown] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [techEvals, setTechEvals] = useState([]);
  const [presEvals, setPresEvals] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadAll = async () => {
    setLoading(true);
    setError('');
    try {
      const [daily, matches, lb, tech, pres, activeConfig] = await Promise.all([
        ScoresService.getDailyScores().catch(() => []),
        ScoresService.getMatchBreakdown().catch(() => []),
        LeaderboardService.getLeaderboard().catch(() => []),
        ScoresService.getTechnicalEvaluations().catch(() => []),
        ScoresService.getPresentationEvaluations().catch(() => []),
        ScoringConfigService.getActiveConfig().catch(() => null),
      ]);

      setDailyScores(daily);
      setMatchBreakdown(matches);
      setLeaderboard(lb);
      setTechEvals(tech);
      setPresEvals(pres);
      setConfig(activeConfig);
    } catch (err) {
      setError('Failed to load: ' + (err.response?.data?.detail || err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAll(); }, []);

  const tabs = isOrganizer ? [
    { key: 'daily', label: 'Daily Scores' },
    { key: 'matches', label: 'Match Breakdown' },
    { key: 'leaderboard', label: 'Leaderboard' },
    { key: 'evaluations', label: 'All Evaluations' },
  ] : [
    { key: 'leaderboard', label: 'My Standing & Score' },
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
            <thead><tr><th>Rank</th><th>Team</th><th>Cumulative Base Score</th><th></th></tr></thead>
            <tbody>
              {day.teams.map((t, i) => {
                const r = Number(t.rank);
                const rankClass = r <= 3 ? `rank-${r}` : '';
                return (
                  <tr key={t.team_code + i} className={rankClass}>
                    <td>{t.rank}</td>
                    <td><strong>{formatTeamDisplay({ team_code: t.team_code, name: t.team_name })}</strong></td>
                    <td><strong className="score-num">{fmt1(t.total_score)} pts</strong></td>
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
              <thead><tr><th>Team</th><th>Prediction</th><th>Winner</th><th>Scoreline</th><th>Prob.</th><th>Player</th><th>Tot Goals</th><th>BTTS</th><th>First Team</th><th>Clean Sheet</th><th>Base Score</th><th>Grade</th><th>Mult</th><th>Earned Pts</th></tr></thead>
              <tbody>
                {(match.teams || []).map(t => {
                  const sc = t.score_breakdown || {};
                  const pred = t.prediction || {};
                  const predStr = pred.predicted_home_goals != null ? `${pred.predicted_home_goals}–${pred.predicted_away_goals}` : '—';

                  const maxWinner = config?.winner_points_correct || 2.5;
                  const maxScoreline = config?.scoreline_points_exact || 7.5;
                  const maxProbability = config?.probability_points_pass || 5.0;
                  const maxPlayer = config?.player_points_exact || 2.5;
                  const maxTotalGoals = config?.total_goals_points_exact || 0.0;
                  const maxBtts = config?.btts_points_correct || 2.5;
                  const maxFtts = config?.first_team_to_score_points_correct || 2.5;
                  const maxCleanSheet = config?.clean_sheet_points_correct || 2.5;
                  const maxBase = config?.max_base_score || 25.0;

                  return (
                    <tr key={t.team_id}>
                      <td><strong>{formatTeamDisplay({ team_code: t.team_code, name: t.team_name })}</strong></td>
                      <td>{predStr}</td>
                      <td><span className={sc.winner_points >= maxWinner ? 'badge badge-success' : sc.winner_points > 0 ? 'badge badge-warning' : 'badge badge-error'}>{sc.winner_points ?? '—'}/{maxWinner}</span></td>
                      <td><span className={sc.scoreline_points >= maxScoreline ? 'badge badge-success' : sc.scoreline_points > 0 ? 'badge badge-warning' : 'badge badge-error'}>{sc.scoreline_points ?? '—'}/{maxScoreline}</span></td>
                      <td><span className={sc.probability_points >= maxProbability ? 'badge badge-success' : sc.probability_points > 0 ? 'badge badge-warning' : 'badge badge-error'}>{sc.probability_points ?? '—'}/{maxProbability}</span></td>
                      <td><span className={sc.player_points >= maxPlayer ? 'badge badge-success' : sc.player_points > 0 ? 'badge badge-warning' : 'badge badge-error'}>{sc.player_points ?? '—'}/{maxPlayer}</span></td>
                      <td><span className={sc.total_goals_points > 0 ? 'badge badge-success' : 'badge badge-error'}>{sc.total_goals_points ?? '—'}/{maxTotalGoals.toFixed(1)}</span></td>
                      <td><span className={sc.btts_points >= maxBtts ? 'badge badge-success' : 'badge badge-error'}>{sc.btts_points ?? '—'}/{maxBtts}</span></td>
                      <td><span className={sc.first_team_to_score_points >= maxFtts ? 'badge badge-success' : 'badge badge-error'}>{sc.first_team_to_score_points ?? '—'}/{maxFtts}</span></td>
                      <td><span className={sc.clean_sheet_points >= maxCleanSheet ? 'badge badge-success' : sc.clean_sheet_points > 0 ? 'badge badge-warning' : 'badge badge-error'}>{sc.clean_sheet_points ?? '—'}/{maxCleanSheet}</span></td>
                      <td><strong className={`score-num ${scoreColor(sc.base_score, maxBase)}`}>{fmt1(sc.base_score)}</strong></td>
                      <td><span className="badge">{sc.grade || '—'}</span></td>
                      <td>{sc.multiplier != null ? `x${sc.multiplier}` : '—'}</td>
                      <td><strong className="score-num">{fmt1(sc.earned_points)}</strong></td>
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
        {isOrganizer && (
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
        )}
        <div className="card">
          <div className="table-wrapper">
            <table>
              <thead><tr><th>Rank</th><th>Team</th><th>Phase 1</th><th>Technical</th><th>Presentation</th><th>Final Score</th><th></th></tr></thead>
              <tbody>
                {leaderboard.map(e => {
                  const r = Number(e.rank);
                  const rankClass = r <= 3 ? `rank-${r}` : '';
                  const phase1Max = config?.phase1_max_marks || 60;
                  const techMax = config?.technical_max_total || 20;
                  const presMax = config?.presentation_max_marks || 20;

                  return (
                    <tr key={e.team_id} className={rankClass}>
                      <td>{e.rank}</td>
                      <td><strong>{formatTeamDisplay(e)}</strong></td>
                      <td><span className={`score-num ${scoreColor(e.phase1_score, phase1Max)}`}>{fmt1(e.phase1_score)}</span></td>
                      <td><span className={`score-num ${scoreColor(e.technical_score, techMax)}`}>{fmt1(e.technical_score)}</span></td>
                      <td><span className={`score-num ${scoreColor(e.presentation_score, presMax)}`}>{fmt1(e.presentation_score)}</span></td>
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
      return (
        <div>
          {isOrganizer && (
            <div className="grid-3">
              {Array(3).fill(null).map((_, i) => (
                <div key={i} className="card"><div className="skeleton skeleton-title"></div><div className="skeleton skeleton-text" style={{ marginTop: 'var(--space-md)' }}></div></div>
              ))}
            </div>
          )}
        </div>
      );
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
