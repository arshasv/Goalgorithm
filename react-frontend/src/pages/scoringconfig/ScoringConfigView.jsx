import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ScoringConfigService } from '../../api/scoringConfigService';

const LABEL_OVERRIDES = {
  winner_points_correct: { label: 'Correct Winner Prediction Points', description: 'Points awarded when the predicted match winner/draw is correct.' },
  winner_points_incorrect: { label: 'Incorrect Winner Prediction Points', description: 'Points awarded when the predicted match result is wrong.' },
  scoreline_points_exact: { label: 'Exact Scoreline Prediction Points', description: 'Points awarded when the exact final score is predicted correctly.' },
  scoreline_points_margin: { label: 'Correct Goal Difference Points', description: 'Partial points when the goal difference is correct but exact score differs.' },
  scoreline_points_incorrect: { label: 'Incorrect Scoreline Points', description: 'Points awarded when score prediction does not match.' },
  max_base_score: { label: 'Maximum Match Base Score', description: 'Maximum raw accuracy score before applying ranking multiplier.' },
  
  probability_threshold: { label: 'High Accuracy Threshold (%)', description: 'Maximum percentage difference allowed for full probability accuracy points.' },
  probability_points_pass: { label: 'High Accuracy Points', description: 'Points awarded when prediction is within the high accuracy threshold.' },
  probability_points_fail: { label: 'Incorrect Probability Points', description: '' },
  probability_medium_threshold: { label: 'Medium Accuracy Threshold (%)', description: 'If prediction is close but not within high accuracy range, award partial points.' },
  probability_medium_points: { label: 'Medium Accuracy Points', description: '' },
  
  player_points_exact: { label: 'Exact Player Performance Points', description: 'Points when predicted player stats exactly match actual performance.' },
  player_points_close: { label: 'Close Player Performance Points', description: 'Partial points for near-correct player predictions.' },
  player_points_wrong: { label: 'Incorrect Player Prediction Points', description: '' },
  player_avg_threshold_exact: { label: 'Exact Match Threshold', description: '' },
  player_avg_threshold_close: { label: 'Close Match Threshold', description: '' },
  
  technical_max_per_category: { label: 'Technical Max Per Category', description: '' },
  technical_max_total: { label: 'Technical Evaluation Total Marks', description: 'Maximum Phase 2 contribution to final leaderboard.' },
  
  presentation_judge_count: { label: 'Judge count', description: '' },
  
  multiplier_a: { label: 'Grade A Multiplier (Rank 1)', description: 'Applied to highest ranked team.' },
  multiplier_b: { label: 'Grade B Multiplier (Rank 2-4)', description: 'Applied to middle ranked teams.' },
  multiplier_c: { label: 'Grade C Multiplier (Rank 5)', description: 'Applied to lowest ranked team.' },
  
  phase1_max_marks: { label: 'Phase 1 Maximum Marks', description: 'Final AI prediction contribution.' },
  phase2_max_marks: { label: 'Phase 2 Maximum Marks', description: 'Technical evaluation contribution.' },
  phase3_max_marks: { label: 'Phase 3 Maximum Marks', description: 'Presentation evaluation contribution.' },
};

