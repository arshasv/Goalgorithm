import React, { useState, useEffect } from 'react';
import { TeamService } from '../../api/teamService';
import { LeaderboardService } from '../../api/leaderboardService';
import { PredictionService } from '../../api/predictionService';
import { ScoresService } from '../../api/scoresService';
import { MatchService } from '../../api/matchService';
import { ScoringConfigService } from '../../api/scoringConfigService';
import { useAuth } from '../../contexts/AuthContext';

const formatTeamDisplay = (e) => {
  const code = e.team_id || e.code || '';
  const name = e.team_name || e.name || '';
  return code ? `${code} – ${name}` : name;
};

const fmt1 = (val) => (val != null ? Number(val).toFixed(1) : '0.0');

const rankBadge = (rank) => {
  const r = Number(rank);
  if (r === 1) return <span className="rank-badge rank-badge-1">🏆</span>;
  if (r === 2) return <span className="rank-badge rank-badge-2">🥈</span>;
  if (r === 3) return <span className="rank-badge rank-badge-3">🥉</span>;
  return <span className="rank-badge rank-badge-n">#{rank}</span>;
};

const teamBadge = (name, size) => {
  const initial = (name || '?').charAt(0).toUpperCase();
  return (
    <div style={{
      width: size,
      height: size,
      borderRadius: 'var(--radius-round)',
      background: 'var(--color-surface-secondary)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: Math.round(size * 0.45),
      fontWeight: 700,
      color: 'var(--color-text-primary)'
    }}>{initial}</div>
  );
};

