import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeamService } from '../../api/teamService';
import { LeaderboardService } from '../../api/leaderboardService';
import { MatchService } from '../../api/matchService';

const OrganizerDashboard = () => {
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    teamsCount: 0,
    matchesCount: 0,
    topScore: 0,
    scoredTeams: 0
  });
  const [leaderboard, setLeaderboard] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const [teamsData, leaderboardData, matchesData] = await Promise.all([
        TeamService.listTeams().catch(() => []),
        LeaderboardService.getLeaderboard().catch(() => []),
        MatchService.listMatches().catch(() => [])
      ]);

      setTeams(teamsData);
      setLeaderboard(leaderboardData);

      setStats({
        teamsCount: teamsData.length,
        matchesCount: matchesData.length,
        topScore: leaderboardData.length > 0 ? leaderboardData[0].final_score : 0,
        scoredTeams: leaderboardData.filter(e => e.final_score > 0).length
      });
    } catch (err) {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Organizer Dashboard</h1>
        </div>
        <div style={{display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)'}}>
          <span className="spinner" style={{width: '32px', height: '32px', borderWidth: '4px'}}></span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Organizer Dashboard</h1>
          <p className="page-subtitle">Tournament overview, team stats, and quick actions</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={loadDashboard}>🔄 Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{marginBottom: 'var(--space-md)'}}>{error}</div>}

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)'}}>
        <div className="card stat-card">
          <div className="stat-label">Registered Teams</div>
          <div className="stat-value" style={{fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)'}}>{stats.teamsCount}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total Matches</div>
          <div className="stat-value" style={{fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)'}}>{stats.matchesCount}</div>
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

      <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)'}}>
        <div className="card">
          <div className="card-header">
            <div className="card-title">🏆 Leaderboard Top 5</div>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/leaderboard')}>View All</button>
          </div>
          {leaderboard.length === 0 ? (
            <div style={{padding: 'var(--space-lg)', textAlign: 'center', color: 'var(--color-text-muted)'}}>No leaderboard data yet</div>
          ) : (
            <div className="table-wrapper">
              <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
                <thead><tr><th>Rank</th><th>Team</th><th>Score</th></tr></thead>
                <tbody>
                  {leaderboard.slice(0, 5).map(e => (
                    <tr key={e.team_id}>
                      <td><span className={`rank-badge ${e.rank <= 3 ? `rank-${e.rank}` : ''}`}>{e.rank}</span></td>
                      <td>{e.team_name || e.team_code}</td>
                      <td><strong>{e.final_score.toFixed(1)}</strong></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                <div key={t.id} style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 'var(--space-sm) 0', borderBottom: '1px solid var(--color-border)'}}>
                  <span style={{display: 'flex', alignItems: 'center', gap: 'var(--space-xs)'}}>
                    <div style={{width: '24px', height: '24px', borderRadius: 'var(--radius-round)', background: 'var(--color-surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px'}}>{(t.name || t.team_id).charAt(0).toUpperCase()}</div>
                    {t.name || t.team_id}
                  </span>
                  <span className={`badge ${t.is_active ? 'badge-success' : 'badge-error'}`}>{t.is_active ? 'Active' : 'Inactive'}</span>
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
          <button className="btn btn-primary" onClick={() => navigate('/leaderboard')}>View Leaderboard</button>
        </div>
      </div>
    </div>
  );
};

export default OrganizerDashboard;
