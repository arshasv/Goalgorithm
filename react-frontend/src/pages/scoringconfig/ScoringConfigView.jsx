import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';

const defaultGuidelines = {
  winner_points_correct: { label: 'Winner Points — Correct', description: 'Points awarded for correctly predicting the winner' },
  winner_points_incorrect: { label: 'Winner Points — Incorrect', description: 'Points when winner prediction is wrong' },
  scoreline_points_exact: { label: 'Scoreline Points — Exact', description: 'Points for exact scoreline match' },
  scoreline_points_margin: { label: 'Scoreline Points — Margin', description: 'Points for correct margin (goal difference)' },
  scoreline_points_incorrect: { label: 'Scoreline Points — Incorrect', description: 'Points when scoreline prediction is wrong' },
  max_base_score: { label: 'Max Base Score', description: 'Maximum possible base score per match' },
  probability_threshold: { label: 'Probability Threshold', description: 'Threshold percentage for probability points' },
  probability_points_pass: { label: 'Probability Points — Pass', description: 'Points awarded when probability meets threshold' },
  probability_points_fail: { label: 'Probability Points — Fail', description: 'Points when probability is below threshold' },
  player_points_exact: { label: 'Player Points — Exact', description: 'Points for exact player performance prediction' },
  player_points_close: { label: 'Player Points — Close', description: 'Points for close prediction' },
  player_points_wrong: { label: 'Player Points — Wrong', description: 'Points when prediction is wrong' },
  player_avg_threshold_exact: { label: 'Player Avg Threshold — Exact', description: 'Threshold for exact match' },
  player_avg_threshold_close: { label: 'Player Avg Threshold — Close', description: 'Threshold for close match' },
  technical_max_per_category: { label: 'Technical Max Per Category', description: 'Maximum score per technical sub-dimension' },
  technical_max_total: { label: 'Technical Max Total', description: 'Total maximum technical score' },
  presentation_ai_explanation_max: { label: 'Presentation AI Explanation Max', description: 'Maximum AI Explanation score' },
  presentation_qa_score_max: { label: 'Presentation Q&A Max', description: 'Maximum Q&A score' },
  presentation_delivery_score_max: { label: 'Presentation Delivery Max', description: 'Maximum Delivery score' },
  presentation_denominator: { label: 'Presentation Denominator', description: 'Denominator for presentation normalization' },
  presentation_max_marks: { label: 'Presentation Max Marks', description: 'Maximum final presentation marks' },
  multiplier_a: { label: 'Grade A Multiplier', description: 'Score multiplier for Grade A teams' },
  multiplier_b: { label: 'Grade B Multiplier', description: 'Score multiplier for Grade B teams' },
  multiplier_c: { label: 'Grade C Multiplier', description: 'Score multiplier for Grade C teams' },
  phase1_max_marks: { label: 'Phase 1 Max Marks', description: 'Maximum marks for Phase 1 normalization' },
};

const defaultConfig = {
  winner_points_correct: 5,
  winner_points_incorrect: 0,
  scoreline_points_exact: 10,
  scoreline_points_margin: 5,
  scoreline_points_incorrect: 0,
  max_base_score: 25,
  probability_threshold: 50,
  probability_points_pass: 5,
  probability_points_fail: 0,
  player_points_exact: 5,
  player_points_close: 2,
  player_points_wrong: 0,
  player_avg_threshold_exact: 0.1,
  player_avg_threshold_close: 0.25,
  technical_max_per_category: 5,
  technical_max_total: 20,
  presentation_ai_explanation_max: 20,
  presentation_qa_score_max: 15,
  presentation_delivery_score_max: 15,
  presentation_denominator: 150,
  presentation_max_marks: 20,
  multiplier_a: 3,
  multiplier_b: 2,
  multiplier_c: 1,
  phase1_max_marks: 60,
};

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
  const [config, setConfig] = useState({ ...defaultConfig });
  const [initialConfig, setInitialConfig] = useState({ ...defaultConfig });

  const isFloatKey = (key) => {
    const floatKeys = ['player_avg_threshold_exact', 'player_avg_threshold_close', 'presentation_denominator'];
    return floatKeys.includes(key);
  };

  const handleChange = (key, value) => {
    const original = defaultConfig[key];
    const parsed = typeof original === 'number' && !Number.isInteger(original)
      ? parseFloat(value)
      : Number.isInteger(original)
        ? parseInt(value, 10)
        : value;
    setConfig(prev => ({ ...prev, [key]: isNaN(parsed) ? value : parsed }));
  };

  const handleSave = () => {
    alert('Scoring configuration updated (mock)');
  };

  const handleReset = () => {
    if (!window.confirm('Reset all scoring rules to their default values?')) return;
    setConfig({ ...defaultConfig });
    setInitialConfig({ ...defaultConfig });
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

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">⚙️ Scoring Configuration</h1>
          <p className="page-subtitle">Configure scoring rules for future matches</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={() => setConfig({ ...initialConfig })}>🔄 Refresh</button>
        </div>
      </div>

      <div className="alert alert-warning" style={{ marginBottom: 'var(--space-lg)' }}>
        <strong>⚠️ Changes apply only to future matches.</strong> Existing scores will not be recalculated.
      </div>

      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card-header">
          <div className="card-title">Config: Default Scoring <span className="badge badge-info">v1</span></div>
        </div>
      </div>

      {sections.map(section => (
        <div key={section.title} className="card config-section" style={{ marginBottom: 'var(--space-lg)' }}>
          <div className="card-header"><span className="card-title">{section.title}</span></div>
          <div style={{ padding: 'var(--space-md)', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 'var(--space-sm)' }}>
            {section.keys.map(key => {
              const gl = defaultGuidelines[key];
              const val = config[key];
              return (
                <div key={key} className="form-group" style={{ marginBottom: 'var(--space-md)' }}>
                  <label className="form-label" style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span>{gl ? gl.label : key}</span>
                    <span style={{ fontWeight: 400, fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{gl ? gl.description : ''}</span>
                  </label>
                  <input
                    className="form-input config-input"
                    type="number"
                    step={isFloatKey(key) ? 'any' : '1'}
                    value={val}
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
        <button className="btn btn-primary" onClick={handleSave}>💾 Save Changes</button>
        <button className="btn btn-ghost" onClick={handleReset}>↺ Reset to Default</button>
      </div>
    </div>
  );
};

export default ScoringConfigView;