const sections = [
  { title: 'Base Score', keys: ['winner_points_correct', 'winner_points_incorrect', 'scoreline_points_exact', 'scoreline_points_margin', 'scoreline_points_incorrect', 'max_base_score'] },
  { title: 'Probability', keys: ['probability_threshold', 'probability_points_pass', 'probability_points_fail', 'probability_medium_threshold', 'probability_medium_points'] },
  { title: 'Player Performance', keys: ['player_points_exact', 'player_points_close', 'player_points_wrong', 'player_avg_threshold_exact', 'player_avg_threshold_close'] },
  { title: 'Technical Evaluation', keys: ['technical_max_per_category', 'technical_max_total'] },
  { title: 'Presentation Settings', keys: ['presentation_judge_count'] },
  { title: 'Grade Multipliers', keys: ['multiplier_a', 'multiplier_b', 'multiplier_c'] },
  { title: 'Phase Normalization', keys: ['phase1_max_marks', 'phase2_max_marks', 'phase3_max_marks'] },
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
    const floatKeys = ['player_avg_threshold_exact', 'player_avg_threshold_close', 'presentation_denominator', 'probability_threshold', 'probability_medium_threshold'];
    return floatKeys.includes(key);
  };

  const handleChange = (key, value) => {
    if (!config) return;
    const actualKey = key === 'phase2_max_marks' ? 'technical_max_total' : key === 'phase3_max_marks' ? 'presentation_max_marks' : key;
    const parsed = isFloatKey(key) ? parseFloat(value) : parseInt(value, 10);
    setConfig(prev => ({ ...prev, [actualKey]: isNaN(parsed) ? value : parsed }));
  };

  const handleAddCriterion = () => {
    setConfig(prev => ({
      ...prev,
      presentation_criteria: [
        ...(prev.presentation_criteria || []),
        { name: 'New Criterion', max_score: 10 }
      ]
    }));
  };

  const handleCriterionChange = (index, field, value) => {
    setConfig(prev => {
      const updated = [...(prev.presentation_criteria || [])];
      updated[index] = {
        ...updated[index],
        [field]: field === 'max_score' ? parseInt(value, 10) || 0 : value
      };
      return { ...prev, presentation_criteria: updated };
    });
  };

  const handleRemoveCriterion = (index) => {
    setConfig(prev => ({
      ...prev,
      presentation_criteria: (prev.presentation_criteria || []).filter((_, i) => i !== index)
    }));
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
              const labelObj = LABEL_OVERRIDES[key] || {};
              const labelText = labelObj.label || key.replace(/_/g, ' ');
              const descText = labelObj.description !== undefined ? labelObj.description : (guidelines[key] || '');
              
              const actualKey = key === 'phase2_max_marks' ? 'technical_max_total' : key === 'phase3_max_marks' ? 'presentation_max_marks' : key;
              const val = config[actualKey];
              return (
                <div key={key} className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                  <label className="form-label" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontWeight: 600 }}>{labelText}</span>
                    <span style={{ fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{descText}</span>
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
            
            {section.title === 'Presentation Settings' && (
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)' }}>
                <div style={{ marginBottom: 'var(--space-lg)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
                  <div className="card" style={{ padding: 'var(--space-sm)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <div style={{ fontWeight: 600 }}>Single Presentation Maximum Weighted Score</div>
                    <div style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-score)', fontWeight: 800 }}>150</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Maximum possible score after applying Grade A multiplier (50 × 3).</div>
                  </div>
                  <div className="card" style={{ padding: 'var(--space-sm)', backgroundColor: 'rgba(0,0,0,0.02)' }}>
                    <div style={{ fontWeight: 600 }}>Total Presentation Weighted Score</div>
                    <div style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-score)', fontWeight: 800 }}>300</div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Two presentation rounds combined (150 + 150).</div>
                  </div>
                  <div className="card" style={{ padding: 'var(--space-sm)', backgroundColor: 'var(--color-primary)', color: 'white' }}>
                    <div style={{ fontWeight: 600 }}>Final Presentation Marks</div>
                    <div style={{ fontSize: 'var(--text-xl)', fontFamily: 'var(--font-score)', fontWeight: 800 }}>20</div>
                    <div style={{ fontSize: 'var(--text-xs)', opacity: 0.9 }}>Final normalized Phase 3 contribution.</div>
                  </div>
                </div>

                <div className="formula-card" style={{ marginBottom: 'var(--space-lg)', padding: 'var(--space-md)', background: 'var(--color-surface)' }}>
                  <strong>Round Weighted Score</strong> = Raw Average × Grade Multiplier<br />
                  <strong>Final Phase 3 Score</strong> = (Total Weighted Score / 300) × 20
                </div>

                <h4 className="form-label" style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--text-md)', fontWeight: 600 }}>📋 Evaluation Criteria</h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                  {(config.presentation_criteria || []).map((criterion, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 'var(--space-md)', alignItems: 'center' }}>
                      <div className="form-group" style={{ flex: 2, marginBottom: 0 }}>
                        <input
                          className="form-input"
                          type="text"
                          placeholder="Criterion Name (e.g. Q&A)"
                          value={criterion.name}
                          onChange={e => handleCriterionChange(idx, 'name', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ flex: 1, marginBottom: 0, display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                        <input
                          className="form-input"
                          type="number"
                          placeholder="Max Marks"
                          value={criterion.max_score}
                          onChange={e => handleCriterionChange(idx, 'max_score', e.target.value)}
                          style={{ maxWidth: '100px' }}
                        />
                        <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>marks</span>
                      </div>
                      <button
                        className="btn btn-ghost"
                        type="button"
                        onClick={() => handleRemoveCriterion(idx)}
                        style={{ color: 'var(--color-status-error)', padding: 'var(--space-xs)' }}
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  className="btn btn-secondary btn-sm"
                  type="button"
                  onClick={handleAddCriterion}
                  style={{ marginTop: 'var(--space-md)' }}
                >
                  ➕ Add Criterion
                </button>
                
                <div style={{ marginTop: 'var(--space-md)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  Total Maximum Marks: <strong>{ (config.presentation_criteria || []).reduce((acc, c) => acc + (c.max_score || 0), 0) }</strong> marks
                </div>
              </div>
            )}
            {section.title === 'Phase Normalization' && (
              <div style={{ gridColumn: '1 / -1', borderTop: '1px solid var(--color-border)', marginTop: 'var(--space-md)', paddingTop: 'var(--space-md)' }}>
                <div className="formula-card" style={{ fontSize: 'var(--text-lg)', textAlign: 'center', padding: 'var(--space-lg)' }}>
                  <strong>Final Leaderboard Formula:</strong><br/><br/>
                  AI Accuracy /60<br/>
                  +<br/>
                  Technical /20<br/>
                  +<br/>
                  Presentation /20<br/>
                  <br/>
                  = Final Score /100
                </div>
              </div>
            )}
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
