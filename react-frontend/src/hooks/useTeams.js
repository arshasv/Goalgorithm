import { useState, useEffect, useCallback } from 'react';
import { TeamService } from '../api/teamService';

const useTeams = (autoLoad = false) => {
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTeams = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await TeamService.listTeams();
      setTeams(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load teams');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoLoad) loadTeams();
  }, [autoLoad, loadTeams]);

  const handleUpload = async (file, uploadFn, successMsg, onSuccess) => {
    if (!file) return;
    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'csv' && ext !== 'xlsx') {
      setError('Invalid file format. Please select a CSV or Excel file (.csv, .xlsx)');
      return;
    }
    const fd = new FormData();
    fd.append('file', file);
    setError('');
    try {
      const result = await uploadFn(fd);
      if (onSuccess) onSuccess(result.message || successMsg);
      loadTeams();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to upload file');
    }
  };

  const downloadTemplate = async (downloadFn, filename) => {
    try {
      const blob = await downloadFn();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  return {
    teams,
    setTeams,
    loading,
    error,
    setError,
    loadTeams,
    handleUpload,
    downloadTemplate,
  };
};

export default useTeams;
