import React, { useState, useEffect } from 'react';
import { getSubmittedModels, saveModelEvaluation, getModelAnalytics } from '../../api/modelEvaluationService';
import { useAuth } from '../../contexts/AuthContext';

const ModelEvaluation = () => {
  const { isOrganizer } = useAuth();
  
  const [models, setModels] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [evalDialogOpen, setEvalDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState(null);
  
  const [formData, setFormData] = useState({
    overall_accuracy: '',
    winner_prediction_accuracy: '',
    scoreline_accuracy: '',
    probability_accuracy: '',
    player_prediction_accuracy: '',
    matches_tested: '',
    final_ai_score: '',
    evaluation_notes: ''
  });

  const fetchData = async () => {
    try {
      setLoading(true);
      const [modelsData, analyticsData] = await Promise.all([
        getSubmittedModels(),
        getModelAnalytics()
      ]);
      setModels(modelsData);
      setAnalytics(analyticsData);
      setError(null);
    } catch (err) {
      console.error(err);
      setError("Failed to load model evaluation data: " + (err.response?.data?.detail || err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOrganizer) {
      fetchData();
    }
  }, [isOrganizer]);

  const handleOpenEvalDialog = (model) => {
    setSelectedModel(model);
    setFormData({
      overall_accuracy: '',
      winner_prediction_accuracy: '',
      scoreline_accuracy: '',
      probability_accuracy: '',
      player_prediction_accuracy: '',
      matches_tested: '',
      final_ai_score: '',
      evaluation_notes: ''
    });
    setEvalDialogOpen(true);
  };

  const handleCloseEvalDialog = () => {
    setEvalDialogOpen(false);
    setSelectedModel(null);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveEvaluation = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        model_id: selectedModel.id,
        overall_accuracy: formData.overall_accuracy ? parseFloat(formData.overall_accuracy) : null,
        winner_prediction_accuracy: formData.winner_prediction_accuracy ? parseFloat(formData.winner_prediction_accuracy) : null,
        scoreline_accuracy: formData.scoreline_accuracy ? parseFloat(formData.scoreline_accuracy) : null,
        probability_accuracy: formData.probability_accuracy ? parseFloat(formData.probability_accuracy) : null,
        player_prediction_accuracy: formData.player_prediction_accuracy ? parseFloat(formData.player_prediction_accuracy) : null,
        matches_tested: formData.matches_tested ? parseInt(formData.matches_tested) : null,
        final_ai_score: formData.final_ai_score ? parseFloat(formData.final_ai_score) : null,
        evaluation_notes: formData.evaluation_notes || null
      };

      await saveModelEvaluation(payload);
      handleCloseEvalDialog();
      fetchData(); // refresh data to show updated statuses and analytics
      alert('Evaluation saved successfully');
    } catch (err) {
      console.error(err);
      alert("Failed to save evaluation: " + (err.response?.data?.detail || err.message || ''));
    }
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
          <h1 className="page-title">🤖 Model Evaluation</h1>
          <p className="page-subtitle">Manage final model evaluation results</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={fetchData}>🔄 Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

      <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
        <div className="card-header"><h3 className="card-title">Model Submissions</h3></div>
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
                    <th>Team Name</th>
                    <th>Model Name</th>
                    <th>Version</th>
                    <th>Upload Date</th>
                    <th>Status</th>
                    <th>Active Model</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {models.map((model) => (
                    <tr key={model.id}>
                      <td><div style={{ fontWeight: 500 }}>{model.team}</div></td>
                      <td>{model.model_name}</td>
                      <td>v{model.version}</td>
                      <td>{new Date(model.upload_date).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${model.status === 'EVALUATED' ? 'badge-success' : 'badge-info'}`}>
                          {model.status}
                        </span>
                      </td>
                      <td>
                        {model.active_flag ? <span className="badge badge-success">Active</span> : <span style={{ color: 'var(--color-text-muted)' }}>—</span>}
                      </td>
                      <td>
                        <button 
                          className="btn btn-sm btn-primary" 
                          onClick={() => handleOpenEvalDialog(model)}
                        >
                          {model.status === 'EVALUATED' ? 'Update Eval' : 'Evaluate'}
                        </button>
                      </td>
                    </tr>
                  ))}
                  {models.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', color: 'var(--color-text-muted)' }}>No models submitted yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {analytics && analytics.team_rankings && analytics.team_rankings.length > 0 && (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Model Results & Analytics</h3></div>
          <div style={{ padding: 'var(--space-md)' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-md)' }}>
              {analytics.team_rankings.map((team, idx) => {
                // Calculate strength and weakness dynamically for display if not fully populated via backend model
                const metrics = {
                  'Winner Prediction': team.winner_prediction_accuracy,
                  'Scoreline': team.scoreline_accuracy,
                  'Probability': team.probability_accuracy,
                  'Player': team.player_prediction_accuracy
                };
                const validMetrics = Object.entries(metrics).filter(([k, v]) => v !== null && v !== undefined);
                let strength = 'N/A';
                let weakness = 'N/A';
                if (validMetrics.length > 0) {
                  validMetrics.sort((a, b) => b[1] - a[1]);
                  strength = validMetrics[0][0];
                  if (validMetrics.length > 1 && validMetrics[0][1] !== validMetrics[validMetrics.length - 1][1]) {
                    weakness = validMetrics[validMetrics.length - 1][0];
                  }
                }

                return (
                  <div key={idx} className="card" style={{ borderTop: '4px solid var(--color-primary)', boxShadow: 'var(--shadow-sm)' }}>
                    <div style={{ padding: 'var(--space-md)' }}>
                      <h4 style={{ margin: '0 0 var(--space-xs) 0', fontSize: '1.1rem' }}>
                        {idx === 0 && '🥇 '} {team.team_name}
                      </h4>
                      <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-md)' }}>
                        Active Model v{team.version}
                      </div>
                      
                      <div style={{ marginBottom: 'var(--space-md)', fontSize: '1.2rem' }}>
                        <strong>Accuracy:</strong> <span style={{ color: 'var(--color-primary)' }}>{team.overall_accuracy !== null ? `${team.overall_accuracy}%` : 'N/A'}</span>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-xs)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--color-success)' }}>Strong:</span>
                          <span className="badge badge-success">{strength}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 'bold', color: 'var(--color-error)' }}>Weak:</span>
                          <span className="badge badge-error">{weakness}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Dialog */}
      {evalDialogOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div className="card" style={{ width: '100%', maxWidth: '600px', margin: 'var(--space-md)', maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">Evaluate Model: {selectedModel?.team} (v{selectedModel?.version})</h3>
              <button onClick={handleCloseEvalDialog} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' }}>&times;</button>
            </div>
            <div style={{ padding: 'var(--space-md)' }}>
              <form onSubmit={handleSaveEvaluation}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-md)' }}>
                  <div className="form-group">
                    <label className="form-label">Overall Accuracy %</label>
                    <input type="number" step="0.01" className="form-input" name="overall_accuracy" value={formData.overall_accuracy} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Winner Prediction Accuracy %</label>
                    <input type="number" step="0.01" className="form-input" name="winner_prediction_accuracy" value={formData.winner_prediction_accuracy} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Scoreline Accuracy %</label>
                    <input type="number" step="0.01" className="form-input" name="scoreline_accuracy" value={formData.scoreline_accuracy} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Probability Accuracy %</label>
                    <input type="number" step="0.01" className="form-input" name="probability_accuracy" value={formData.probability_accuracy} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Player Prediction Accuracy %</label>
                    <input type="number" step="0.01" className="form-input" name="player_prediction_accuracy" value={formData.player_prediction_accuracy} onChange={handleFormChange} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Matches Tested</label>
                    <input type="number" className="form-input" name="matches_tested" value={formData.matches_tested} onChange={handleFormChange} />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Final AI Score</label>
                  <input type="number" step="0.01" className="form-input" name="final_ai_score" value={formData.final_ai_score} onChange={handleFormChange} />
                </div>
                <div className="form-group">
                  <label className="form-label">Evaluation Notes</label>
                  <textarea className="form-input" name="evaluation_notes" rows={3} value={formData.evaluation_notes} onChange={handleFormChange}></textarea>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
                  <button type="button" className="btn btn-secondary" onClick={handleCloseEvalDialog}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Save Evaluation</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelEvaluation;
