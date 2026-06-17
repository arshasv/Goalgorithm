import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const MockTeams = [
  { id: 'T1', team_id: 'A', code: 'A', name: 'Team A' },
  { id: 'T2', team_id: 'B', code: 'B', name: 'Team B' },
  { id: 'T3', team_id: 'C', code: 'C', name: 'Team C' },
  { id: 'T4', team_id: 'D', code: 'D', name: 'Team D' },
  { id: 'T5', team_id: 'E', code: 'E', name: 'Team E' },
];

const MockSubmissions = [
  { id: 'S1', team_id: 'T1', file_name: 'model_v3.pkl', file_size: 5242880, uploaded_at: '2026-06-15T10:00:00Z', is_active: true },
  { id: 'S2', team_id: 'T1', file_name: 'model_v2.pkl', file_size: 4194304, uploaded_at: '2026-06-14T10:00:00Z', is_active: false },
  { id: 'S3', team_id: 'T2', file_name: 'pred_model.pth', file_size: 8388608, uploaded_at: '2026-06-13T15:30:00Z', is_active: true },
  { id: 'S4', team_id: 'T3', file_name: 'model.onnx', file_size: 3145728, uploaded_at: '2026-06-12T12:00:00Z', is_active: true },
  { id: 'S5', team_id: 'T3', file_name: 'model_v1.pkl', file_size: 2097152, uploaded_at: '2026-06-11T09:00:00Z', is_active: false },
  { id: 'S6', team_id: 'T4', file_name: 'team_model.joblib', file_size: 4194304, uploaded_at: '2026-06-10T18:00:00Z', is_active: true },
];

const formatTeamDisplay = (t) => {
  const code = t.team_id || t.code || '';
  const name = t.name || '';
  return code ? `${code} – ${name}` : name;
};

const formatDateTimeLocal = (dateStr) => {
  if (!dateStr) return '';
  try { return new Date(dateStr).toISOString().slice(0, 16); } catch { return ''; }
};

const ModelManagementView = () => {
  const { isOrganizer } = useAuth();

  const [enabled, setEnabled] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [teams, setTeams] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      setTeams(MockTeams);
      setSubmissions(MockSubmissions);
    } catch (err) {
      setError('Failed to load data: ' + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSaveWindow = () => {
    const data = {
      is_enabled: enabled,
      start_time: startTime ? new Date(startTime).toISOString() : null,
      end_time: endTime ? new Date(endTime).toISOString() : null,
    };
    alert('Upload window settings saved (mock) ' + JSON.stringify(data));
  };

  const handleViewModel = (sub) => {
    alert(`View model: ${sub.file_name} (${(sub.file_size / 1024 / 1024).toFixed(2)} MB)`);
  };

  if (!isOrganizer) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <h2 className="empty-title">Access Denied</h2>
      </div>
    );
  }

  const teamSubMap = {};
  submissions.forEach(sub => {
    if (!teamSubMap[sub.team_id]) teamSubMap[sub.team_id] = [];
    teamSubMap[sub.team_id].push(sub);
  });

  const rows = teams.flatMap(t => {
    const subs = teamSubMap[t.id] || [];
    if (subs.length === 0) {
      return (
        <tr key={t.id}>
          <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div><div style={{ fontWeight: 500 }}>{formatTeamDisplay(t)}</div></div>
            </div>
          </td>
          <td><span className="badge badge-error">Missing</span></td>
          <td><span style={{ color: 'var(--color-text-muted)' }}>—</span></td>
          <td><span style={{ color: 'var(--color-text-muted)' }}>—</span></td>
          <td></td>
        </tr>
      );
    }
    return subs.map((sub, idx) => {
      const isLatest = sub.is_active;
      const bg = isLatest ? { background: 'var(--color-bg-secondary)' } : {};
      return (
        <tr key={sub.id} style={bg}>
          <td>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
              <div style={{ width: 24 }}>{idx === 0 ? null : null}</div>
              <div><div style={{ fontWeight: 500 }}>{idx === 0 ? formatTeamDisplay(t) : ''}</div></div>
            </div>
          </td>
          <td>{isLatest ? <span className="badge badge-success">Latest Submission</span> : <span className="badge badge-info">Archived</span>}</td>
          <td>
            <div>{sub.file_name}</div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
              {(sub.file_size / 1024 / 1024).toFixed(2)} MB • Uploaded: {new Date(sub.uploaded_at).toLocaleString()}
            </div>
          </td>
          <td>v{subs.length - idx}</td>
          <td>
            <button className="btn btn-sm btn-secondary" onClick={() => handleViewModel(sub)}>👁️ View Model</button>
          </td>
        </tr>
      );
    });
  });

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">🤖 Model Management</h1>
          <p className="page-subtitle">Upload window and model submission management for all teams</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={loadData}>🔄 Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

      <div className="card" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)' }}>
        <h3 style={{ marginBottom: 'var(--space-sm)' }}>Model Submission Window</h3>
        <div style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Status</label>
            <select className="form-input" value={enabled ? 'true' : 'false'} onChange={e => setEnabled(e.target.value === 'true')}>
              <option value="false">Disabled</option>
              <option value="true">Enabled</option>
            </select>
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Start Time (UTC)</label>
            <input type="datetime-local" className="form-input" value={startTime} onChange={e => setStartTime(e.target.value)} />
          </div>
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">End Time (UTC)</label>
            <input type="datetime-local" className="form-input" value={endTime} onChange={e => setEndTime(e.target.value)} />
          </div>
          <button className="btn btn-primary" onClick={handleSaveWindow}>Save Window Settings</button>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><h3 className="card-title">Team Submissions</h3></div>
        {loading ? (
          <div style={{ padding: 'var(--space-md)' }}>
            <div className="skeleton skeleton-title"></div>
            <div className="skeleton skeleton-text" style={{ marginTop: 'var(--space-md)' }}></div>
          </div>
        ) : (
          <div style={{ padding: 'var(--space-md)' }}>
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Team</th>
                    <th>Status</th>
                    <th>File</th>
                    <th>Version</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>{rows}</tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ModelManagementView;
