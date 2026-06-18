import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { ModelService } from '../../api/modelService';

const ModelSubmissionView = () => {
  const { isTeamLeader } = useAuth();

  const [windowConfig, setWindowConfig] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const windowData = await ModelService.getUploadWindow();
      setWindowConfig(windowData);
      const modelData = await ModelService.getMyModels();
      setSubmissions(modelData.submissions || []);
    } catch (err) {
      setError('Failed to load submission info: ' + (err.response?.data?.detail || err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { 
    if (isTeamLeader) {
      loadData(); 
    }
  }, [isTeamLeader]);

  const isOpen = (() => {
    if (!windowConfig || !windowConfig.is_enabled) return false;
    const now = new Date();
    const start = windowConfig.start_time ? new Date(windowConfig.start_time) : null;
    const end = windowConfig.end_time ? new Date(windowConfig.end_time) : null;
    if (start && now < start) return false;
    if (end && now > end) return false;
    return true;
  })();

  const getWindowStatusMsg = () => {
    if (!windowConfig || !windowConfig.is_enabled) {
      return 'The model submission window is currently closed.';
    }
    const now = new Date();
    const start = windowConfig.start_time ? new Date(windowConfig.start_time) : null;
    const end = windowConfig.end_time ? new Date(windowConfig.end_time) : null;
    if (start && now < start) {
      return `The model submission window will open at ${start.toLocaleString()}.`;
    }
    let msg = 'The model submission window is open.';
    if (end) msg += ` Closes at ${end.toLocaleString()}.`;
    return msg;
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) setSelectedFile(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (dropRef.current) dropRef.current.style.backgroundColor = 'transparent';
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (dropRef.current) dropRef.current.style.backgroundColor = 'var(--color-bg-secondary)';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    if (dropRef.current) dropRef.current.style.backgroundColor = 'transparent';
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select a file to upload');
      return;
    }
    setUploading(true);
    try {
      await ModelService.uploadModel(selectedFile);
      alert('Model uploaded successfully!');
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await loadData();
    } catch (err) {
      alert('Failed to upload model: ' + (err.response?.data?.detail || err.message || ''));
    } finally {
      setUploading(false);
    }
  };

  if (!isTeamLeader) {
    return (
      <div className="empty-state">
        <div className="empty-icon">🔒</div>
        <h2 className="empty-title">Access Denied</h2>
      </div>
    );
  }

  const activeSubmission = submissions.find(s => s.is_active);

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">🤖 Model Submission</h1>
          <p className="page-subtitle">Upload your team's prediction model code</p>
        </div>
        <div className="page-header-actions">
          <button className="btn btn-secondary" onClick={loadData}>🔄 Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 'var(--space-md)' }}>{error}</div>}

      {loading ? (
        <div className="card">
          <div className="card-header"><h3 className="card-title">Loading...</h3></div>
          <div style={{ padding: 'var(--space-md)' }}>
            <div className="skeleton skeleton-text"></div>
            <div className="skeleton skeleton-card" style={{ marginTop: 'var(--space-md)' }}></div>
          </div>
        </div>
      ) : (
        <>
          {/* Top: Model upload section */}
          <div className="card" style={{ marginBottom: 'var(--space-lg)' }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 className="card-title">{activeSubmission ? 'Upload New Version' : 'Upload Model'}</h3>
              <span className={`badge ${isOpen ? 'badge-success' : 'badge-error'}`}>{isOpen ? 'Open' : 'Closed'}</span>
            </div>
            <div style={{ padding: 'var(--space-md)' }}>
              <p style={{ marginBottom: 'var(--space-md)' }}>{getWindowStatusMsg()}</p>

              {isOpen && (
                <>
                  <div
                    ref={dropRef}
                    onClick={() => fileInputRef.current?.click()}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    style={{
                      border: '2px dashed var(--color-border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-xl)',
                      textAlign: 'center',
                      cursor: 'pointer',
                      marginBottom: 'var(--space-md)',
                      transition: 'background-color 0.2s',
                    }}
                  >
                    <div style={{ fontSize: '2rem', marginBottom: 'var(--space-sm)' }}>📥</div>
                    <div style={{ fontWeight: 500, marginBottom: 'var(--space-xs)' }}>Drag and drop your model file here</div>
                    <div style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>or click to select a file</div>
                    <input
                      type="file"
                      ref={fileInputRef}
                      style={{ display: 'none' }}
                      accept=".pkl,.pickle,.pt,.pth,.h5,.joblib,.onnx,.sav"
                      onChange={handleFileChange}
                    />
                  </div>

                  {selectedFile && (
                    <div style={{ marginBottom: 'var(--space-md)', fontWeight: 500 }}>
                      Selected: {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </div>
                  )}

                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)' }}>
                    Allowed formats: .pkl, .pickle, .pt, .pth, .h5, .joblib, .onnx, .sav. Max file size: 50MB
                  </p>

                  <button
                    className="btn btn-primary"
                    onClick={handleUpload}
                    disabled={!selectedFile || uploading}
                  >
                    {uploading ? '📤 Uploading...' : '📤 Upload File'}
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Bottom: Uploaded models/history */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Submission History</h3>
            </div>
            <div style={{ padding: 'var(--space-md)' }}>
              {submissions.length === 0 ? (
                <div className="empty-state" style={{ padding: 'var(--space-xl) 0' }}>
                  <div className="empty-icon">📁</div>
                  <h3 className="empty-title">No Model Uploaded</h3>
                  <p className="empty-desc">Your team has not uploaded a model yet.</p>
                </div>
              ) : (
                <>
                  <div className="alert alert-success" style={{ marginBottom: 'var(--space-md)' }}>
                    <strong>Model Uploaded Successfully</strong>
                  </div>
                  <div style={{ marginTop: 'var(--space-lg)' }}>
                    {submissions.map((sub, idx) => {
                      const isLatest = sub.is_active;
                      const badge = isLatest
                        ? <span className="badge badge-success">Latest</span>
                        : <span className="badge badge-info">Archive</span>;
                      return (
                        <div key={sub.id} style={{
                          background: isLatest ? 'var(--color-bg-secondary)' : 'transparent',
                          border: isLatest ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                          padding: 'var(--space-md)',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: 'var(--space-md)',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
                            <span style={{ fontWeight: 500, display: 'flex', alignItems: 'center', gap: 'var(--space-sm)' }}>
                              {sub.file_name} {badge}
                            </span>
                            <span style={{ color: 'var(--color-text-muted)', fontSize: 'var(--text-sm)' }}>
                              Version {submissions.length - idx}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-sm)', fontSize: 'var(--text-sm)' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>File Size</span>
                            <span>{(sub.file_size / 1024 / 1024).toFixed(2)} MB</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                            <span style={{ color: 'var(--color-text-muted)' }}>Uploaded At</span>
                            <span>{new Date(sub.uploaded_at).toLocaleString()}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ModelSubmissionView;
