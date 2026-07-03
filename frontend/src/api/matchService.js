import api from './axios';

export const MatchService = {
  listMatches: async () => {
    const res = await api.get('/matches');
    return res.data;
  },
  createMatch: async (data) => {
    const res = await api.post('/matches', data);
    return res.data;
  },
  updateMatch: async (matchId, data) => {
    const res = await api.put(`/matches/${matchId}`, data);
    return res.data;
  },
  deleteMatch: async (matchId) => {
    const res = await api.delete(`/matches/${matchId}`);
    return res.data;
  },
  uploadMatchesCsv: async (formData) => {
    const res = await api.post('/matches/upload-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  importApiMatches: async (target_date) => {
    const res = await api.post('/external-matches/import', { target_date });
    return res.data;
  },
  syncApiResults: async () => {
    const res = await api.post('/external-matches/sync-results');
    return res.data;
  }
};
