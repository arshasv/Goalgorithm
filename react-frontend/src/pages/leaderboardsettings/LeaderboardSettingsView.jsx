import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LeaderboardSettingsService } from '../../api/leaderboardSettingsService';

const TOGGLE_FIELDS = [
  { key: 'show_rank', label: 'Show Rank' },
  { key: 'show_team_name', label: 'Show Team Name' },
  { key: 'show_phase_1_score', label: 'Show Phase 1 Score' },
  { key: 'show_technical_score', label: 'Show Technical Score' },
  { key: 'show_presentation_score', label: 'Show Presentation Score' },
  { key: 'show_final_score', label: 'Show Final Score' },
  { key: 'show_score_breakdown', label: 'Show Score Breakdown' },
  { key: 'show_predictions_count', label: 'Show Prediction Statistics' },
];

const LeaderboardSettingsView = () => {
  const { isOrganizer } = useAuth();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadSettings = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await LeaderboardSettingsService.getSettings();
      setSettings(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOrganizer) loadSettings();
  }, [isOrganizer]);

  const handleToggle = (key, value) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      const payload = {};
      for (const field of TOGGLE_FIELDS) {
        payload[field.key] = settings[field.key];
      }
      payload.show_all_teams_leaderboard = settings.show_all_teams_leaderboard;
      payload.analytics_visibility_enabled = settings.analytics_visibility_enabled;
      await LeaderboardSettingsService.updateSettings(payload);
      setSuccess('Settings saved successfully');
      await loadSettings();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (!isOrganizer) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <h2 className="empty-title">Access Denied</h2>
        <p className="empty-desc">This page is for organizers only.</p>
      </div>
    );
  }

  if (loading) return <div className="loading-spinner"></div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">Leaderboard & Analytics Settings</h1>
          <p className="page-subtitle">Control what Team Leaders can see on the platform</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={loadSettings}>🔄 Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-lg)' }}>{error}</div>}
      {success && <div className="alert alert-success" style={{ marginBottom: 'var(--space-lg)' }}>{success}</div>}

      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card-header">
          <span className="card-title">Analytics Access</span>
        </div>
        <div style={{ padding: 'var(--space-md)' }}>
          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings?.analytics_visibility_enabled ?? false}
              onChange={e => handleToggle('analytics_visibility_enabled', e.target.checked)}
            />
            <span style={{ fontWeight: '600' }}>Enable Overall Analytics Access for Team Leaders</span>
          </label>
          <p style={{ margin: 'var(--space-xs) 0 var(--space-md) calc(1.5em + var(--space-sm))', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            Controls whether participants can view the main Analytics page. Individual sections can be toggled below.
          </p>

          <div style={{ paddingLeft: 'calc(1.5em + var(--space-sm))', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                <input type="checkbox" checked={settings?.show_model_analytics ?? true} onChange={e => handleToggle('show_model_analytics', e.target.checked)} />
                <span style={{ fontWeight: 500 }}>Show Model Analytics</span>
              </label>
              <p style={{ margin: '2px 0 0 calc(1.5em + var(--space-sm))', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Displays accuracy comparisons, final model scores, and version improvements based on offline evaluations.</p>
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                <input type="checkbox" checked={settings?.show_presentation_analytics ?? true} onChange={e => handleToggle('show_presentation_analytics', e.target.checked)} />
                <span style={{ fontWeight: 500 }}>Show Presentation Analytics</span>
              </label>
              <p style={{ margin: '2px 0 0 calc(1.5em + var(--space-sm))', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Allows teams to view criteria comparison charts and strength/weakness analysis.</p>
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                <input type="checkbox" checked={settings?.show_judge_analytics ?? true} onChange={e => handleToggle('show_judge_analytics', e.target.checked)} />
                <span style={{ fontWeight: 500 }}>Show Judge Analytics</span>
              </label>
              <p style={{ margin: '2px 0 0 calc(1.5em + var(--space-sm))', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Displays judge scoring patterns, consistency metrics, and severity metrics to teams.</p>
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                <input type="checkbox" checked={settings?.show_leaderboard_analytics ?? true} onChange={e => handleToggle('show_leaderboard_analytics', e.target.checked)} />
                <span style={{ fontWeight: 500 }}>Show Leaderboard Analytics</span>
              </label>
              <p style={{ margin: '2px 0 0 calc(1.5em + var(--space-sm))', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Allows teams to see top performers and competition-wide score distributions.</p>
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                <input type="checkbox" checked={settings?.show_prediction_analytics ?? true} onChange={e => handleToggle('show_prediction_analytics', e.target.checked)} />
                <span style={{ fontWeight: 500 }}>Show Prediction Analytics</span>
              </label>
              <p style={{ margin: '2px 0 0 calc(1.5em + var(--space-sm))', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Displays prediction scores across matches.</p>
            </div>

            <div style={{ marginBottom: 'var(--space-md)' }}>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                <input type="checkbox" checked={settings?.show_technical_analytics ?? true} onChange={e => handleToggle('show_technical_analytics', e.target.checked)} />
                <span style={{ fontWeight: 500 }}>Show Technical Analytics</span>
              </label>
              <p style={{ margin: '2px 0 0 calc(1.5em + var(--space-sm))', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Displays technical evaluation metrics and comparisons.</p>
            </div>

            <div style={{ marginBottom: '0' }}>
              <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
                <input type="checkbox" checked={settings?.show_overall_comparison ?? true} onChange={e => handleToggle('show_overall_comparison', e.target.checked)} />
                <span style={{ fontWeight: 500 }}>Show Overall Comparison</span>
              </label>
              <p style={{ margin: '2px 0 0 calc(1.5em + var(--space-sm))', fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Displays the high-level competition overview cards (Total Teams, Current Leader, etc).</p>
            </div>
          </div>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card-header">
          <span className="card-title">Leaderboard Access</span>
        </div>
        <div style={{ padding: 'var(--space-md)' }}>
          <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={settings?.show_all_teams_leaderboard ?? true}
              onChange={e => handleToggle('show_all_teams_leaderboard', e.target.checked)}
            />
            <span>Allow Team Leaders to view other teams' rankings and scores</span>
          </label>
          <p style={{ margin: 'var(--space-xs) 0 0 calc(1.5em + var(--space-sm))', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
            When disabled, Team Leaders will only see their own team's information.
          </p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card-header">
          <span className="card-title">Column Visibility</span>
        </div>
        <div style={{ padding: 'var(--space-md)', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
          {TOGGLE_FIELDS.map(field => (
            <label key={field.key} className="checkbox-label" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={settings?.[field.key] ?? true}
                onChange={e => handleToggle(field.key, e.target.checked)}
              />
              <span>{field.label}</span>
            </label>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)', paddingBottom: 'var(--space-2xl)' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !settings}>
          {saving ? '💾 Saving...' : '💾 Save Settings'}
        </button>
      </div>
    </div>
  );
};

export default LeaderboardSettingsView;
