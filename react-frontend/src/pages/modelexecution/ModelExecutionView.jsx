import React, { useState, useEffect, useRef } from 'react';
import { ModelExecutionService } from '../../api/modelExecutionService';
import { MatchService } from '../../api/matchService';

const ModelExecutionView = () => {
  const [matches, setMatches] = useState([]);
  const [selectedMatch, setSelectedMatch] = useState('');
  const [file, setFile] = useState(null);
  
  const [modelId, setModelId] = useState(null);
  const [executionId, setExecutionId] = useState(null);
  const [status, setStatus] = useState('IDLE'); // IDLE, RUNNING, SUCCESS, FAILED
  const [errorMessage, setErrorMessage] = useState('');
  const [predictionId, setPredictionId] = useState(null);
  
  const [loading, setLoading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const pollingInterval = useRef(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const matchesData = await MatchService.listMatches();
        setMatches(matchesData);
      } catch (err) {
        console.error('Failed to load matches:', err);
      }
    };
    fetchMatches();
    
    return () => stopPolling();
  }, []);

  const stopPolling = () => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
      pollingInterval.current = null;
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedMatch || !file) {
      setUploadError('Please select a match and upload a .pkl file.');
      return;
    }
    
    setLoading(true);
    setUploadError('');
    try {
      const result = await ModelExecutionService.uploadModel(selectedMatch, file);
      setModelId(result.model_id);
      setStatus('IDLE');
      setExecutionId(null);
      setErrorMessage('');
      setPredictionId(null);
      stopPolling();
    } catch (err) {
      setUploadError(err.response?.data?.detail || 'Failed to upload model.');
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!modelId) return;
    setLoading(true);
    try {
      const result = await ModelExecutionService.executeModel(modelId);
      setExecutionId(result.execution_id);
      setStatus(result.status || 'RUNNING');
      setErrorMessage('');
      startPolling(result.execution_id);
    } catch (err) {
      setErrorMessage(err.response?.data?.detail || 'Failed to start execution.');
      setStatus('FAILED');
    } finally {
      setLoading(false);
    }
  };

  const startPolling = (execId) => {
    stopPolling();
    pollingInterval.current = setInterval(async () => {
      try {
        const result = await ModelExecutionService.getExecutionStatus(execId);
        setStatus(result.status);
        if (result.status === 'SUCCESS' || result.status === 'FAILED') {
          stopPolling();
          if (result.status === 'FAILED') {
            setErrorMessage(result.error_message || 'Execution failed with an unknown error.');
          }
          if (result.status === 'SUCCESS') {
            setPredictionId(result.prediction_id);
          }
        }
      } catch (err) {
        console.error('Failed to poll status', err);
        // Do not stop polling on transient network error, just wait for next tick
      }
    }, 2000);
  };

  const getStatusBadgeClass = () => {
    switch (status) {
      case 'RUNNING': return 'badge-warning';
      case 'SUCCESS': return 'badge-success';
      case 'FAILED': return 'badge-danger';
      default: return 'badge-secondary';
    }
  };

  const getMatchDisplay = () => {
    const match = matches.find(m => m.id === selectedMatch);
    if (!match) return 'Unknown Match';
    return `${match.home_team_name} vs ${match.away_team_name}`;
  };

  return (
    <div className="container p-4">
      <h2 className="mb-4">AI Model Execution</h2>
      
      <div className="card shadow-sm mb-4">
        <div className="card-header bg-white">
          <h5 className="mb-0">1. Upload Model</h5>
        </div>
        <div className="card-body">
          {uploadError && <div className="alert alert-danger">{uploadError}</div>}
          <form onSubmit={handleUpload}>
            <div className="mb-3">
              <label className="form-label">Select Match</label>
              <select 
                className="form-select" 
                value={selectedMatch} 
                onChange={(e) => setSelectedMatch(e.target.value)}
                required
              >
                <option value="">-- Select Match --</option>
                {matches.map(m => (
                  <option key={m.id} value={m.id}>
                    Match {m.match_number}: {m.home_team_name} vs {m.away_team_name}
                  </option>
                ))}
              </select>
            </div>
            
            <div className="mb-3">
              <label className="form-label">Upload .pkl Model</label>
              <input 
                type="file" 
                className="form-control" 
                accept=".pkl"
                onChange={handleFileChange}
                required
              />
            </div>
            
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={loading || !selectedMatch || !file}
            >
              Upload Model
            </button>
          </form>
        </div>
      </div>

      {modelId && (
        <div className="card shadow-sm">
          <div className="card-header bg-white d-flex justify-content-between align-items-center">
            <h5 className="mb-0">2. Execute Model</h5>
            <span className={`badge ${getStatusBadgeClass()} fs-6`}>
              {status}
            </span>
          </div>
          <div className="card-body">
            <div className="row mb-3">
              <div className="col-md-6">
                <strong>Model File:</strong> {file?.name}
              </div>
              <div className="col-md-6">
                <strong>Match:</strong> {getMatchDisplay()}
              </div>
            </div>
            
            {status === 'FAILED' && errorMessage && (
              <div className="alert alert-danger">
                <strong>Error: </strong> {errorMessage}
              </div>
            )}
            
            {status === 'SUCCESS' && predictionId && (
              <div className="alert alert-success">
                <strong>Success: </strong> Prediction generated successfully! It will now appear in your predictions.
              </div>
            )}
            
            <button 
              className="btn btn-success mt-2" 
              onClick={handleExecute}
              disabled={status === 'RUNNING' || loading}
            >
              {status === 'RUNNING' ? 'Running...' : 'Run Model'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ModelExecutionView;
