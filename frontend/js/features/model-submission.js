/* Team Leader Model Submission Page */

Router.register('model-submission', async () => {
  const main = document.getElementById('page-content');
  if (!Auth.isTeamLeader()) {
    main.innerHTML = '<div class="empty-state"><div class="empty-icon">🔒</div><h2 class="empty-title">Access Denied</h2></div>';
    return;
  }

  main.innerHTML = `
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">🤖 Model Submission</h1>
        <p class="page-subtitle">Upload your team's prediction model code</p>
      </div>
      <div class="page-header-actions">
        <button class="btn btn-secondary" onclick="loadModelSubmission()">🔄 Refresh</button>
      </div>
    </div>
    
    <div id="model-submission-content">${Utils.skeletonCards(2)}</div>
  `;

  await loadModelSubmission();
});

async function loadModelSubmission() {
  const container = document.getElementById('model-submission-content');
  if (!container) return;

  try {
    const [windowConfig, submissionsResp] = await Promise.all([
      UploadWindowService.get(),
      ModelSubmissionService.listMyModels().catch(() => ({ submissions: [] }))
    ]);

    const submissions = submissionsResp.submissions || [];
    const activeSubmission = submissions.find(s => s.is_active);

    let isOpen = false;
    let windowStatusMsg = "The model submission window is currently closed.";
    
    if (windowConfig && windowConfig.is_enabled) {
      const now = new Date();
      const start = windowConfig.start_time ? new Date(windowConfig.start_time) : null;
      const end = windowConfig.end_time ? new Date(windowConfig.end_time) : null;
      
      if ((!start || now >= start) && (!end || now <= end)) {
        isOpen = true;
        windowStatusMsg = "The model submission window is open.";
        if (end) {
          windowStatusMsg += ` Closes at ${end.toLocaleString()}.`;
        }
      } else if (start && now < start) {
        windowStatusMsg = `The model submission window will open at ${start.toLocaleString()}.`;
      }
    }

    const statusBadge = isOpen 
      ? '<span class="badge badge-success">Open</span>' 
      : '<span class="badge badge-error">Closed</span>';

    let historyHtml = '';
    if (submissions.length > 0) {
      const rows = submissions.map((sub, idx) => {
        const isLatest = sub.is_active;
        const badge = isLatest ? '<span class="badge badge-success">Latest</span>' : '<span class="badge badge-info">Archive</span>';
        const bg = isLatest ? 'background:var(--color-bg-secondary); border-color:var(--color-primary)' : 'background:transparent';
        
        return `
          <div style="${bg}; border: 1px solid var(--color-border); padding:var(--space-md); border-radius:var(--radius-md); margin-bottom:var(--space-md)">
            <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-sm)">
              <span style="font-weight:500; display:flex; align-items:center; gap:var(--space-sm)">${sub.file_name} ${badge}</span>
              <span style="color:var(--color-text-muted); font-size:var(--text-sm)">Version ${submissions.length - idx}</span>
            </div>
            <div style="display:flex; justify-content:space-between; margin-bottom:var(--space-sm); font-size:var(--text-sm)">
              <span style="color:var(--color-text-muted)">File Size</span>
              <span>${(sub.file_size / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div style="display:flex; justify-content:space-between; font-size:var(--text-sm)">
              <span style="color:var(--color-text-muted)">Uploaded At</span>
              <span>${new Date(sub.uploaded_at).toLocaleString()}</span>
            </div>
          </div>
        `;
      }).join('');
      
      historyHtml = `
        <div style="margin-top:var(--space-lg)">
          <h4 style="margin-bottom:var(--space-md)">Upload History</h4>
          ${rows}
        </div>
      `;
    }

    const submissionInfo = submissions.length > 0
      ? `
        <div class="alert alert-success" style="margin-bottom:var(--space-md)">
          <strong>Model Uploaded Successfully</strong>
        </div>
        ${historyHtml}
      `
      : `
        <div class="empty-state" style="padding:var(--space-xl) 0">
          <div class="empty-icon">📁</div>
          <h3 class="empty-title">No Model Uploaded</h3>
          <p class="empty-desc">Your team has not uploaded a model yet.</p>
        </div>
      `;

    const uploadForm = isOpen
      ? `
        <div class="card" style="margin-top:var(--space-lg)">
          <div class="card-header">
            <h3 class="card-title">${activeSubmission ? 'Upload New Version' : 'Upload Model'}</h3>
          </div>
          <div style="padding:var(--space-md)">
            <div id="drop-zone" style="border: 2px dashed var(--color-border); border-radius: var(--radius-md); padding: var(--space-xl); text-align: center; cursor: pointer; margin-bottom: var(--space-md); transition: background-color 0.2s;">
              <div style="font-size: 2rem; margin-bottom: var(--space-sm)">📥</div>
              <div style="font-weight: 500; margin-bottom: var(--space-xs)">Drag and drop your model file here</div>
              <div style="color: var(--color-text-muted); font-size: var(--text-sm)">or click to select a file</div>
              <input type="file" id="model-file-input" style="display:none" accept=".pkl,.pickle,.pt,.pth,.h5,.joblib,.onnx,.sav">
            </div>
            <div id="selected-file-name" style="margin-bottom: var(--space-md); font-weight: 500; display: none;"></div>
            <p style="font-size:var(--text-xs); color:var(--color-text-muted); margin-bottom:var(--space-md)">Allowed formats: .pkl, .pickle, .pt, .pth, .h5, .joblib, .onnx, .sav. Max file size: 50MB</p>
            <button id="upload-btn" class="btn btn-primary" onclick="uploadModelFile()" disabled>📤 Upload File</button>
          </div>
        </div>
      `
      : '';

    container.innerHTML = `
      <div class="card" style="margin-bottom:var(--space-lg)">
        <div class="card-header" style="display:flex; justify-content:space-between; align-items:center">
          <h3 class="card-title">Submission Status</h3>
          ${statusBadge}
        </div>
        <div style="padding:var(--space-md)">
          <p style="margin-bottom:var(--space-md)">${windowStatusMsg}</p>
          ${submissionInfo}
        </div>
      </div>
      
      ${uploadForm}
    `;

    if (isOpen) {
      setupDragAndDrop();
    }

  } catch (err) {
    container.innerHTML = `<div class="alert alert-error">Failed to load submission info: ${err.message}</div>`;
  }
}

