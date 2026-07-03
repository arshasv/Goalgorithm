import api from './axios';

export const AnalyticsService = {
  getOverview: async () => {
    const res = await api.get('/analytics/overview');
    return res.data;
  },
  getModels: async () => {
    const res = await api.get('/analytics/models');
    return res.data;
  },
  getPresentation: async () => {
    const res = await api.get('/analytics/presentation');
    return res.data;
  },
  getJudges: async () => {
    const res = await api.get('/analytics/judges');
    return res.data;
  },
  getTeam: async (teamId) => {
    const res = await api.get(`/analytics/team/${teamId}`);
    return res.data;
  },
};
