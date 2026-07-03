import React, { useState, useEffect, useRef } from 'react';
import { ModelExecutionService } from '../../api/modelExecutionService';
import { MatchService } from '../../api/matchService';
import api from '../../api/axios';

const BatchModelExecutionView = () => {
  const [latestModels, setLatestModels] = useState([]);
  const [matches, setMatches] = useState([]);
  const [selectedMatchIds, setSelectedMatchIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  
  // Progress & Active Batch state
  const [activeBatch, setActiveBatch] = useState(null);
  const [progress, setProgress] = useState(null);
  const [batchHistory, setBatchHistory] = useState([]);
  const [expandedJobId, setExpandedJobId] = useState(null);
  const pollingTimer = useRef(null);

  // Fetch initial data (latest models and matches) and history
  const fetchData = async () => {
    setLoading(true);
    setError('');
    try {
      const [discovered, matchesList] = await Promise.all([
        ModelExecutionService.discoverLatestModels(),
        MatchService.listMatches()
      ]);
      setLatestModels(discovered);
      setMatches(matchesList);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch initial page data.');
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const data = await ModelExecutionService.listBatches();
      if (data && data.batches) {
        setBatchHistory(data.batches);
      }
    } catch (err) {
      console.error('Failed to load batch history:', err);
    }
  };

  useEffect(() => {
    fetchData();
    fetchHistory();
    fetchRecentBatch();
    return () => stopPolling();
  }, []);

  const fetchRecentBatch = async () => {
    try {
      const res = await api.get('/batch-executions');
      if (res.data && res.data.batches && res.data.batches.length > 0) {
        const latest = res.data.batches[0];
        setActiveBatch(latest);
        if (latest.overall_status === 'RUNNING' || latest.overall_status === 'PENDING') {
          startPolling(latest.id);
        } else {
          fetchProgress(latest.id);
        }
      }
    } catch (err) {
      console.error('Failed to load recent batch:', err);
    }
  };

  const fetchProgress = async (batchId) => {
    try {
      const data = await ModelExecutionService.getBatchProgress(batchId);
      setProgress(data);
      if (data.batch_summary.overall_status !== 'RUNNING' && data.batch_summary.overall_status !== 'PENDING') {
        stopPolling();
        fetchHistory(); // Refresh history once finished
      }
    } catch (err) {
      console.error('Failed to fetch batch progress:', err);
    }
  };

  const startPolling = (batchId) => {
    stopPolling();
    // Fetch immediately
    fetchProgress(batchId);
    pollingTimer.current = setInterval(() => {
      fetchProgress(batchId);
    }, 2000);
  };

  const stopPolling = () => {
    if (pollingTimer.current) {
      clearInterval(pollingTimer.current);
      pollingTimer.current = null;
    }
  };

  const handleSelectBatch = (batch) => {
    setActiveBatch(batch);
    setExpandedJobId(null);
    if (batch.overall_status === 'RUNNING' || batch.overall_status === 'PENDING') {
      startPolling(batch.id);
    } else {
      stopPolling();
      fetchProgress(batch.id);
    }
  };

  // Match selection handlers
  const handleMatchSelect = (matchId, checked) => {
    if (checked) {
      setSelectedMatchIds(prev => [...prev, matchId]);
    } else {
      setSelectedMatchIds(prev => prev.filter(id => id !== matchId));
    }
  };

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedMatchIds(matches.map(m => m.id));
    } else {
      setSelectedMatchIds([]);
    }
  };

  const handleSelectToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    const todayIds = matches
      .filter(m => m.scheduled_at && m.scheduled_at.split('T')[0] === todayStr)
      .map(m => m.id);
    setSelectedMatchIds(todayIds);
  };

  const handleSelectScheduled = () => {
    const scheduledIds = matches
      .filter(m => m.status === 'SCHEDULED')
      .map(m => m.id);
    setSelectedMatchIds(scheduledIds);
  };

  const handleRunBatch = async () => {
    if (selectedMatchIds.length === 0) {
      setError('Please select at least one match to run the batch.');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      // 1. Create the batch in the database with selected matches
      const batch = await ModelExecutionService.createBatch(selectedMatchIds);
      setActiveBatch(batch);
      // 2. Trigger asynchronous batch execution
      await ModelExecutionService.executeBatch(batch.id);
      setSuccessMsg('Batch execution triggered successfully!');
      // 3. Start polling progress
      startPolling(batch.id);
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to trigger batch model execution.');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelBatch = async (batchId) => {
    setError('');
    setSuccessMsg('');
    try {
      const res = await ModelExecutionService.cancelBatch(batchId);
      setSuccessMsg('Batch execution cancelled successfully.');
      if (activeBatch && activeBatch.id === batchId) {
        setActiveBatch(res);
        fetchProgress(batchId);
      }
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to cancel batch execution.');
    }
  };

  const handleRetryBatch = async (batchId, forceAll = false) => {
    setError('');
    setSuccessMsg('');
    setExpandedJobId(null);
    try {
      const res = await ModelExecutionService.retryBatch(batchId, forceAll);
      setSuccessMsg(forceAll ? 'Retrying entire batch...' : 'Retrying failed jobs...');
      setActiveBatch(res);
      startPolling(batchId);
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to retry batch execution.');
    }
  };

  const handleRetryJob = async (jobId) => {
    setError('');
    setSuccessMsg('');
    setExpandedJobId(null);
    try {
      await ModelExecutionService.retryJob(jobId);
      setSuccessMsg('Retrying job...');
      if (activeBatch) {
        startPolling(activeBatch.id);
      }
      fetchHistory();
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || 'Failed to retry job.');
    }
  };

  // Progress calculations
  const total = progress?.batch_summary?.total_jobs || 0;
  const completedCount = progress?.batch_summary?.completed_jobs || 0;
  const failedCount = progress?.batch_summary?.failed_jobs || 0;
  const pendingCount = progress?.batch_summary?.pending_jobs || 0;
  
  // Calculate running count manually or from status
  const runningCount = progress?.jobs?.filter(j => j.status === 'RUNNING').length || 0;
  
  const completedPercent = total > 0 ? (completedCount / total) * 100 : 0;
  const runningPercent = total > 0 ? (runningCount / total) * 100 : 0;
  const failedPercent = total > 0 ? (failedCount / total) * 100 : 0;
  const pendingPercent = total > 0 ? (pendingCount / total) * 100 : 0;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="badge badge-success">COMPLETED</span>;
      case 'RUNNING':
        return <span className="badge badge-primary">RUNNING</span>;
      case 'PENDING':
        return <span className="badge badge-warning text-dark">PENDING</span>;
      case 'FAILED':
        return <span className="badge badge-error">FAILED</span>;
      case 'CANCELLED':
        return <span className="badge badge-info">CANCELLED</span>;
      default:
        return <span className="badge badge-info">{status}</span>;
    }
  };

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">⚙️ Batch Model Execution</h1>
          <p className="page-subtitle">
            Deploy, monitor, cancel, and retry bulk prediction jobs for active teams.
          </p>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}
      {successMsg && <div className="alert alert-success" style={{ marginBottom: 'var(--space-md)' }}>{successMsg}</div>}

      <div className="row g-4" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        
        {/* Discovered Latest Models Card */}
        <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
          <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-title">1. Discovered Models</span>
              <span className="badge badge-info">
                {latestModels.length} Active Teams
              </span>
            </div>
            <div style={{ flex: 1, maxHeight: '320px', overflowY: 'auto' }}>
              {loading && latestModels.length === 0 ? (
                <div style={{ padding: 'var(--space-md)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                  Discovering models...
                </div>
              ) : latestModels.length === 0 ? (
                <div style={{ padding: 'var(--space-lg)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                  No uploaded models found for any active teams.
                </div>
              ) : (
                <div className="table-wrapper">
                  <table style={{ margin: 0 }}>
                    <thead>
                      <tr>
                        <th>Team</th>
                        <th>Latest Model</th>
                        <th>Upload Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {latestModels.map((item, idx) => (
                        <tr key={idx}>
                          <td style={{ fontWeight: 600 }}>{item.team.name}</td>
                          <td>
                            <code style={{ background: 'var(--color-surface-secondary)', padding: '2px 6px', borderRadius: 'var(--radius-small)', color: 'var(--color-secondary)' }}>
                              {item.latest_model.original_filename}
                            </code>
                          </td>
                          <td style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                            {new Date(item.upload_time).toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Match Selection Card */}
        <div style={{ flex: '1 1 45%', minWidth: '300px' }}>
          <div className="card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-xs)' }}>
              <span className="card-title">2. Match Selection</span>
              <div className="btn-group" style={{ display: 'inline-flex', background: 'var(--color-surface-secondary)', padding: '2px', borderRadius: 'var(--radius-medium)', border: '1px solid var(--color-border)' }}>
                <button type="button" className="btn btn-sm btn-ghost" onClick={handleSelectToday}>Today</button>
                <button type="button" className="btn btn-sm btn-ghost" onClick={handleSelectScheduled}>Scheduled</button>
              </div>
            </div>
            
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: 'var(--space-xs) 0', borderBottom: '1px solid var(--color-border)' }}>
                <input
                  type="checkbox"
                  id="selectAllMatches"
                  checked={matches.length > 0 && selectedMatchIds.length === matches.length}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                />
                <label htmlFor="selectAllMatches" style={{ cursor: 'pointer', fontWeight: 650, color: 'var(--color-text-primary)', fontSize: 'var(--text-base)' }}>
                  Select All Matches
                </label>
                <span className="badge badge-success" style={{ marginLeft: 'auto' }}>
                  {selectedMatchIds.length} Selected
                </span>
              </div>

              <div style={{ maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 'var(--space-sm)' }}>
                {matches.length === 0 ? (
                  <div style={{ padding: 'var(--space-md)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                    No matches loaded.
                  </div>
                ) : (
                  matches.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', padding: '4px 0' }}>
                      <input
                        type="checkbox"
                        id={`match-${m.id}`}
                        checked={selectedMatchIds.includes(m.id)}
                        onChange={(e) => handleMatchSelect(m.id, e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor={`match-${m.id}`} style={{ cursor: 'pointer', fontSize: 'var(--text-sm)', color: 'var(--color-text-primary)' }}>
                        <span style={{ color: 'var(--color-text-secondary)', marginRight: 'var(--space-xs)' }}>Match {m.match_number}:</span>
                        <strong>{m.home_team_name}</strong> vs <strong>{m.away_team_name}</strong>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-sm)' }}>
                          ({m.status} — {new Date(m.scheduled_at).toLocaleDateString()})
                        </span>
                      </label>
                    </div>
                  ))
                )}
              </div>

              <button
                type="button"
                className="btn btn-primary"
                onClick={handleRunBatch}
                disabled={loading || selectedMatchIds.length === 0}
                style={{ width: '100%', marginTop: 'auto' }}
              >
                {loading ? 'Starting...' : '🚀 Run Batch Model Execution'}
              </button>
            </div>
          </div>
        </div>

      </div>

      <div className="row g-4" style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-lg)', marginBottom: 'var(--space-lg)' }}>
        
        {/* Batch History Card */}
        <div style={{ flex: '1 1 35%', minWidth: '280px' }}>
          <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
            <div className="card-header">
              <span className="card-title">📜 Execution History</span>
            </div>
            <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
              {batchHistory.length === 0 ? (
                <div style={{ color: 'var(--color-text-secondary)', textAlign: 'center', padding: 'var(--space-md)' }}>
                  No previous batch execution records found.
                </div>
              ) : (
                batchHistory.map((batch) => {
                  const isSelected = activeBatch && activeBatch.id === batch.id;
                  return (
                    <div
                      key={batch.id}
                      onClick={() => handleSelectBatch(batch)}
                      style={{
                        padding: 'var(--space-md)',
                        marginBottom: 'var(--space-sm)',
                        borderRadius: 'var(--radius-medium)',
                        border: isSelected ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                        background: isSelected ? 'var(--color-surface-secondary)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'all var(--duration-fast)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xs)' }}>
                        <span style={{ fontWeight: 'bold', fontSize: 'var(--text-sm)' }}>
                          Batch {batch.id.substring(0, 8)}
                        </span>
                        {getStatusBadge(batch.overall_status)}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-secondary)', fontSize: 'var(--text-xs)' }}>
                        <span>{new Date(batch.created_at).toLocaleDateString()}</span>
                        <span>Jobs: {batch.completed_jobs}/{batch.total_jobs} ({batch.failed_jobs} failed)</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Progress & Current Batch Details Card */}
        <div style={{ flex: '1 1 60%', minWidth: '320px' }}>
          {progress ? (
            <div className="card">
              <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-sm)' }}>
                <div>
                  <span className="card-title" style={{ display: 'block' }}>
                    Batch Progress: {progress.batch_summary.id.substring(0, 8)}
                  </span>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                    Created at {new Date(progress.batch_summary.created_at).toLocaleString()}
                  </span>
                </div>
                {getStatusBadge(progress.batch_summary.overall_status)}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 'var(--space-sm)', margin: 'var(--space-md) 0' }}>
                {(progress.batch_summary.overall_status === 'RUNNING' || progress.batch_summary.overall_status === 'PENDING') && (
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => handleCancelBatch(progress.batch_summary.id)}
                    style={{ flex: 1 }}
                  >
                    ⏹️ Cancel Batch
                  </button>
                )}

                {(progress.batch_summary.overall_status === 'COMPLETED' || 
                  progress.batch_summary.overall_status === 'FAILED' || 
                  progress.batch_summary.overall_status === 'CANCELLED') && (
                  <>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={() => handleRetryBatch(progress.batch_summary.id, false)}
                      disabled={progress.batch_summary.failed_jobs === 0 && progress.batch_summary.pending_jobs === 0}
                      style={{ flex: 1 }}
                    >
                      🔄 Retry Failed Jobs
                    </button>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleRetryBatch(progress.batch_summary.id, true)}
                      style={{ flex: 1 }}
                    >
                      🔁 Force Retry All
                    </button>
                  </>
                )}
              </div>

              {/* Progress Tracker */}
              <div style={{ marginBottom: 'var(--space-lg)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-xs)', fontSize: 'var(--text-sm)', fontWeight: 600 }}>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Status Details</span>
                  <span style={{ color: 'var(--color-primary-light)' }}>{progress.progress_percent.toFixed(1)}%</span>
                </div>
                
                {/* Custom multi-segment progress bar wrapper matching GOALGORITHM layout */}
                <div style={{ height: '12px', background: 'var(--color-surface-secondary)', borderRadius: 'var(--radius-full)', overflow: 'hidden', display: 'flex' }}>
                  {completedPercent > 0 && (
                    <div style={{ width: `${completedPercent}%`, background: 'var(--color-status-success)', transition: 'width 0.4s ease' }} title={`Completed: ${completedCount}`} />
                  )}
                  {runningPercent > 0 && (
                    <div style={{ width: `${runningPercent}%`, background: 'var(--color-primary)', transition: 'width 0.4s ease' }} title={`Running: ${runningCount}`} />
                  )}
                  {failedPercent > 0 && (
                    <div style={{ width: `${failedPercent}%`, background: 'var(--color-status-error)', transition: 'width 0.4s ease' }} title={`Failed: ${failedCount}`} />
                  )}
                  {pendingPercent > 0 && (
                    <div style={{ width: `${pendingPercent}%`, background: 'var(--color-text-muted)', transition: 'width 0.4s ease' }} title={`Pending: ${pendingCount}`} />
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 'var(--space-md)', marginTop: 'var(--space-sm)', fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', textAlign: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-status-success)', fontSize: 'var(--text-base)' }}>{completedCount}</div>
                    <div>Completed</div>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-primary-light)', fontSize: 'var(--text-base)' }}>{runningCount}</div>
                    <div>Running</div>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-status-error)', fontSize: 'var(--text-base)' }}>{failedCount}</div>
                    <div>Failed</div>
                  </div>
                  <div style={{ flex: 1, borderLeft: '1px solid var(--color-border)' }}>
                    <div style={{ fontWeight: 'bold', color: 'var(--color-text-muted)', fontSize: 'var(--text-base)' }}>{pendingCount}</div>
                    <div>Pending</div>
                  </div>
                </div>
              </div>

              {/* Current Job Alert */}
              {progress.current_running_job && (
                <div className="alert alert-info" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-sm)', marginBottom: 'var(--space-md)' }}>
                  <span>⏳</span>
                  <div>
                    <strong>Running:</strong> {progress.current_running_job.team.name} on match <em>{progress.current_running_job.match.home_team_name} vs {progress.current_running_job.match.away_team_name}</em>
                  </div>
                </div>
              )}

              {/* Job Execution Table */}
              <div className="table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                <table style={{ margin: 0 }}>
                  <thead>
                    <tr>
                      <th>Team / Match</th>
                      <th>Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progress.jobs.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                          No jobs found in this batch.
                        </td>
                      </tr>
                    ) : (
                      progress.jobs.map(job => {
                        const isExpanded = expandedJobId === job.id;
                        const isBatchActive = progress.batch_summary.overall_status === 'RUNNING' || progress.batch_summary.overall_status === 'PENDING';
                        return (
                          <React.Fragment key={job.id}>
                            <tr>
                              <td>
                                <div style={{ fontWeight: 'bold' }}>{job.team.name}</div>
                                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>
                                  {job.match.home_team_name} vs {job.match.away_team_name}
                                </div>
                              </td>
                              <td>
                                {getStatusBadge(job.status)}
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <div style={{ display: 'inline-flex', gap: 'var(--space-sm)' }}>
                                  {job.error_message && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-secondary"
                                      onClick={() => setExpandedJobId(isExpanded ? null : job.id)}
                                      style={{ padding: '0 var(--space-sm)', height: '28px', fontSize: 'var(--text-xs)' }}
                                    >
                                      {isExpanded ? 'Hide Logs' : 'View Logs'}
                                    </button>
                                  )}
                                  {job.status === 'FAILED' && !isBatchActive && (
                                    <button
                                      type="button"
                                      className="btn btn-sm btn-primary"
                                      onClick={() => handleRetryJob(job.id)}
                                      style={{ padding: '0 var(--space-sm)', height: '28px', fontSize: 'var(--text-xs)' }}
                                    >
                                      Retry
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                            {isExpanded && job.error_message && (
                              <tr>
                                <td colSpan="3" style={{ background: 'rgba(239, 68, 68, 0.03)', padding: 'var(--space-md)' }}>
                                  <div style={{ color: 'var(--color-status-error)', fontSize: 'var(--text-xs)', fontFamily: 'var(--font-data)' }}>
                                    <div style={{ fontWeight: 'bold', marginBottom: 'var(--space-xs)' }}>Execution Traceback / Error Message:</div>
                                    <pre style={{
                                      margin: 0,
                                      padding: 'var(--space-sm)',
                                      background: 'var(--color-surface-secondary)',
                                      border: '1px solid var(--color-border)',
                                      borderRadius: 'var(--radius-small)',
                                      color: 'var(--color-status-error)',
                                      whiteSpace: 'pre-wrap',
                                      wordBreak: 'break-all'
                                    }}>
                                      {job.error_message}
                                    </pre>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-2xl)' }}>
              <div style={{ textAlign: 'center', color: 'var(--color-text-secondary)' }}>
                Select a batch from the history panel or start a new execution to view progress.
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default BatchModelExecutionView;
