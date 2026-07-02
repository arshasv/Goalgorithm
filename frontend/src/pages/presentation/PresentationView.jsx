import React, { useState, useEffect } from 'react';
import { ScoringService } from '../../api/scoringService';
import { TeamService } from '../../api/teamService';
import { ScoringConfigService } from '../../api/scoringConfigService';

const rankBadge = (rank) => {
  const r = Number(rank);
  if (r === 1) return <span className="rank-badge rank-badge-1">🏆</span>;
  if (r === 2) return <span className="rank-badge rank-badge-2">🥈</span>;
  if (r === 3) return <span className="rank-badge rank-badge-3">🥉</span>;
  return <span className="rank-badge rank-badge-n">#{rank}</span>;
};

const formatTeamDisplay = (t) => {
  const code = t.team_code || t.code || t.team_id || '';
  const name = t.name || t.team_name || '';
  return code ? `${code} – ${name}` : name;
};

const PresentationView = () => {
  const [config, setConfig] = useState(null);
  const [judgeCount, setJudgeCount] = useState(2);
  const [criteria, setCriteria] = useState([]);
  const [teams, setTeams] = useState([]);
  const [evaluations, setEvaluations] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadConfig = async () => {
    try {
      const active = await ScoringConfigService.getActiveConfig();
      if (active) {
        setConfig(active);
        setJudgeCount(active.presentation_judge_count || 2);
        setCriteria(active.presentation_criteria || [
          { name: "Problem Understanding", max_score: 10 },
          { name: "Feature Engineering", max_score: 15 },
          { name: "Team Work", max_score: 10 },
          { name: "Presentation Quality", max_score: 10 },
          { name: "Q&A", max_score: 5 }
        ]);
      }
    } catch (err) {
      console.error("Failed to load active scoring configuration", err);
    }
  };

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await TeamService.listTeams();
      setTeams(data);
    } catch (err) {
      setError('Failed to load teams: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      await loadConfig();
      await loadTeams();
    };
    init();
  }, []);

  useEffect(() => {
    if (teams.length > 0 && criteria.length > 0) {
      setEvaluations(prev => {
        const next = { ...prev };
        teams.forEach(team => {
          const existing = prev[team.id] || [];
          const nextScores = [];
          for (let j = 0; j < judgeCount; j++) {
            const judgeObj = {};
            criteria.forEach(c => {
              judgeObj[c.name] = (existing[j] && existing[j][c.name] !== undefined) ? existing[j][c.name] : 0;
            });
            nextScores.push(judgeObj);
          }
          next[team.id] = nextScores;
        });
        return next;
      });
    }
  }, [teams, judgeCount, criteria]);

  const handleScoreChange = (teamId, judgeIndex, criterionName, val, maxScore) => {
    const cleanVal = Math.max(0, Math.min(maxScore, val === '' ? 0 : parseInt(val, 10) || 0));
    setEvaluations(prev => {
      const teamScores = [...(prev[teamId] || [])];
      teamScores[judgeIndex] = {
        ...teamScores[judgeIndex],
        [criterionName]: cleanVal
      };
      return { ...prev, [teamId]: teamScores };
    });
  };

  const getJudgeTotal = (teamId, judgeIndex) => {
    const judgeObj = evaluations[teamId]?.[judgeIndex] || {};
    return Object.values(judgeObj).reduce((sum, val) => sum + (val || 0), 0);
  };

  const getTeamAverage = (teamId) => {
    const judgeScores = evaluations[teamId] || [];
    if (judgeScores.length === 0) return 0;
    const totalSum = judgeScores.reduce((sum, _, idx) => sum + getJudgeTotal(teamId, idx), 0);
    return totalSum / judgeScores.length;
  };

  const getMaxTotal = () => {
    return criteria.reduce((sum, c) => sum + (c.max_score || 0), 0);
  };

  const handleReset = () => {
    setEvaluations(prev => {
      const next = {};
      Object.keys(prev).forEach(teamId => {
        next[teamId] = prev[teamId].map(judgeObj => {
          const resetObj = {};
          Object.keys(judgeObj).forEach(k => { resetObj[k] = 0; });
          return resetObj;
        });
      });
      return next;
    });
    setResults(null);
  };

  const handleSubmit = async () => {
    if (!window.confirm('Submit Phase 3 presentation scores for all teams?')) return;

    try {
      const payload = teams.map(t => ({
        team_id: t.id,
        judge_scores: evaluations[t.id] || []
      }));

      const response = await ScoringService.calculatePresentation(payload);
      setResults(response);
      alert('Presentation scores submitted successfully!');
    } catch (e) {
      alert(`Failed to submit presentation scores: ${e.response?.data?.detail || e.message}`);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">🎤 Presentation Evaluation</h1>
          <p className="page-subtitle">Phase 3 · Configure judges and criteria to evaluate team presentations</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>↺ Reset</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={teams.length === 0}>✓ Submit All Presentation Scores</button>
        </div>
      </div>
      
      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

      <div className="card" style={{ marginBottom: 'var(--space-md)', padding: 'var(--space-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
          <label style={{ fontWeight: 600 }}>Number of Judges:</label>
          <input
            className="form-input"
            type="number"
            min="1"
            max="15"
            value={judgeCount}
            onChange={e => {
              const val = Math.max(1, parseInt(e.target.value, 10) || 1);
              setJudgeCount(val);
            }}
            style={{ maxWidth: '100px' }}
          />
        </div>
      </div>

      <div className="card section">
        <div className="card-header"><span className="card-title">📝 Score Entry Form</span></div>
        {loading ? (
          <div style={{ padding: 'var(--space-md)' }}>Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="empty-state">No teams found.</div>
        ) : (
          <div className="table-wrapper" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', minWidth: '1000px' }}>
              <thead>
                <tr>
                  <th rowSpan={2} style={{ verticalAlign: 'middle' }}>Team</th>
                  {Array.from({ length: judgeCount }).map((_, jIdx) => (
                    <th key={jIdx} colSpan={criteria.length + 1} style={{ textAlign: 'center', borderBottom: '2px solid var(--color-border)' }}>
                      Judge {jIdx + 1}
                    </th>
                  ))}
                  <th rowSpan={2} style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                    Average Score (/{getMaxTotal()})
                  </th>
                </tr>
                <tr>
                  {Array.from({ length: judgeCount }).map((_, jIdx) => (
                    <React.Fragment key={jIdx}>
                      {criteria.map(c => (
                        <th key={c.name} className="score-header" style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                          {c.name} <span style={{ color: 'var(--color-text-secondary)', display: 'block', fontWeight: 400 }}>/{c.max_score}</span>
                        </th>
                      ))}
                      <th className="score-header" style={{ fontSize: 'var(--text-xs)', fontWeight: 700, backgroundColor: 'rgba(0,0,0,0.02)' }}>
                        Total
                      </th>
                    </React.Fragment>
                  ))}
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => {
                  const avg = getTeamAverage(t.id);
                  return (
                    <tr key={t.id} style={{ animation: `fadeIn ${300 + i * 80}ms var(--ease-out) both` }}>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase', verticalAlign: 'middle' }}>
                        {formatTeamDisplay(t)}
                      </td>
                      {Array.from({ length: judgeCount }).map((_, jIdx) => {
                        const jTotal = getJudgeTotal(t.id, jIdx);
                        return (
                          <React.Fragment key={jIdx}>
                            {criteria.map(c => {
                              const val = evaluations[t.id]?.[jIdx]?.[c.name] || 0;
                              return (
                                <td key={c.name} className="score-cell" style={{ verticalAlign: 'middle' }}>
                                  <input
                                    className="form-input score-input"
                                    type="number"
                                    min="0"
                                    max={c.max_score}
                                    value={val}
                                    onChange={e => handleScoreChange(t.id, jIdx, c.name, e.target.value, c.max_score)}
                                    style={{ minWidth: '60px' }}
                                  />
                                </td>
                              );
                            })}
                            <td className="score-cell" style={{ verticalAlign: 'middle', fontWeight: 600, backgroundColor: 'rgba(0,0,0,0.01)', textAlign: 'center' }}>
                              {jTotal}
                            </td>
                          </React.Fragment>
                        );
                      })}
                      <td className="score-cell" style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                        <span style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-xl)', fontWeight: 700 }}>
                          {avg.toFixed(2)}
                        </span>
                        <span style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--text-sm)' }}>
                          /{getMaxTotal()}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {results && (
        <div className="card section" style={{ animation: 'slideUp 400ms var(--ease-out)', marginTop: 'var(--space-lg)' }}>
          <div className="card-header"><span className="card-title">🏆 Phase 3 Results</span></div>
          <div className="table-wrapper">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Team</th>
                  <th className="score-header">Number of Judges</th>
                  <th className="score-header">Calculated Average Score</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.team_id} className={`rank-${r.rank <= 3 ? r.rank : 'n'}`} style={{ animation: `fadeIn ${400 + i * 80}ms var(--ease-out) both` }}>
                    <td>{rankBadge(r.rank)}</td>
                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                      {teams.find(t => t.id === r.team_id) ? formatTeamDisplay(teams.find(t => t.id === r.team_id)) : r.team_id}
                    </td>
                    <td className="score-cell">{r.judge_count}</td>
                    <td className="score-cell" style={{ fontWeight: 800, fontSize: 'var(--text-lg)', fontFamily: 'var(--font-score)' }}>
                      {r.presentation_score.toFixed(2)} <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 400 }}>/{r.max_marks}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="formula-card section">
        <div className="formula-title">Phase 3 Scoring Rule</div>
        <div className="formula-text">
          Final Presentation Score = Sum of Judge Totals ÷ Number of Judges<br />
          Example: (41 + 45) ÷ 2 = <strong>43.00</strong>
        </div>
      </div>
    </div>
  );
};

export default PresentationView;
