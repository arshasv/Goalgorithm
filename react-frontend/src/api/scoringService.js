import api from './axios';

export const ScoringService = {
  calculateMatchScoreBulk: async (matchId) => {
    const res = await api.post(`/matches/${matchId}/calculate-scores`);
    return res.data;
  },
  getMatchBreakdown: async () => {
    const res = await api.get('/scores/match-breakdown');
    return res.data;
  },
  calculateTechnical: async (payload) => {
    const res = await api.post('/technical-score', payload);
    return res.data;
  },
  calculatePresentation: async (evaluations, roundId) => {
    let url = '/presentation-score';
    if (roundId) url += `?round_id=${roundId}`;
    const res = await api.post(url, evaluations);
    return res.data;
  },
  listPresentationRounds: async () => {
    const res = await api.get('/presentation-rounds');
    return res.data;
  },
  createPresentationRound: async (name) => {
    const res = await api.post('/presentation-rounds', { name });
    return res.data;
  },
  listJudges: async () => {
    const res = await api.get('/judges');
    return res.data;
  },
  createJudge: async (payload) => {
    const res = await api.post('/judges', payload);
    return res.data;
  },
  deleteJudge: async (id) => {
    const res = await api.delete(`/judges/${id}`);
    return res.data;
  },
  uploadPresentationCSV: async (file, roundId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (roundId) {
      formData.append('round_id', roundId);
    }
    const res = await api.post('/presentation-score/upload-csv', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },
  downloadPresentationTemplate: async () => {
    const res = await api.get('/presentation-score/template', { responseType: 'blob' });
    const url = window.URL.createObjectURL(new Blob([res.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'presentation_scores_template.csv');
    document.body.appendChild(link);
    link.click();
    link.remove();
  },
  resetPresentationScores: async (roundId) => {
    let url = '/presentation-score/reset';
    if (roundId) url += `?round_id=${roundId}`;
    const res = await api.post(url);
    return res.data;
  },
  resetPredictionScores: async () => {
    const res = await api.post('/reset-predictions');
    return res.data;
  },
  resetAllScores: async () => {
    const res = await api.post('/reset-all');
    return res.data;
  }
};

