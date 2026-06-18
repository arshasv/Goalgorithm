import React, { useState, useEffect } from 'react';
import { ScoringService } from '../../api/scoringService';
import { TeamService } from '../../api/teamService';

const getTotalColor = (v) => {
  if (v === 20) return { color: 'var(--color-status-success)' };
  if (v < 10) return { color: 'var(--color-status-error)' };
  return {};
};

const formatTeamDisplay = (t) => {
  const code = t.team_code || t.code || t.team_id || '';
  const name = t.name || t.team_name || '';
  return code ? `${code} – ${name}` : name;
};

const TechnicalView = () => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadTeams = async () => {
    setLoading(true);
    try {
      const data = await TeamService.listTeams();
      setTeams(data.map(t => ({
        ...t,
        code: 0,
        backend: 0,
        teamwork: 0,
        ai: 0,
      })));
    } catch (err) {
      setError('Failed to load teams: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeams(); }, []);

  const getTotal = (t) => t.code + t.backend + t.teamwork + t.ai;

  const updateTeam = (teamIndex, field, value) => {
    const v = Math.max(0, Math.min(5, value === '' ? 0 : parseInt(value, 10) || 0));
    setTeams(prev => {
      const next = prev.map((t, i) => i === teamIndex ? { ...t, [field]: v } : t);
      return next;
    });
  };

  const handleReset = () => {
    setTeams(prev => prev.map(t => ({ ...t, code: 0, backend: 0, teamwork: 0, ai: 0 })));
  };

  const handleSubmit = async () => {
    if (!window.confirm('Submit Phase 2 technical scores for all teams?')) return;
    for (const t of teams) {
      const payload = {
        team_id: t.id,
        code_quality: t.code,
        backend_quality: t.backend,
        teamwork: t.teamwork,
        ai_explanation: t.ai,
      };
      try {
        await ScoringService.calculateTechnical(payload);
      } catch (e) {
        alert(`Failed for ${formatTeamDisplay(t)}: ${e.response?.data?.detail || e.message}`);
        return;
      }
    }
    alert('Technical scores submitted successfully!');
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">💻 Technical Evaluation</h1>
          <p className="page-subtitle">Phase 2 · Committee Score Entry · 4 sub-dimensions × 5 points = 20 total</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-ghost btn-sm" onClick={handleReset}>↺ Reset</button>
          <button className="btn btn-primary" onClick={handleSubmit} disabled={teams.length === 0}>✓ Submit All Technical Scores</button>
        </div>
      </div>
      
      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

      <div className="alert alert-info" style={{ marginBottom: 'var(--space-md)' }}>
        ℹ️ Enter integer scores 0–5 for each sub-dimension. Live total auto-calculates per team.
      </div>

      <div className="card section">
        <div className="card-header"><span className="card-title">📝 Score Entry Form</span></div>
        {loading ? (
          <div style={{ padding: 'var(--space-md)' }}>Loading teams...</div>
        ) : teams.length === 0 ? (
          <div className="empty-state">No teams found.</div>
        ) : (
          <div className="table-wrapper">
            <table id="tech-form-table">
              <thead>
                <tr>
                  <th>Team</th>
                  <th className="score-header">Code Quality /5</th>
                  <th className="score-header">Backend Quality /5</th>
                  <th className="score-header">Teamwork /5</th>
                  <th className="score-header">AI Explanation /5</th>
                  <th className="score-header">Total /20</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((t, i) => {
                  const total = getTotal(t);
                  return (
                    <tr key={t.id} style={{ animation: `fadeIn ${300 + i * 80}ms var(--ease-out) both` }}>
                      <td style={{ fontWeight: 600, fontFamily: 'var(--font-display)', textTransform: 'uppercase' }}>
                        {formatTeamDisplay(t)}
                      </td>
                      {['code', 'backend', 'teamwork', 'ai'].map(field => (
                        <td key={field} className="score-cell">
                          <input
                            className="form-input score-input"
                            type="number"
                            min="0"
                            max="5"
                            value={t[field]}
                            onChange={e => updateTeam(i, field, e.target.value)}
                          />
                        </td>
                      ))}
                      <td className="score-cell">
                        <span style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-2xl)', fontWeight: 700, ...getTotalColor(total) }}>
                          {total}
                        </span>
                        <span style={{ color: 'var(--color-text-secondary)' }}>/20</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default TechnicalView;
