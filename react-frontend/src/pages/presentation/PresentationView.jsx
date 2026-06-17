import React, { useState } from 'react';

const initialPresData = [
  { team: 'A', name: 'Team A', ai_exp: 18, qa: 13, delivery: 14 },
  { team: 'B', name: 'Team B', ai_exp: 15, qa: 12, delivery: 12 },
  { team: 'C', name: 'Team C', ai_exp: 14, qa: 11, delivery: 11 },
  { team: 'D', name: 'Team D', ai_exp: 10, qa: 8, delivery: 9 },
  { team: 'E', name: 'Team E', ai_exp: 7, qa: 5, delivery: 6 },
];

const rankBadge = (rank) => {
  if (rank === 1) return <span className="rank-badge rank-badge-1">🏆</span>;
  if (rank === 2) return <span className="rank-badge rank-badge-2">🥈</span>;
  if (rank === 3) return <span className="rank-badge rank-badge-3">🥉</span>;
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

const PresentationView = () => {
  const [teams, setTeams] = useState(initialPresData.map(t => ({ ...t })));
  const [results, setResults] = useState(null);

  const getRawTotal = (t) => t.ai_exp + t.qa + t.delivery;

  const updateTeam = (index, field, value, max) => {
    const v = Math.max(0, Math.min(max, value === '' ? 0 : parseInt(value, 10) || 0));
    setTeams(prev => prev.map((t, i) => i === index ? { ...t, [field]: v } : t));
  };

  const handleSubmit = async () => {
    if (!window.confirm('Submit Phase 3 presentation scores for all 5 teams?')) return;

    const payload = teams.map(t => ({
      team_id: t.team,
      ai_explanation_score: t.ai_exp,
      qa_score: t.qa,
      delivery_score: t.delivery,
    }));

    const ranked = payload.map(p => {
      const raw = p.ai_explanation_score + p.qa_score + p.delivery_score;
      return { ...p, raw };
    }).sort((a, b) => b.raw - a.raw).map((p, i) => {
      const rank = i + 1;
      const mult = rank === 1 ? 3 : rank === payload.length ? 1 : 2;
      const grade = rank === 1 ? 'A' : rank === payload.length ? 'C' : 'B';
      const finalScore = ((p.raw * mult) / 150) * 20;
      const pt = teams.find(t => t.team === p.team_id);
      return { ...p, rank, mult, grade, final: finalScore, teamLabel: pt ? `Team ${pt.team}` : p.team_id };
    });

    setResults(ranked);
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">🎤 Presentation Evaluation</h1>
          <p className="page-subtitle">Phase 3 · Peer Review · AI Explanation /20 + Q&A /15 + Delivery /15 = Raw /50 → Normalized /20</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-primary" onClick={handleSubmit}>✓ Submit All Presentation Scores</button>
        </div>
      </div>
      <div className="alert alert-info">ℹ️ Scores are ranked and graded (A/B/C). Formula: Raw × Multiplier ÷ 150 × 20 = Final Score</div>
      <div className="card section">
        <div className="card-header"><span className="card-title">📝 Score Entry</span></div>
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
                  <tr key={t.team} style={{ animation: `fadeIn ${300 + i * 80}ms var(--ease-out) both` }}>
                    <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>Team {t.team}</td>
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
