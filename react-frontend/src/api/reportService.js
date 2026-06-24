import api from './axios';

export const ReportService = {
  getTeamBreakdown: async () => {
    const response = await api.get('/reports/team-breakdown');
    return response.data;
  },

  getMultiplierImpact: async () => {
    const response = await api.get('/reports/multiplier-impact');
    return response.data;
  },

  getRankAnalysis: async () => {
    const response = await api.get('/reports/rank-analysis');
    return response.data;
  },

  getPhaseContribution: async () => {
    const response = await api.get('/reports/phase-contribution');
    return response.data;
  }
};
