import api from './axios';

export const LeaderboardService = {
  getLeaderboard: async () => {
    const res = await api.get('/leaderboard');
    return res.data;
  },
  calculateLeaderboard: async (entries) => {
    const res = await api.post('/leaderboard/calculate', entries);
    return res.data;
  }
};
