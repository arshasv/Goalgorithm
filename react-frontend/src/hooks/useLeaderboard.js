import { useState, useEffect, useCallback } from 'react';
import { LeaderboardService } from '../api/leaderboardService';

const useLeaderboard = (autoLoad = false) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [calculating, setCalculating] = useState(false);

  const loadLeaderboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await LeaderboardService.getLeaderboard();
      setLeaderboard(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) loadLeaderboard();
  }, [autoLoad, loadLeaderboard]);

  const calculateLeaderboard = useCallback(async () => {
    if (!window.confirm('Calculate leaderboard from all current scores?')) return;
    setCalculating(true);
    setError('');
    try {
      await LeaderboardService.calculateLeaderboard();
      await loadLeaderboard();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to calculate leaderboard');
    } finally {
      setCalculating(false);
    }
  }, [loadLeaderboard]);

  return {
    leaderboard,
    setLeaderboard,
    loading,
    error,
    setError,
    calculating,
    loadLeaderboard,
    calculateLeaderboard,
  };
};

export default useLeaderboard;
