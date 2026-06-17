import api from './axios';

export const ScoresService = {
  getMatchBreakdown: async () => {
    const res = await api.get('/scores/match-breakdown');
    return res.data;
  }
};
