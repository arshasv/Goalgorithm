import React, { useState, useEffect } from 'react';
import { LeaderboardService } from '../../api/leaderboardService';
import { TeamService } from '../../api/teamService';
import { ScoresService } from '../../api/scoresService';
import { useAuth } from '../../contexts/AuthContext';

const formatTeamDisplay = (e) => {
  const code = e.team_code || e.code || '';
  const name = e.team_name || e.name || '';
  return code ? `${code} – ${name}` : name;
};

const fmt2 = (val) => (val != null ? Number(val).toFixed(2) : '0.00');

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

const COLUMN_CONFIG = [
  { key: 'rank', label: 'Rank', render: (e) => e.rank, headerClass: '', cellClass: '' },
  { key: 'team_name', label: 'Team', render: (e) => <strong>{formatTeamDisplay(e)}</strong>, headerClass: '', cellClass: '' },
  { key: 'phase1_score',        label: 'Phase 1',      render: (e) => <span className={`score-num ${scoreColor(e.phase1_score, 60)}`}>{fmt2(e.phase1_score)}</span>, headerClass: '', cellClass: '' },
  { key: 'technical_score',     label: 'Technical',    render: (e) => <span className={`score-num ${scoreColor(e.technical_score, 20)}`}>{fmt2(e.technical_score)}</span>, headerClass: '', cellClass: '' },
  { key: 'presentation_score',  label: 'Presentation', render: (e) => <span className={`score-num ${scoreColor(e.presentation_score, 20)}`}>{fmt2(e.presentation_score)}</span>, headerClass: '', cellClass: '' },
  { key: 'final_score',         label: 'Final Score',  render: (e) => <strong className="score-num" style={{fontSize:'var(--text-lg)'}}>{fmt2(e.final_score)}</strong>, headerClass: '', cellClass: '' },
];

const LeaderboardView = () => {
  const { isOrganizer } = useAuth();
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

  useEffect(() => { loadLeaderboard(); }, []);

  const handleCalculate = async () => {
    if (!window.confirm('Calculate leaderboard from all current scores?')) return;
    setCalculating(true);
    setError('');
    try {
      await LeaderboardService.calculateLeaderboard();
      await loadLeaderboard();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to calculate leaderboard');
    } finally {
      setCalculating(false);
    }
  };

  const topScore = leaderboard.length > 0 ? leaderboard[0].final_score : 0;

  const visibleColumns = leaderboard.length > 0
    ? COLUMN_CONFIG.filter(col => col.key in leaderboard[0])
    : COLUMN_CONFIG;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Leaderboard</h1>
          <p className="page-subtitle">Team rankings and phase scores</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={loadLeaderboard}>🔄 Refresh</button>
          {isOrganizer && (
            <button
              className={`btn btn-primary ${calculating ? 'loading' : ''}`}
              onClick={handleCalculate}
              disabled={calculating}
            >⚡ Calculate</button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error" style={{marginBottom:'var(--space-md)'}}>{error}</div>}

      {loading ? (
        <div>
          {isOrganizer && (
            <div className="grid-3" style={{marginBottom:'var(--space-xl)'}}>
              <div className="card stat-card">
                <div className="stat-label">Total Teams</div>
                <div className="stat-value" style={{fontFamily:'var(--font-score)',fontSize:'var(--text-4xl)'}}><div className="skeleton skeleton-text" style={{width:'60%'}}></div></div>
              </div>
              <div className="card stat-card">
                <div className="stat-label">Top Score</div>
                <div className="stat-value" style={{fontFamily:'var(--font-score)',fontSize:'var(--text-4xl)'}}><div className="skeleton skeleton-text" style={{width:'40%'}}></div></div>
              </div>
              <div className="card stat-card">
                <div className="stat-label">Top Team</div>
                <div className="stat-value" style={{fontFamily:'var(--font-display)',fontSize:'var(--text-xl)'}}><div className="skeleton skeleton-text" style={{width:'50%'}}></div></div>
              </div>
            </div>
          )}
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏆</div>
          <h2 className="empty-title">No Leaderboard Data</h2>
          <p className="empty-desc">{isOrganizer ? 'Calculate the leaderboard from the Scoring Engine page.' : 'Leaderboard data will appear once the organizer calculates it.'}</p>
        </div>
      ) : (
        <>
          {isOrganizer && (
            <div className="grid-3" style={{marginBottom:'var(--space-xl)'}}>
              <div className="card stat-card">
                <div className="stat-label">Total Teams</div>
                <div className="stat-value" style={{fontFamily:'var(--font-score)',fontSize:'var(--text-4xl)'}}>{leaderboard.length}</div>
              </div>
              <div className="card stat-card">
                <div className="stat-label">Top Score</div>
                <div className="stat-value" style={{fontFamily:'var(--font-score)',fontSize:'var(--text-4xl)'}}>{fmt2(topScore)}</div>
              </div>
              <div className="card stat-card">
                <div className="stat-label">Top Team</div>
                <div className="stat-value" style={{fontFamily:'var(--font-display)',fontSize:'var(--text-xl)'}}>{leaderboard[0] ? formatTeamDisplay(leaderboard[0]) : '—'}</div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    {visibleColumns.map(col => (
                      <th key={col.key}>{col.label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map(e => {
                    const r = Number(e.rank);
                    const rankClass = r <= 3 ? `rank-${r}` : '';
                    return (
                      <tr key={e.team_id} className={rankClass} style={{cursor:'pointer'}}>
                        {visibleColumns.map(col => (
                          <td key={col.key}>{col.render(e)}</td>
                        ))}
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
