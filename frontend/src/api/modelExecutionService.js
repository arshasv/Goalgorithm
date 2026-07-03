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
  }
};
