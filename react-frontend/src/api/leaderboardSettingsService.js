import api from './axios';

export const LeaderboardSettingsService = {
  getSettings: async () => {
    const res = await api.get('/admin/leaderboard/settings');
    return res.data;
  },
  updateSettings: async (settings) => {
    const res = await api.put('/admin/leaderboard/settings', settings);
    return res.data;
  }
};
