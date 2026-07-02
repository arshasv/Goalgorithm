import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeamService } from '../../api/teamService';
import { LeaderboardService } from '../../api/leaderboardService';
import { PredictionService } from '../../api/predictionService';

const formatTeamDisplay = (team) => {
  if (!team) return '—';
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let code = team.team_code || team.team_id || team.code || '';
  let name = team.name || team.team_name || '';
  if (code && UUID_RE.test(code)) code = '';
  if (code) return `Team ${code.toUpperCase()} — ${name || `Team ${code.toUpperCase()}`}`;
  return name || '—';
};

const TeamBadge = ({ name, size = 32 }) => {
  const initials = (name || 'T').substring(0, 2).toUpperCase();
  const colors = ['#2563EB', '#38BDF8', '#14B8A6', '#8B5CF6', '#F59E0B'];
  const idx = (name || '').length % colors.length;
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700, fontFamily: 'var(--font-display)', flexShrink: 0, border: `2px solid ${colors[idx]}40`, background: `${colors[idx]}20`, color: colors[idx] }}>
      {initials}
    </div>
  );
};

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ teamsCount: 0, predictionsCount: 0, topScore: 0, scoredTeams: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrgDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [teamsData, leaderboardData, predictionsData] = await Promise.all([
        TeamService.listTeams().catch(() => []),
        LeaderboardService.getLeaderboard().catch(() => []),
        PredictionService.listPredictions().catch(() => [])
      ]);
      setTeams(teamsData);
      setLeaderboard(leaderboardData);
      setStats({
        teamsCount: teamsData.length,
        predictionsCount: predictionsData.length,
        topScore: leaderboardData.length > 0 ? leaderboardData[0].final_score : 0,
        scoredTeams: leaderboardData.filter(e => e.final_score > 0).length
      });
    } catch (err) {
      setError('Failed to load dashboard: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadOrgDashboard(); }, []);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Organizer Dashboard</h1>
          <p className="page-subtitle">Tournament overview, team stats, and quick actions</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={loadOrgDashboard}>🔄 Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{marginBottom: 'var(--space-md)'}}>{error}</div>}

      {loading ? (
        <div id="org-dash-content" dangerouslySetInnerHTML={{ __html: Array(4).fill(0).map(() => 
          `<div class="card"><div class="skeleton skeleton-title"></div><div class="skeleton skeleton-text" style="margin-top:var(--space-md)"></div><div class="skeleton skeleton-card" style="margin-top:var(--space-md)"></div></div>`
        ).join('') }} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-lg)' }} />
      ) : (
        <div id="org-dash-content">
          <div className="grid-4" style={{marginBottom: 'var(--space-xl)'}}>
            <div className="card stat-card">
              <div className="stat-label">Registered Teams</div>
              <div className="stat-value" style={{fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)'}}>{stats.teamsCount}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Total Predictions</div>
              <div className="stat-value" style={{fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)'}}>{stats.predictionsCount}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Top Score</div>
              <div className="stat-value" style={{fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)'}}>{stats.topScore.toFixed(1)}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Scored Teams</div>
              <div className="stat-value" style={{fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)'}}>{stats.scoredTeams}</div>
            </div>
          </div>

          <div className="grid-2" style={{marginBottom: 'var(--space-xl)'}}>
            <div className="card">
              <div className="card-header">
                <div className="card-title">🏆 Leaderboard Top 5</div>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leaderboard')}>View All</button>
              </div>
              {leaderboard.length === 0 ? (
                <div style={{padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--color-text-muted)'}}>No leaderboard data yet</div>
              ) : (
                <div className="table-wrapper"><table><thead><tr><th>Rank</th><th>Team</th><th>Score</th></tr></thead><tbody>
                  {leaderboard.slice(0, 5).map((e, i) => (
                    <tr key={i}>
                      <td>
                        {Number(e.rank) === 1 ? <div className="rank-badge rank-badge-1">🏆</div> : Number(e.rank) === 2 ? <div className="rank-badge rank-badge-2">🥈</div> : Number(e.rank) === 3 ? <div className="rank-badge rank-badge-3">🥉</div> : <div className="rank-badge rank-badge-n">#{e.rank}</div>}
                      </td>
                      <td>{formatTeamDisplay(e)}</td>
                      <td><strong>{(e.final_score || 0).toFixed(1)}</strong></td>
                    </tr>
                  ))}
                </tbody></table></div>
              )}
            </div>

            <div className="card">
              <div className="card-header">
                <div className="card-title">👥 Recent Teams</div>
                <button className="btn btn-ghost btn-sm" onClick={() => navigate('/teams')}>View All</button>
              </div>
              {teams.length === 0 ? (
                <div style={{padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--color-text-muted)'}}>No teams registered</div>
              ) : (
                <div style={{padding: 'var(--space-md)'}}>
                  {teams.slice(0, 5).map(t => (
                    <div key={t.id} className="activity-item" style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) 0'}}>
                      <span style={{display: 'flex', alignItems: 'center', gap: 'var(--space-xs)'}}>
                        <TeamBadge name={t.name || t.team_name} size={32} /> {formatTeamDisplay(t)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="card-title">⚡ Quick Actions</div>
            </div>
            <div style={{padding: 'var(--space-md)', display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap'}}>
              <button className="btn btn-primary" onClick={() => navigate('/matches')}>Manage Matches</button>
              <button className="btn btn-primary" onClick={() => navigate('/technical')}>Technical Evaluation</button>
              <button className="btn btn-primary" onClick={() => navigate('/presentation')}>Presentation Evaluation</button>
              <button className="btn btn-primary" onClick={() => navigate('/leaderboard')}>View Leaderboard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizerDashboard;
