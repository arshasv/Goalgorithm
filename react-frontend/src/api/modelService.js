import api from './axios';

export const ModelService = {
  getMyModels: async () => {
    const res = await api.get('/teams/my-team/models');
    return res.data;
  },
  getAllModels: async () => {
    const res = await api.get('/admin/models');
    return res.data;
  },
  uploadModel: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await api.post('/teams/my-team/model', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  getUploadWindow: async () => {
    const res = await api.get('/upload-window');
    return res.data;
  },
  updateUploadWindow: async (data) => {
    const res = await api.put('/upload-window', data);
    return res.data;
  },
  downloadModel: async (submissionId, filename) => {
    const res = await api.get(`/admin/models/${submissionId}/download`, {
      responseType: 'blob'
    });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }
};