function setupDragAndDrop() {
  const dropZone = document.getElementById('drop-zone');
  const fileInput = document.getElementById('model-file-input');
  const fileNameDisplay = document.getElementById('selected-file-name');
  const uploadBtn = document.getElementById('upload-btn');

  if (!dropZone || !fileInput) return;

  dropZone.addEventListener('click', () => fileInput.click());

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'var(--color-bg-secondary)';
  });

  dropZone.addEventListener('dragleave', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'transparent';
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.backgroundColor = 'transparent';
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      fileInput.files = e.dataTransfer.files;
      updateFileDisplay();
    }
  });

  fileInput.addEventListener('change', updateFileDisplay);

  function updateFileDisplay() {
    if (fileInput.files && fileInput.files.length > 0) {
      const file = fileInput.files[0];
      fileNameDisplay.textContent = `Selected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
      fileNameDisplay.style.display = 'block';
      uploadBtn.disabled = false;
    } else {
      fileNameDisplay.style.display = 'none';
      uploadBtn.disabled = true;
    }
  }
}

async function uploadModelFile() {
  const fileInput = document.getElementById('model-file-input');
  const file = fileInput.files ? fileInput.files[0] : null;
  if (!file) {
    Toast.error('Please select a file to upload');
    return;
  }

  const formData = new FormData();
  formData.append('file', file);

  try {
    Toast.info('Uploading model...');
    document.getElementById('upload-btn').disabled = true;
    await ModelSubmissionService.uploadModel(formData);
    Toast.success('Model uploaded successfully');
    await loadModelSubmission();
  } catch (err) {
    document.getElementById('upload-btn').disabled = false;
    Toast.error(err.message || 'Failed to upload model');
  }
}
