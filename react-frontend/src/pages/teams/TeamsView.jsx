import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TeamService } from '../../api/teamService';
import CreateTeamModal from '../../components/teams/CreateTeamModal';
import TeamDetailModal from '../../components/teams/TeamDetailModal';

const formatTeamDisplay = (team) => {
  if (!team) return '—';
  const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  let code = team.team_code || team.team_id || team.code || '';
  let name = team.name || team.team_name || '';
  if (code && UUID_RE.test(code)) code = '';
  if (code) return `Team ${code.toUpperCase()} — ${name || `Team ${code.toUpperCase()}`}`;
  return name || '—';
};

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

  const [createOpen, setCreateOpen] = useState(false);
  const [detailTeam, setDetailTeam] = useState(null);

  const csvInputRef = useRef(null);

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

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      setError('Invalid file format. Please select a CSV or Excel file (.csv, .xlsx)');
      e.target.value = '';
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    try {
      await TeamService.uploadTeamsCsv(fd);
      loadTeams();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload file');
    }
    e.target.value = '';
  };

  if (!isOrganizer) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <h2 className="empty-title">Access Denied</h2>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">👥 Team Management</h1>
          <p className="page-subtitle">Manage teams — codes, names, and leaders</p>
        </div>
        <div className="page-header-actions" style={{display: 'flex', gap: 'var(--space-sm)'}}>
          <button className="btn btn-primary" onClick={() => setCreateOpen(true)}>+ Create Team</button>
          <button className="btn btn-secondary" onClick={() => csvInputRef.current?.click()}>📁 Upload Teams (CSV/Excel)</button>
          <input type="file" ref={csvInputRef} accept=".csv,.xlsx" style={{display: 'none'}} onChange={handleCsvUpload} />
          <button className="btn btn-secondary" onClick={loadTeams}>🔄 Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{marginBottom: 'var(--space-lg)'}}>{error}</div>}

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
          <div className="empty-icon">👥</div>
          <h2 className="empty-title">No Teams Registered</h2>
          <p className="empty-desc">Teams will appear here once created.</p>
        </div>
      ) : (
        <div className="grid-3" id="org-teams-grid">
          {teams.map((t, i) => (
            <div
              key={t.id}
              className="card"
              style={{animation: `fadeInUp ${0.3 + i * 0.1}s ease-out both`, cursor: 'pointer'}}
              onClick={() => setDetailTeam(t)}
            >
              <div className="card-header">
                <div className="card-title" style={{display: 'flex', alignItems: 'center', gap: 'var(--space-sm)'}}>
                  <TeamBadge name={t.name || t.team_name} size={40} />
                  <span>{formatTeamDisplay(t)}</span>
                </div>
                <span className={`badge ${t.is_active ? 'badge-success' : 'badge-error'}`}>
                  {t.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div style={{padding: 'var(--space-md)'}}>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)', fontSize: 'var(--text-sm)'}}>
                  <span style={{color: 'var(--color-text-muted)'}}>Code</span>
                  <span style={{fontFamily: 'var(--font-data)'}}>{t.team_code || t.code}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)', fontSize: 'var(--text-sm)'}}>
                  <span style={{color: 'var(--color-text-muted)'}}>Leader</span>
                  <span>{t.team_leader || t.team_leader_name || '—'}</span>
                </div>
                <div style={{display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)'}}>
                  <span style={{color: 'var(--color-text-muted)'}}>Members</span>
                  <span>{(t.members || []).length}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <CreateTeamModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onTeamCreated={loadTeams}
      />

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
