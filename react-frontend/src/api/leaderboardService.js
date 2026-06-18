import api from './axios';

export const LeaderboardService = {
  getLeaderboard: async () => {
    const res = await api.get('/leaderboard');
    return res.data;
  },
  calculateLeaderboard: async () => {
    const res = await api.post('/leaderboard/calculate');
    return res.data;
  }
};