const TeamLeaderDashboard = () => {
  const { isOrganizer } = useAuth();
  const [team, setTeam] = useState(null);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [matches, setMatches] = useState([]);
  const [scores, setScores] = useState([]);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('profile');
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editMemberId, setEditMemberId] = useState(null);
  const [addName, setAddName] = useState('');
  const [addEmployeeId, setAddEmployeeId] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmployeeId, setEditEmployeeId] = useState('');

  const loadDashboard = async () => {
    setLoading(true);
    setError('');
    try {
      const myTeam = await TeamService.getMyTeam();
      setTeam(myTeam);

      const [lbData, predsData, scoresData, matchesData, configData] = await Promise.all([
        LeaderboardService.getLeaderboard().catch(() => []),
        PredictionService.listPredictions().catch(() => []),
        ScoresService.getMatchBreakdown().catch(() => []),
        MatchService.listMatches().catch(() => []),
        ScoringConfigService.getActiveConfig().catch(() => null)
      ]);
      setLeaderboardData(lbData);
      setMatches(Array.isArray(matchesData) ? matchesData : []);
      setConfig(configData);

      const myEntry = lbData.find(e => e.team_id === myTeam.id);
      const myPreds = predsData.filter(p => p.team_id === myTeam.id);
      setPredictions(myPreds);

      const myMatchScores = [];
      scoresData.forEach(match => {
        const teamScore = match.teams?.find(t => t.team_id === myTeam.id);
        if (teamScore) myMatchScores.push({ match, score: teamScore });
      });
      setScores(myMatchScores);
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to load team dashboard.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const handleRefresh = () => { loadDashboard(); };

  const myEntry = leaderboardData.find(e => e.team_id === team?.id);
  const myRank = myEntry?.rank;

  const renderProfile = () => {
    if (!team) return <p className="empty-desc">No team data available.</p>;
    return (
      <div className="card" style={{ maxWidth: '600px' }}>
        <div className="card-header">
          <div className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
            {teamBadge(team.name, 40)} {formatTeamDisplay(team)}
          </div>
          {isOrganizer && <button className="btn btn-secondary btn-sm" onClick={() => {
            const newName = window.prompt('Team Name', team.name || '');
            if (newName && newName.trim()) {
              TeamService.updateTeam(team.id, { name: newName.trim(), team_leader_name: team.team_leader_name }).then(() => {
                window.alert('Team updated');
                loadDashboard();
              }).catch(err => {
                window.alert('Failed to update team: ' + err.message);
              });
            }
          }}>✏️ Edit Team</button>}
        </div>
        <div style={{ padding: 'var(--space-lg)', display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
          <div>
            <span style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Team Code</span>
            <span style={{ fontFamily: 'var(--font-data)', fontSize: 'var(--text-base)' }}>{team.team_id || team.code || '—'}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Team Name</span>
            <span style={{ fontSize: 'var(--text-base)' }}>{team.name || '—'}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Team Leader</span>
            <span style={{ fontSize: 'var(--text-base)' }}>{team.team_leader_name || '—'}</span>
          </div>
          <div>
            <span style={{ display: 'block', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Status</span>
            <span className={`badge ${team.is_active ? 'badge-success' : 'badge-error'}`}>{team.is_active ? 'Active' : 'Inactive'}</span>
          </div>
        </div>
      </div>
    );
  };

  const handleAddMember = async () => {
    const name = addName.trim();
    if (!name) { window.alert('Name is required'); return; }
    try {
      await TeamService.addTeamMemberAdmin(team.id, { name, employee_id: addEmployeeId.trim() || null });
      window.alert('Member added');
      setShowAddForm(false);
      setAddName('');
      setAddEmployeeId('');
      loadDashboard();
    } catch (err) {
      window.alert(err.message || 'Failed to add member');
    }
  };

  const handleEditMember = async () => {
    const name = editName.trim();
    if (!name) { window.alert('Name is required'); return; }
    try {
      await TeamService.updateTeamMemberAdmin(team.id, editMemberId, { name, employee_id: editEmployeeId.trim() || null });
      window.alert('Member updated');
      setShowEditForm(false);
      setEditMemberId(null);
      setEditName('');
      setEditEmployeeId('');
      loadDashboard();
    } catch (err) {
      window.alert(err.message || 'Failed to update member');
    }
  };

  const handleRemoveMember = (memberId) => {
    if (!window.confirm('Remove this team member?')) return;
    TeamService.removeTeamMemberAdmin(team.id, memberId).then(() => {
      window.alert('Member removed');
      loadDashboard();
    }).catch(err => {
      window.alert(err.message || 'Failed to remove member');
    });
  };

  const renderMembers = () => {
    if (!team) return <p className="empty-desc">No team data available.</p>;
    const members = team.members || [];
    const canManage = isOrganizer;
    return (
      <>
        <div className="card" id="td-members-card">
          <div className="card-header">
            <div className="card-title">Team Members</div>
            {canManage && <button className="btn btn-primary btn-sm" onClick={() => setShowAddForm(true)}>+ Add Member</button>}
          </div>
          <div className="table-wrapper" style={{ margin: 'var(--space-md)' }}>
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Employee ID</th>
                  {canManage && <th style={{ textAlign: 'right', width: '100px' }}></th>}
                </tr>
              </thead>
              <tbody>
                {members.length === 0 ? (
                  <tr><td colSpan={canManage ? 3 : 2} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No members added yet</td></tr>
                ) : (
                  members.map(m => (
                    <tr key={m.id}>
                      <td>{m.name}</td>
                      <td>{m.employee_id || '—'}</td>
                      {canManage && (
                        <td style={{ textAlign: 'right' }}>
                          <button className="btn btn-ghost btn-sm" title="Edit Member" onClick={() => {
                            setEditMemberId(m.id);
                            setEditName(m.name);
                            setEditEmployeeId(m.employee_id || '');
                            setShowEditForm(true);
                            setShowAddForm(false);
                          }}>✏️</button>
                          <button className="btn btn-ghost btn-sm" title="Remove Member" onClick={() => handleRemoveMember(m.id)}>🗑️</button>
                        </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        {showAddForm && (
          <div className="card" style={{ maxWidth: '500px', marginTop: 'var(--space-md)' }}>
            <div className="card-header"><div className="card-title">Add Team Member</div></div>
            <div style={{ padding: 'var(--space-lg)' }}>
              <div className="form-group"><label className="form-label">Name *</label><input className="form-input" placeholder="Full name" value={addName} onChange={e => setAddName(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Employee ID</label><input className="form-input" placeholder="Employee ID (optional)" value={addEmployeeId} onChange={e => setAddEmployeeId(e.target.value)} /></div>
              <button className="btn btn-primary" onClick={handleAddMember}>Add Member</button>
              <button className="btn btn-ghost" onClick={() => { setShowAddForm(false); setAddName(''); setAddEmployeeId(''); }}>Cancel</button>
            </div>
          </div>
        )}
        {showEditForm && (
          <div className="card" style={{ maxWidth: '500px', marginTop: 'var(--space-md)' }}>
            <div className="card-header"><div className="card-title">Edit Team Member</div></div>
            <div style={{ padding: 'var(--space-lg)' }}>
              <div className="form-group"><label className="form-label">Name *</label><input className="form-input" value={editName} onChange={e => setEditName(e.target.value)} /></div>
              <div className="form-group"><label className="form-label">Employee ID</label><input className="form-input" value={editEmployeeId} onChange={e => setEditEmployeeId(e.target.value)} /></div>
              <button className="btn btn-primary" onClick={handleEditMember}>Save Changes</button>
              <button className="btn btn-ghost" onClick={() => { setShowEditForm(false); setEditMemberId(null); setEditName(''); setEditEmployeeId(''); }}>Cancel</button>
            </div>
          </div>
        )}
      </>
    );
  };

  const renderPredictions = () => {
    // Build match label lookup from loaded matches
    const matchById = {};
    matches.forEach(m => {
      matchById[m.id] = m;
      if (m.match_number) matchById[`M${m.match_number}`] = m;
    });

    if (predictions.length === 0) {
      return (
        <div className="empty-state" style={{ padding: 'var(--space-2xl)' }}>
          <div className="empty-icon">📋</div>
          <h3 className="empty-title">No Predictions Yet</h3>
          <p className="empty-desc">Go to Matches and click "Predict" on any scheduled match.</p>
          <a className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }} href="#/matches">View Matches</a>
        </div>
      );
    }
    return (
      <div className="card">
        <div className="card-header"><span className="card-title">📋 My Predictions</span></div>
        <div className="table-wrapper" style={{ margin: 'var(--space-md)' }}>
          <table>
            <thead><tr><th>Match</th><th>Predicted Winner</th><th>Scoreline</th><th>Status</th><th>Submitted</th></tr></thead>
            <tbody>
              {predictions.map((p, i) => {
                const mp = p.match_prediction || p;
                const winner = mp.predicted_winner || '—';
                const homeG = mp.predicted_scoreline?.home_team_goals ?? '?';
                const awayG = mp.predicted_scoreline?.away_team_goals ?? '?';
                const status = p.status || 'submitted';
                const date = p.submitted_at ? new Date(p.submitted_at).toLocaleString() : '—';
                const statusClass = status === 'VALIDATED' || status === 'scored' ? 'badge-success' : status === 'INVALID' ? 'badge-error' : 'badge-warning';
                // Use enriched match_label from backend, or build from matches list
                const matchObj = matchById[p.match_id];
                const matchLabel = p.match_label
                  || (matchObj ? `M${matchObj.match_number}: ${matchObj.home_team_name} vs ${matchObj.away_team_name}` : p.match_id);
                return (
                  <tr key={p.id || i} style={{ animation: `fadeIn ${300 + i * 60}ms ease-out both` }}>
                    <td style={{ fontSize: 'var(--text-sm)' }}>{matchLabel}</td>
                    <td style={{ textTransform: 'capitalize' }}>{winner}</td>
                    <td style={{ fontFamily: 'var(--font-score)', fontWeight: 600 }}>{homeG}–{awayG}</td>
                    <td><span className={`badge ${statusClass}`}>{status.replace('_', ' ')}</span></td>
                    <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{date}</td>
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
    if (scores.length === 0 && !myEntry) {
      return (
        <div className="empty-state" style={{ padding: 'var(--space-2xl)' }}>
          <div className="empty-icon">🏆</div>
          <h3 className="empty-title">No Scores Yet</h3>
          <p className="empty-desc">Scores will appear once matches are scored.</p>
          <a className="btn btn-primary" style={{ marginTop: 'var(--space-md)' }} href="/leaderboard">View Leaderboard</a>
        </div>
      );
    }
    return (
      <div>
        {myEntry && (
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="card-header"><span className="card-title">🏆 Overall Standings</span></div>
            <div className="table-wrapper" style={{ margin: 'var(--space-md)' }}>
              <table>
                <thead><tr><th>Rank</th><th>Phase 1</th><th>Technical</th><th>Presentation</th><th>Final Score</th></tr></thead>
                <tbody>
                  <tr className={myEntry.rank <= 3 ? `rank-${myEntry.rank}` : ''}>
                    <td>{rankBadge(myEntry.rank)}</td>
                    <td><span className="score-num">{fmt1(myEntry.phase1_score)}/{config?.phase1_max_marks || 60}</span></td>
                    <td><span className="score-num">{fmt1(myEntry.technical_score)}/{config?.technical_max_total || 20}</span></td>
                    <td><span className="score-num">{fmt1(myEntry.presentation_score)}/{config?.presentation_max_marks || 20}</span></td>
                    <td><strong className="score-num" style={{ fontSize: 'var(--text-lg)' }}>{fmt1(myEntry.final_score)}</strong></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        {scores.length > 0 && (
          <div className="card">
            <div className="card-header"><span className="card-title">⚽ Match-wise Scores</span></div>
            <div style={{ padding: 'var(--space-md)' }}>
              {scores.map(({ match, score }) => {
                const sc = score.score_breakdown || {};
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
                  <div key={match.match_id} className="card" style={{ marginBottom: 'var(--space-sm)', padding: 'var(--space-md)', background: 'var(--color-surface-secondary)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-sm)' }}>
                      <span style={{ fontWeight: 600 }}>Match {match.match_number}</span>
                      <span className="badge badge-info">{match.home_team_name} vs {match.away_team_name}</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(12,1fr)', gap: 'var(--space-sm)', textAlign: 'center' }}>
                      <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Winner</div><div className="score-digit">{sc.winner_points ?? '—'}/{maxWinner}</div></div>
                      <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Scoreline</div><div className="score-digit">{sc.scoreline_points ?? '—'}/{maxScoreline}</div></div>
                      <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Prob</div><div className="score-digit">{sc.probability_points ?? '—'}/{maxProbability}</div></div>
                      <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Player</div><div className="score-digit">{sc.player_points ?? '—'}/{maxPlayer}</div></div>
                      <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Tot Goals</div><div className="score-digit">{sc.total_goals_points ?? '—'}/{maxTotalGoals.toFixed(1)}</div></div>
                      <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>BTTS</div><div className="score-digit">{sc.btts_points ?? '—'}/{maxBtts}</div></div>
                      <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>1st Team</div><div className="score-digit">{sc.first_team_to_score_points ?? '—'}/{maxFtts}</div></div>
                      <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Clean Sht</div><div className="score-digit">{sc.clean_sheet_points ?? '—'}/{maxCleanSheet}</div></div>
                      <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Base Score</div><div className="score-digit" style={{ fontWeight: 700 }}>{sc.base_score ?? '—'}/{maxBase.toFixed(1)}</div></div>
                      <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Grade</div><div className="score-digit">{sc.grade ?? '—'}</div></div>
                      <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Mult</div><div className="score-digit">{sc.multiplier != null ? `x${sc.multiplier}` : '—'}</div></div>
                      <div><div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Earned</div><div className="score-digit" style={{ fontWeight: 700, color: 'var(--color-accent)' }}>{sc.earned_points ?? '—'}</div></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div >
    );
  };

  if (loading) {
    return (
      <div>
        <div className="page-header">
          <div className="page-header-left">
            <h1 className="page-title">Team Dashboard</h1>
            <p className="page-subtitle">Manage your team, predictions, and view results</p>
          </div>
          <div className="page-header-actions">
            <button className="btn btn-secondary" onClick={handleRefresh}>🔄 Refresh</button>
          </div>
        </div>
        <div className="grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
          <div className="card stat-card"><div className="stat-label">Team Rank</div><div className="stat-value" style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)' }}><div className="skeleton skeleton-text" style={{ width: '60%' }}></div></div></div>
          <div className="card stat-card"><div className="stat-label">Total Score</div><div className="stat-value" style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)' }}><div className="skeleton skeleton-text" style={{ width: '40%' }}></div></div></div>
          <div className="card stat-card"><div className="stat-label">Predictions</div><div className="stat-value" style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)' }}><div className="skeleton skeleton-text" style={{ width: '30%' }}></div></div></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Team Dashboard</h1>
          <p className="page-subtitle">Manage your team, predictions, and view results</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={handleRefresh}>🔄 Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

      <div className="grid-3" style={{ marginBottom: 'var(--space-xl)' }}>
        <div className="card stat-card">
          <div className="stat-label">Team Rank</div>
          <div className="stat-value" style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)' }}>{myRank ? `#${myRank}` : 'Not yet calculated'}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Total Score</div>
          <div className="stat-value" style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)' }}>{myEntry ? fmt1(myEntry.final_score) : '—'}</div>
        </div>
        <div className="card stat-card">
          <div className="stat-label">Predictions</div>
          <div className="stat-value" style={{ fontFamily: 'var(--font-score)', fontSize: 'var(--text-4xl)' }}>{predictions.length}</div>
        </div>
      </div>

      <div>
        <div className="tabs" style={{ marginBottom: 'var(--space-lg)' }}>
          <button className={`tab-btn ${activeTab === 'profile' ? 'active' : ''}`} onClick={() => setActiveTab('profile')}>Team Profile</button>
          <button className={`tab-btn ${activeTab === 'members' ? 'active' : ''}`} onClick={() => setActiveTab('members')}>Members</button>
          <button className={`tab-btn ${activeTab === 'predictions' ? 'active' : ''}`} onClick={() => setActiveTab('predictions')}>My Predictions ({predictions.length})</button>
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
