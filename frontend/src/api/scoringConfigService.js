import api from './axios';

export const ScoringConfigService = {
  getGuidelines: async () => {
    const res = await api.get('/admin/scoring-config/guidelines');
    return res.data;
  },
  getActiveConfig: async () => {
    const res = await api.get('/admin/scoring-config/active');
    return res.data;
  },
  updateConfig: async (configId, data) => {
    const res = await api.put(`/admin/scoring-config/${configId}`, data);
    return res.data;
  },
  resetConfig: async () => {
    const res = await api.post('/admin/scoring-config/reset');
    return res.data;
  }
};
