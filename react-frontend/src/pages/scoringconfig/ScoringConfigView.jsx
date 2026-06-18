import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ScoringConfigService } from '../../api/scoringConfigService';

const sections = [
  { title: 'Base Score', keys: ['winner_points_correct', 'winner_points_incorrect', 'scoreline_points_exact', 'scoreline_points_margin', 'scoreline_points_incorrect', 'max_base_score'] },
  { title: 'Probability', keys: ['probability_threshold', 'probability_points_pass', 'probability_points_fail'] },
  { title: 'Player Performance', keys: ['player_points_exact', 'player_points_close', 'player_points_wrong', 'player_avg_threshold_exact', 'player_avg_threshold_close'] },
  { title: 'Technical Evaluation', keys: ['technical_max_per_category', 'technical_max_total'] },
  { title: 'Presentation Evaluation', keys: ['presentation_ai_explanation_max', 'presentation_qa_score_max', 'presentation_delivery_score_max', 'presentation_denominator', 'presentation_max_marks'] },
  { title: 'Grade Multipliers', keys: ['multiplier_a', 'multiplier_b', 'multiplier_c'] },
  { title: 'Phase Normalization', keys: ['phase1_max_marks'] },
];

const ScoringConfigView = () => {
  const { isOrganizer } = useAuth();
  const [config, setConfig] = useState(null);
  const [guidelines, setGuidelines] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await ScoringConfigService.getGuidelines();
      if (data.config) {
        setConfig(data.config);
      } else {
        const active = await ScoringConfigService.getActiveConfig();
        setConfig(active);
      }
      setGuidelines(data.guidelines || {});
    } catch (err) {
      setError('Failed to load configuration: ' + (err.response?.data?.detail || err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOrganizer) loadData();
  }, [isOrganizer]);

  const isFloatKey = (key) => {
    const floatKeys = ['player_avg_threshold_exact', 'player_avg_threshold_close', 'presentation_denominator'];
    return floatKeys.includes(key);
  };

  const handleChange = (key, value) => {
    if (!config) return;
    const parsed = isFloatKey(key) ? parseFloat(value) : parseInt(value, 10);
    setConfig(prev => ({ ...prev, [key]: isNaN(parsed) ? value : parsed }));
  };

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    try {
      await ScoringConfigService.updateConfig(config.id, config);
      alert('Scoring configuration updated successfully');
      await loadData();
    } catch(err) {
      alert('Failed to save: ' + (err.response?.data?.detail || err.message || ''));
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset all scoring rules to their default values?')) return;
    setSaving(true);
    try {
      await ScoringConfigService.resetConfig();
      await loadData();
      alert('Scoring configuration reset to defaults');
    } catch (err) {
      alert('Failed to reset: ' + (err.response?.data?.detail || err.message || ''));
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
          <h1 className="page-title">⚙️ Scoring Configuration</h1>
          <p className="page-subtitle">Configure scoring rules for future matches</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={loadData}>🔄 Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-lg)' }}>{error}</div>}

      <div className="alert alert-warning" style={{ marginBottom: 'var(--space-lg)' }}>
        <strong>⚠️ Changes apply only to future matches.</strong> Existing scores will not be recalculated.
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card-header">
          <div className="card-title">Config: {config?.name || 'Scoring Configuration'} <span className="badge badge-info">v{config?.version || 1}</span></div>
        </div>
      </div>

      {config && sections.map(section => (
        <div key={section.title} className="card config-section" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="card-header"><span className="card-title">{section.title}</span></div>
          <div style={{ padding: 'var(--space-md)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-sm)' }}>
            {section.keys.map(key => {
              const desc = guidelines[key];
              const val = config[key];
              return (
                <div key={key} className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                  <label className="form-label" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span>{key.replace(/_/g, ' ')}</span>
                    <span style={{ fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{desc || ''}</span>
                  </label>
                  <input
                    className="form-input config-input"
                    type="number"
                    step={isFloatKey(key) ? 'any' : '1'}
                    value={val !== undefined && val !== null ? val : ''}
                    onChange={e => handleChange(key, e.target.value)}
                    style={{ maxWidth: '180px' }}
                  />
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <div style={{ display: 'flex', gap: 'var(--space-md)', marginTop: 'var(--space-xl)', paddingBottom: 'var(--space-2xl)' }}>
        <button className="btn btn-primary" onClick={handleSave} disabled={saving || !config}>
          {saving ? '💾 Saving...' : '💾 Save Changes'}
        </button>
        <button className="btn btn-ghost" onClick={handleReset} disabled={saving}>
          ↺ Reset to Default
        </button>
      </div>
    </div>
  );
};

export default ScoringConfigView;
