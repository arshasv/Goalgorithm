import api from './axios';

export const PredictionService = {
  submitPrediction: async (data) => {
    const res = await api.post('/predictions', data);
    return res.data;
  },
  listPredictions: async () => {
    const res = await api.get('/predictions');
    return res.data;
  }
};
