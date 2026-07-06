import api from './axios';

export const ModelExecutionService = {
  uploadModel: async (teamId, matchId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('team_id', teamId);
    formData.append('match_id', matchId);
    
    const res = await api.post('/model-execution/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  
  executeModel: async (modelId) => {
    const res = await api.post(`/model-execution/${modelId}/execute`);
    return res.data;
  },
  
  getExecutionStatus: async (executionId) => {
    const res = await api.get(`/model-execution/${executionId}/status`);
    return res.data;
  },

  discoverLatestModels: async () => {
    const res = await api.post('/batch-executions');
    return res.data;
  },

  createBatch: async (matchIds) => {
    const res = await api.post('/batch-executions/create', { match_ids: matchIds });
    return res.data;
  },

  executeBatch: async (batchId) => {
    const res = await api.post(`/batch-executions/${batchId}/execute`);
    return res.data;
  },

  getBatchProgress: async (batchId) => {
    const res = await api.get(`/batch-executions/${batchId}/progress`);
    return res.data;
  },

  listBatches: async () => {
    const res = await api.get('/batch-executions');
    return res.data;
  },

  cancelBatch: async (batchId) => {
    const res = await api.post(`/batch-executions/${batchId}/cancel`);
    return res.data;
  },

  retryBatch: async (batchId, forceAll = false) => {
    const res = await api.post(`/batch-executions/${batchId}/retry`, { force_all: forceAll });
    return res.data;
  },

  retryJob: async (jobId) => {
    const res = await api.post(`/batch-executions/jobs/${jobId}/retry`);
    return res.data;
  }
};
