import { useState, useEffect, useCallback } from 'react';
import { MatchService } from '../api/matchService';

const useMatches = (autoLoad = false) => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await MatchService.listMatches();
      setMatches(Array.isArray(data) ? data : []);
    } catch (err) {
      let errorMsg = err.response?.data?.detail || err.message;
      if (errorMsg === 'Network Error' || err.code === 'ERR_NETWORK') {
        errorMsg = 'API unavailable. Please check your connection or server status.';
      }
      if (err.response?.status >= 500) {
        errorMsg = 'Backend server encountered an error.';
      }
      setError(errorMsg || 'Failed to load matches. API may be unavailable.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) loadMatches();
  }, [autoLoad, loadMatches]);

  return {
    matches,
    setMatches,
    loading,
    error,
    setError,
    loadMatches,
  };
};

export default useMatches;
