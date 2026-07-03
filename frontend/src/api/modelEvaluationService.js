import axiosInstance from './axios';

export const getSubmittedModels = async () => {
  const response = await axiosInstance.get('/api/v1/model-evaluations/models');
  return response.data;
};

export const saveModelEvaluation = async (evaluationData) => {
  const response = await axiosInstance.post('/api/v1/model-evaluations', evaluationData);
  return response.data;
};

export const getModelAnalytics = async () => {
  const response = await axiosInstance.get('/api/v1/model-evaluations/analytics');
  return response.data;
};
