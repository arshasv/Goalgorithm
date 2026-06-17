import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TeamService } from '../../api/teamService';
import { LeaderboardService } from '../../api/leaderboardService';
import { PredictionService } from '../../api/predictionService';
import { ScoresService } from '../../api/scoresService';

const TeamLeaderDashboard = () => {
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [leaderboardEntry, setLeaderboardEntry] = useState(null);
  const [predictions, setPredictions] = useState([]);
  const [scores, setScores] = useState([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [activeTab, setActiveTab] = useState('profile');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const myTeam = await TeamService.getMyTeam();
      setTeam(myTeam);

      const [lbData, predsData, scoresData] = await Promise.all([
        LeaderboardService.getLeaderboard().catch(() => []),
        PredictionService.listPredictions().catch(() => []),
        ScoresService.getMatchBreakdown().catch(() => [])
      ]);

      const myEntry = lbData.find(e => e.team_id === myTeam.id);
      setLeaderboardEntry(myEntry || null);

      const myPreds = predsData.filter(p => p.team_id === myTeam.id);
      setPredictions(myPreds);

      const myMatchScores = [];
      scoresData.forEach(match => {
        const teamScore = match.teams?.find(t => t.team_id === myTeam.id);
        if (teamScore) {
          myMatchScores.push({ match, score: teamScore });
        }
      });
      setScores(myMatchScores);

    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load team dashboard.');
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
        <div className="page-header"><h1 className="page-title">Team Dashboard</h1></div>
        <div style={{display: 'flex', justifyContent: 'center', padding: 'var(--space-xl)'}}>
          <span className="spinner" style={{width: '32px', height: '32px', borderWidth: '4px'}}></span>
        </div>
      </div>
    );
  }

  const renderProfile = () => {
    if (!team) return <p className="empty-desc">No team data available.</p>;
    return (
      <div className="card" style={{maxWidth: '600px'}}>
        <div className="card-header">
          <div className="card-title">
            <div style={{display: 'flex', alignItems: 'center', gap: 'var(--space-sm)'}}>
              <div style={{width: '40px', height: '40px', borderRadius: 'var(--radius-round)', background: 'var(--color-surface-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px'}}>{team.name?.charAt(0).toUpperCase()}</div>
              {team.name}
            </div>
          </div>
        </div>
        <div style={{padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)'}}>
          <div>
            <span style={{display: 'block', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Team Code</span>
            <span style={{fontFamily: 'var(--font-data)', fontSize: 'var(--text-base)'}}>{team.team_id || '—'}</span>
          </div>
          <div>
            <span style={{display: 'block', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Team Name</span>
            <span style={{fontSize: 'var(--text-base)'}}>{team.name || '—'}</span>
          </div>
          <div>
            <span style={{display: 'block', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Team Leader</span>
            <span style={{fontSize: 'var(--text-base)'}}>{team.team_leader_name || '—'}</span>
          </div>
          <div>
            <span style={{display: 'block', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)'}}>Status</span>
            <span className={`badge ${team.is_active ? 'badge-success' : 'badge-error'}`}>{team.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>
    );
  };

  const renderMembers = () => {
    if (!team) return <p className="empty-desc">No team data available.</p>;
    const members = team.members || [];
    return (
      <div className="card">
        <div className="card-header"><div className="card-title">Team Members</div></div>
        <div className="table-wrapper" style={{margin: 'var(--space-md)'}}>
          <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
            <thead><tr><th>Name</th><th>Employee ID</th></tr></thead>
            <tbody>
              {members.length === 0 ? (
                <tr><td colSpan="2" style={{textAlign: 'center', color: 'var(--color-text-muted)'}}>No members added yet</td></tr>
              ) : (
                members.map(m => (
                  <tr key={m.id}>
                    <td>{m.name}</td>
                    <td>{m.employee_id || '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderPredictions = () => {
    if (predictions.length === 0) {
      return (
        <div className="empty-state" style={{padding: 'var(--space-2xl)'}}>
          <div className="empty-icon">📋</div>
          <h3 className="empty-title">No Predictions Yet</h3>
          <p className="empty-desc">Submit predictions from the Match Results page.</p>
        </div>
      );
    }

    return (
      <div className="card">
        <div className="card-header"><span className="card-title">📋 My Predictions</span></div>
        <div className="table-wrapper" style={{margin: 'var(--space-md)'}}>
          <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
            <thead><tr><th>Match</th><th>Predicted Winner</th><th>Scoreline</th><th>Status</th><th>Submitted</th></tr></thead>
            <tbody>
              {predictions.map(p => {
                const mp = p.match_prediction || p;
                const date = p.submitted_at ? new Date(p.submitted_at).toLocaleString() : '—';
                const status = p.status || 'SUBMITTED';
                const statusClass = status === 'VALIDATED' || status === 'SCORED' ? 'badge-success' : status === 'INVALID' ? 'badge-error' : 'badge-warning';
                
                return (
                  <tr key={p.id}>
                    <td style={{fontFamily: 'var(--font-data)', fontSize: 'var(--text-xs)'}}>{p.match_id}</td>
                    <td style={{textTransform: 'capitalize'}}>{mp.predicted_winner}</td>
                    <td style={{fontFamily: 'var(--font-score)', fontWeight: 600}}>{mp.predicted_scoreline?.home_team_goals}–{mp.predicted_scoreline?.away_team_goals}</td>
                    <td><span className={`badge ${statusClass}`}>{status.replace('_', ' ')}</span></td>
                    <td style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)'}}>{date}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderScores = () => {
    if (scores.length === 0 && !leaderboardEntry) {
      return (
        <div className="empty-state" style={{padding: 'var(--space-2xl)'}}>
          <div className="empty-icon">🏆</div>
          <h3 className="empty-title">No Scores Yet</h3>
          <p className="empty-desc">Scores will appear once matches are scored by the Organizer.</p>
        </div>
      );
    }

    return (
      <div>
        {leaderboardEntry && (
          <div className="card" style={{marginBottom: 'var(--space-lg)'}}>
            <div className="card-header"><span className="card-title">🏆 Overall Standings</span></div>
            <div className="table-wrapper" style={{margin: 'var(--space-md)'}}>
              <table style={{width: '100%', textAlign: 'left', borderCollapse: 'collapse'}}>
                <thead><tr><th>Rank</th><th>Phase 1</th><th>Technical</th><th>Presentation</th><th>Final Score</th></tr></thead>
                <tbody>
                  <tr>
                    <td><span className={`rank-badge ${leaderboardEntry.rank <= 3 ? `rank-${leaderboardEntry.rank}` : ''}`}>{leaderboardEntry.rank}</span></td>
                    <td><span className="score-num">{leaderboardEntry.phase1_score.toFixed(1)}/60</span></td>
                    <td><span className="score-num">{leaderboardEntry.technical_score.toFixed(1)}/20</span></td>
                    <td><span className="score-num">{leaderboardEntry.presentation_score.toFixed(1)}/20</span></td>
                    <td><strong className="score-num" style={{fontSize: 'var(--text-lg)'}}>{leaderboardEntry.final_score.toFixed(1)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}

        {scores.length > 0 && (
          <div className="card">
            <div className="card-header"><span className="card-title">⚽ Match-wise Scores</span></div>
            <div style={{padding: 'var(--space-md)'}}>
              {scores.map(({ match, score }) => {
                const sc = score.score_breakdown || {};
                return (
                  <div key={match.match_id} className="card" style={{marginBottom: 'var(--space-sm)', padding: 'var(--space-md)', background: 'var(--color-surface-secondary)'}}>
                    <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)'}}>
                      <span style={{fontWeight: 600}}>Match {match.match_number}</span>
                      <span className="badge badge-info">{match.home_team_name} vs {match.away_team_name}</span>
                    </div>
                    <div style={{display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 'var(--space-sm)', textAlign: 'center'}}>
                      <div><div style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)'}}>Winner</div><div className="score-digit">{sc.winner_points ?? '—'}/5</div></div>
                      <div><div style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)'}}>Scoreline</div><div className="score-digit">{sc.scoreline_points ?? '—'}/10</div></div>
                      <div><div style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)'}}>Probability</div><div className="score-digit">{sc.probability_points ?? '—'}/5</div></div>
                      <div><div style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)'}}>Player</div><div className="score-digit">{sc.player_points ?? '—'}/5</div></div>
                      <div><div style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)'}}>Base Score</div><div className="score-digit" style={{fontWeight: 700}}>{sc.base_score ?? '—'}/25</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Team Dashboard</h1>
          <p className="page-subtitle">Manage your team, predictions, and view results</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={loadDashboard}>🔄 Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{marginBottom: 'var(--space-md)'}}>{error}</div>}

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 'var(--space-lg)', marginBottom: 'var(--space-xl)'}}>
        <div className="card stat-card">
          <div className="stat-label">Team Rank</div>
          <div className="stat-value" style={{fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)'}}>
            {leaderboardEntry ? `#${leaderboardEntry.rank}` : '—'}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total Score</div>
          <div className="stat-value" style={{fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)'}}>
            {leaderboardEntry ? leaderboardEntry.final_score.toFixed(1) : '—'}
          </div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Predictions</div>
          <div className="stat-value" style={{fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)'}}>{predictions.length}</div>
        </div>
      </div>

      <div>
        <div className="tabs" style={{marginBottom: 'var(--space-lg)', display: 'flex', gap: 'var(--space-sm)'}}>
          <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Team Profile</button>
          <button className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Members</button>
          <button className={`tab-btn ${activeTab === 'predictions' ? 'active' : ''}`} onClick={() => setActiveTab('predictions')}>My Predictions</button>
          <button className={`tab-btn ${activeTab === 'scores' ? 'active' : ''}`} onClick={() => setActiveTab('scores')}>Match Scores</button>
        </div>

        <div>
          {activeTab === 'profile' && renderProfile()}
          {activeTab === 'members' && renderMembers()}
          {activeTab === 'predictions' && renderPredictions()}
          {activeTab === 'scores' && renderScores()}
        </div>
      </div>
    </div>
  );
};

export default TeamLeaderDashboard;
