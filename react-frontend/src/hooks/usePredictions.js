import { useState, useEffect, useCallback } from 'react';
import { PredictionService } from '../api/predictionService';

const usePredictions = (autoLoad = false) => {
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadPredictions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await PredictionService.listPredictions();
      setPredictions(Array.isArray(data) ? data : (data.predictions || []));
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load predictions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) loadPredictions();
  }, [autoLoad, loadPredictions]);

  return {
    predictions,
    setPredictions,
    loading,
    error,
    setError,
    loadPredictions,
  };
};

export default usePredictions;
