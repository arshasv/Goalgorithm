import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TeamService } from '../../api/teamService';
import TeamDetailModal from '../../components/teams/TeamDetailModal';

const TeamBadge = ({ name, size = 40 }) => {
  const initials = (name || 'T').substring(0, 2).toUpperCase();
  const colors = ['#2563EB', '#38BDF8', '#14B8A6', '#8B5CF6', '#F59E0B'];
  const idx = (name || '').length % colors.length;
  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', display: 'flex', alignItems: 'center',
      justifyContent: 'center', fontSize: size * 0.4, fontWeight: 700,
      fontFamily: 'var(--font-display)', flexShrink: 0,
      border: `2px solid ${colors[idx]}40`, background: `${colors[idx]}20`, color: colors[idx]
    }}>
      {initials}
    </div>
  );
};

const TeamsView = () => {
  const { isOrganizer } = useAuth();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [detailTeam, setDetailTeam] = useState(null);

  const membersInputRef = useRef(null);
  const teamsInputRef = useRef(null);

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const teamsData = await TeamService.listTeams();
      setTeams(Array.isArray(teamsData) ? teamsData : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadTeams(); }, [loadTeams]);

  const handleUpload = async (file, uploadFn, successMsg) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      setError('Invalid file format. Please select a CSV or Excel file (.csv, .xlsx)');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    setError('');
    setSuccess('');
    try {
      const result = await uploadFn(fd);
      setSuccess(result.message || successMsg);
      loadTeams();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload file');
    }
  };

  const handleMembersUpload = (e) => {
    const file = e.target.files[0];
    handleUpload(file, TeamService.uploadMembers, 'Members uploaded');
    e.target.value = '';
  };

  const handleTeamsUpload = (e) => {
    const file = e.target.files[0];
    handleUpload(file, TeamService.uploadTeams, 'Teams uploaded');
    e.target.value = '';
  };

  const downloadTemplate = async (downloadFn, filename) => {
    try {
      const blob = await downloadFn();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  if (!isOrganizer) {
    return (
      <div className="empty-state">
        <div className="empty-icon">{'\uD83D\uDD12'}</div>
        <h2 className="empty-title">Access Denied</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">{'\uD83D\uDC65'} Team Management</h1>
          <p className="page-subtitle">Upload teams and members via CSV or Excel files</p>
        </div>
        <div className="page-header-actions" style={{display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap'}}>
          <button className="btn btn-secondary" onClick={() => teamsInputRef.current?.click()}>
            {'\uD83D\uDCCB'} Upload Teams
          </button>
          <input type="file" ref={teamsInputRef} accept=".csv,.xlsx" style={{display: 'none'}} onChange={handleTeamsUpload} />
          <button className="btn btn-secondary" onClick={() => membersInputRef.current?.click()}>
            {'\uD83D\uDCC1'} Upload Members
          </button>
          <input type="file" ref={membersInputRef} accept=".csv,.xlsx" style={{display: 'none'}} onChange={handleMembersUpload} />
          <button className="btn btn-ghost btn-sm" onClick={() => downloadTemplate(TeamService.downloadTeamsTemplate, 'teams_template.csv')}
            title="Download Teams CSV Template">{'\uD83D\uDCE5'} Teams Template</button>
          <button className="btn btn-ghost btn-sm" onClick={() => downloadTemplate(TeamService.downloadMembersTemplate, 'members_template.csv')}
            title="Download Members CSV Template">{'\uD83D\uDCE5'} Members Template</button>
          <button className="btn btn-ghost btn-sm" onClick={loadTeams}>{'\uD83D\uDD04'} Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{marginBottom: 'var(--space-lg)'}}>{error}</div>}
      {success && <div className="alert alert-success" style={{marginBottom: 'var(--space-lg)'}}>{success}</div>}

      {loading ? (
        <div className="grid-3">
          {Array(5).fill(null).map((_, i) => (
            <div key={i} className="card">
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text" style={{marginTop: 'var(--space-md)'}}></div>
              <div className="skeleton skeleton-card" style={{marginTop: 'var(--space-md)'}}></div>
            </div>
          ))}
        </div>
      ) : teams.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">{'\uD83D\uDC65'}</div>
          <h2 className="empty-title">No Teams Registered</h2>
          <p className="empty-desc">Upload a Team Details CSV to create teams, then upload Members CSV to add participants.</p>
        </div>
      ) : (
        <div className="grid-3" id="org-teams-grid">
          {teams.map((t, i) => {
            const code = t.team_code || t.team_id || t.code || '';
            const name = t.team_name || t.name || '';
            const leader = t.team_leader_name || t.team_leader || '';
            const memberCount = (t.members || []).length;
            return (
              <div
                key={t.id}
                className="card"
                style={{animation: `fadeInUp ${0.3 + i * 0.1}s ease-out both`, cursor: 'pointer'}}
                onClick={() => setDetailTeam(t)}
              >
                <div className="card-header">
                  <div className="card-title" style={{display: 'flex', alignItems: 'center', gap: 'var(--space-sm)'}}>
                    <TeamBadge name={name} size={40} />
                    <span>{code} — {name}</span>
                  </div>
                  <span className={`badge ${t.is_active ? 'badge-success' : 'badge-error'}`}>
                    {t.is_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div style={{padding: 'var(--space-md)'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)', fontSize: 'var(--text-sm)'}}>
                    <span style={{color: 'var(--color-text-muted)'}}>Leader</span>
                    <span>{leader || '\u2014'}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)'}}>
                    <span style={{color: 'var(--color-text-muted)'}}>Members</span>
                    <span>{memberCount}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <TeamDetailModal
        team={detailTeam}
        isOpen={!!detailTeam}
        onClose={() => setDetailTeam(null)}
        onTeamUpdated={loadTeams}
      />
    </div>
  );
};

export default TeamsView;
