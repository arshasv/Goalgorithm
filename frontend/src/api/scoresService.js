import api from './axios';

export const ScoresService = {
  getMatchBreakdown: async () => {
    const res = await api.get('/scores/match-breakdown');
    return res.data;
  },
  getDailyScores: async () => {
    const res = await api.get('/scores/daily');
    return res.data;
  },
  getTechnicalEvaluations: async () => {
    const res = await api.get('/evaluations/technical');
    return res.data;
  },
  getPresentationEvaluations: async () => {
    const res = await api.get('/evaluations/presentation');
    return res.data;
  }
};
