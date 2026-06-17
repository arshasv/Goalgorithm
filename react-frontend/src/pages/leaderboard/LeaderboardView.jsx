import React, { useState, useEffect } from 'react';
import { LeaderboardService } from '../../api/leaderboardService';
import { TeamService } from '../../api/teamService';
import { useAuth } from '../../contexts/AuthContext';

const LeaderboardView = () => {
  const { user } = useAuth();
  const isOrganizer = user?.role === 'ORGANIZER';

  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [calculating, setCalculating] = useState(false);
  const [error, setError] = useState('');

  const loadLeaderboard = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await LeaderboardService.getLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const handleCalculate = async () => {
    if (!window.confirm('Calculate leaderboard from all current scores?')) return;
    setCalculating(true);
    setError('');
    try {
      const teams = await TeamService.listTeams();
      const entries = teams.map(t => ({
        team_id: t.id,
        phase1_score: 0,
        technical_score: 0,
        presentation_score: 0
      }));
      // Note: Phase 7 is just setting up the leaderboard integration.
      // Since Phase 1/Tech/Pres scores aren't available yet, we push 0s or let backend compute if it auto-aggregates.
      await LeaderboardService.calculateLeaderboard(entries);
      await loadLeaderboard();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to calculate leaderboard');
    } finally {
      setCalculating(false);
    }
  };

  const getScoreColor = (score, max) => {
    const ratio = score / max;
    if (ratio >= 0.8) return 'color: var(--color-status-success)';
    if (ratio >= 0.5) return 'color: var(--color-status-warning)';
    return 'color: var(--color-status-error)';
  };

  const getRankBadge = (rank) => {
    if (rank === 1) return <span className="rank-badge rank-1">🥇 1st</span>;
    if (rank === 2) return <span className="rank-badge rank-2">🥈 2nd</span>;
    if (rank === 3) return <span className="rank-badge rank-3">🥉 3rd</span>;
    return <span className="rank-badge">{rank}th</span>;
  };

  const topScore = leaderboard.length > 0 ? leaderboard[0].final_score : 0;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">🏆 Leaderboard</h1>
          <p className="page-subtitle">Team rankings and phase scores</p>
        </div>
        <div className="page-header-actions" style={{display: 'flex', gap: 'var(--space-md)'}}>
          <button className="btn btn-secondary" onClick={loadLeaderboard}>🔄 Refresh</button>
          {isOrganizer && (
            <button 
              className={`btn btn-primary ${calculating ? 'loading' : ''}`} 
              onClick={handleCalculate}
              disabled={calculating}
            >
              <span>{calculating ? 'Calculating...' : '⚡ Calculate'}</span>
              {calculating && <span className="spinner"></span>}
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{marginBottom: 'var(--space-md)'}}>{error}</div>}

      {loading ? (
        <div style={{display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)'}}>
          <span className="spinner" style={{width: '32px', height: '32px', borderWidth: '4px'}}></span>
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h2 className="empty-title">No Leaderboard Data</h2>
          <p className="empty-desc">
            {isOrganizer ? 'Calculate the leaderboard from the current scores.' : 'Leaderboard data will appear once the organizer calculates it.'}
          </p>
        </div>
      ) : (
        <>
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)'}}>
            <div className="card stat-card">
              <div className="stat-label">Total Teams</div>
              <div className="stat-value" style={{fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)'}}>{leaderboard.length}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Top Score</div>
              <div className="stat-value" style={{fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)'}}>{topScore.toFixed(1)}</div>
            </div>
            <div className="card stat-card">
              <div className="stat-label">Top Team</div>
              <div className="stat-value" style={{fontFamily: 'var(--font-display)', fontSize: 'var(--text-xl)'}}>
                {leaderboard[0] ? (leaderboard[0].team_name || leaderboard[0].team_code) : '—'}
              </div>
            </div>
          </div>

          <div className="card">
            <div className="table-wrapper">
              <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>Team</th>
                    <th>Phase 1</th>
                    <th>Technical</th>
                    <th>Presentation</th>
                    <th>Final Score</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((e) => {
                    const rankClass = e.rank <= 3 ? `rank-${e.rank}` : '';
                    return (
                      <tr key={e.team_id} className={rankClass} style={{cursor: 'pointer'}}>
                        <td>{e.rank}</td>
                        <td><strong>{e.team_name || e.team_code}</strong></td>
                        <td><span className="score-num" style={{color: e.phase1_score >= 48 ? 'var(--color-status-success)' : 'inherit'}}>{e.phase1_score.toFixed(1)}</span></td>
                        <td><span className="score-num">{e.technical_score.toFixed(1)}</span></td>
                        <td><span className="score-num">{e.presentation_score.toFixed(1)}</span></td>
                        <td><strong className="score-num" style={{fontSize: 'var(--text-lg)'}}>{e.final_score.toFixed(1)}</strong></td>
                        <td>{getRankBadge(e.rank)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default LeaderboardView;
