import api from './axios';

export const ScoringService = {
  calculateMatchScoreBulk: async (matchId) => {
    const res = await api.post(`/matches/${matchId}/calculate-scores`);
    return res.data;
  },
  getMatchBreakdown: async () => {
    const res = await api.get('/scores/match-breakdown');
    return res.data;
  }
};
