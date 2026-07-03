import api from './axios';

export const ResultService = {
  submitActualResult: async (data) => {
    const res = await api.post('/actual-results', data);
    return res.data;
  },
  getActualResult: async (matchId) => {
    const res = await api.get(`/actual-results/${matchId}`);
    return res.data;
  }
};
