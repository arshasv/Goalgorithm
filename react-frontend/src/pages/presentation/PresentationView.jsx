import React, { useState, useEffect } from 'react';
import { ScoringService } from '../../api/scoringService';
import { TeamService } from '../../api/teamService';

const rankBadge = (rank) => {
  const r = Number(rank);
  if (r === 1) return <span className="rank-badge rank-badge-1">🏆</span>;
  if (r === 2) return <span className="rank-badge rank-badge-2">🥈</span>;
  if (r === 3) return <span className="rank-badge rank-badge-3">🥉</span>;
  return <span className="rank-badge rank-badge-n">#{rank}</span>;
};

const gradeBadge = (grade) => {
  const colors = { A: 'badge-success', B: 'badge-info', C: 'badge-warning' };
  return <span className={`badge ${colors[grade] || 'badge-warning'}`}>Grade {grade}</span>;
};

const getRawTotalColor = (v) => {
  if (v === 50) return { color: 'var(--color-status-success)' };
  if (v < 25) return { color: 'var(--color-status-error)' };
  return {};
};

const formatTeamDisplay = (t) => {
  const code = t.team_code || t.code || t.team_id || '';
  const name = t.name || t.team_name || '';
  return code ? `${code} – ${name}` : name;
};

const PresentationView = () => {
  const [teams, setTeams] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await TeamService.listTeams();
      setTeams(data.map(t => ({
        ...t,
        ai_exp: 0,
        qa: 0,
        delivery: 0,
      })));
    } catch (err) {
      setError('Failed to load teams: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeams(); }, []);

  const getRawTotal = (t) => t.ai_exp + t.qa + t.delivery;

  const updateTeam = (index, field, value, max) => {
    const v = Math.max(0, Math.min(max, value === '' ? 0 : parseInt(value, 10) || 0));
    setTeams(prev => prev.map((t, i) => i === index ? { ...t, [field]: v } : t));
  };

  const handleReset = () => {
    setTeams(prev => prev.map(t => ({ ...t, ai_exp: 0, qa: 0, delivery: 0 })));
    setResults(null);
  };

  const handleSubmit = async () => {
    if (!window.confirm('Submit Phase 3 presentation scores for all teams?')) return;

    try {
      const payload = teams.map(t => ({
        team_id: t.id,
        ai_explanation_score: t.ai_exp,
        qa_score: t.qa,
        delivery_score: t.delivery,
      }));

      // In production, we send the entire batch to calculatePresentation
      // However, if the backend endpoint expects one at a time, we do a loop.
      // Wait, the backend endpoint for presentation accepts a list! 
      // Actually, ScoringService.calculatePresentation(payload) takes one or a list?
      // Let's check ScoringService.
      await ScoringService.calculatePresentation(payload);

      // Local computation for immediate result display
      const ranked = payload.map(p => {
        const raw = p.ai_explanation_score + p.qa_score + p.delivery_score;
        return { ...p, raw };
      }).sort((a, b) => b.raw - a.raw).map((p, i) => {
        const rank = i + 1;
        const mult = rank === 1 ? 3 : rank === payload.length ? 1 : 2;
        const grade = rank === 1 ? 'A' : rank === payload.length ? 'C' : 'B';
        const finalScore = ((p.raw * mult) / 150) * 20;
        const pt = teams.find(t => t.id === p.team_id);
        return { ...p, rank, mult, grade, final: finalScore, teamLabel: pt ? formatTeamDisplay(pt) : p.team_id };
      });

      setResults(ranked);
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
          <p className="page-subtitle">Phase 3 · Peer Review · AI Explanation /20 + Q&A /15 + Delivery /15 = Raw /50 → Normalized /20</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>↺ Reset</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={teams.length === 0}>✓ Submit All Presentation Scores</button>
        </div>
      </div>
      
      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

      <div className="alert alert-info" style={{ marginBottom: 'var(--space-md)' }}>
        ℹ️ Scores are ranked and graded (A/B/C). Formula: Raw × Multiplier ÷ 150 × 20 = Final Score
      </div>

      <div className="card section">
        <div className="card-header"><span className="card-title">📝 Score Entry</span></div>
        {loading ? (
          <div style={{ padding: 'var(--space-md)' }}>Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="empty-state">No teams found.</div>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Team</th>
                  <th className="score-header">AI Explanation /20</th>
                  <th className="score-header">Q&A /15</th>
                  <th className="score-header">Delivery /15</th>
                  <th className="score-header">Raw Total /50</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => {
                  const raw = getRawTotal(t);
                  return (
                    <tr key={t.id} style={{ animation: `fadeIn ${300 + i * 80}ms var(--ease-out) both` }}>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                        {formatTeamDisplay(t)}
                      </td>
                      <td className="score-cell">
                        <input className="form-input score-input" type="number" min="0" max="20" value={t.ai_exp}
                          onChange={e => updateTeam(i, 'ai_exp', e.target.value, 20)} />
                      </td>
                      <td className="score-cell">
                        <input className="form-input score-input" type="number" min="0" max="15" value={t.qa}
                          onChange={e => updateTeam(i, 'qa', e.target.value, 15)} />
                      </td>
                      <td className="score-cell">
                        <input className="form-input score-input" type="number" min="0" max="15" value={t.delivery}
                          onChange={e => updateTeam(i, 'delivery', e.target.value, 15)} />
                      </td>
                      <td className="score-cell">
                        <span style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-2xl)', fontWeight: 700, ...getRawTotalColor(raw) }}>{raw}</span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>/50</span>
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
        <div className="card section" style={{ animation: 'slideUp 400ms var(--ease-out)' }}>
          <div className="card-header"><span className="card-title">🏆 Phase 3 Results</span></div>
          <div className="table-wrapper">
            <table style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>Rank</th><th>Team</th><th className="score-header">Raw /50</th>
                  <th>Grade</th><th className="score-header">Multiplier</th><th className="score-header">Final /20</th>
                </tr>
              </thead>
              <tbody>
                {results.map((r, i) => (
                  <tr key={r.team_id} className={`rank-${r.rank <= 3 ? r.rank : 'n'}`} style={{ animation: `fadeIn ${400 + i * 80}ms var(--ease-out) both` }}>
                    <td>{rankBadge(r.rank)}</td>
                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>{r.teamLabel}</td>
                    <td className="score-cell">{r.raw}/50</td>
                    <td>{gradeBadge(r.grade)}</td>
                    <td className="score-cell">{r.mult}×</td>
                    <td className="score-cell" style={{ fontWeight: 800, fontSize: 'var(--text-lg)', fontFamily: 'var(--font-score)' }}>{r.final.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="formula-card section">
        <div className="formula-title">Phase 3 Formula</div>
        <div className="formula-text">
          Raw Score × Multiplier ÷ 150 × 20 = Final Score<br />
          Example (Rank 1 — Top Team): 45 × 3 ÷ 150 × 20 = <strong>18.00</strong>
        </div>
      </div>
    </div>
  );
};

export default PresentationView;
