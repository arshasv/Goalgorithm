import React, { useState, useEffect, useRef } from 'react';
import { MatchService } from '../../api/matchService';
import AddMatchModal from '../../components/matches/AddMatchModal';
import MatchDetailModal from '../../components/matches/MatchDetailModal';
import EnterResultModal from '../../components/matches/EnterResultModal';

const MatchesView = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedMatchForDetail, setSelectedMatchForDetail] = useState(null);
  const [selectedMatchForResult, setSelectedMatchForResult] = useState(null);

  const fileInputRef = useRef(null);

  const loadMatches = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await MatchService.listMatches();
      setMatches(data);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMatches();
  }, []);

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const ext = file.name.split('.').pop().toLowerCase();
    if (ext !== 'csv') {
      alert('Only .csv files supported.');
      e.target.value = '';
      return;
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      await MatchService.uploadMatchesCsv(formData);
      loadMatches();
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Failed to upload schedule');
    } finally {
      e.target.value = '';
    }
  };

  const handleDeleteMatch = async (e, matchId, label) => {
    e.stopPropagation();
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    try {
      await MatchService.deleteMatch(matchId);
      loadMatches();
    } catch (err) {
      alert(err.response?.data?.detail || err.message || 'Delete failed');
    }
  };

  const getStatusBadge = (status) => {
    const s = (status || 'scheduled').toLowerCase();
    switch (s) {
      case 'completed':
      case 'scored':
        return <span className="badge badge-success">COMPLETED</span>;
      case 'frozen':
        return <span className="badge badge-error">FROZEN</span>;
      case 'scheduled':
        return <span className="badge badge-warning">SCHEDULED</span>;
      default:
        return <span className="badge badge-info">{s.toUpperCase()}</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">⚽ Match Management</h1>
          <p className="page-subtitle">Create matches, upload schedules, enter results and track predictions</p>
        </div>
        <div className="page-header-actions" style={{ display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => fileInputRef.current?.click()}>📁 Upload CSV</button>
          <input type="file" ref={fileInputRef} accept=".csv" style={{ display: 'none' }} onChange={handleCsvUpload} />
          <button className="btn btn-primary" onClick={() => setIsAddModalOpen(true)}>+ Add Match</button>
          <button className="btn btn-ghost" onClick={loadMatches}>🔄 Refresh</button>
        </div>
      </div>

      <div className="alert alert-info" style={{ marginBottom: 'var(--space-lg)' }}>
        <strong>CSV Format:</strong>&nbsp;
        <code>match_number,home_team,away_team,kickoff_date,round</code>
        &mdash; e.g. <code>1,Argentina,Brazil,2026-06-17T18:00:00,Final</code>
      </div>

      {error && <div className="alert alert-error" style={{marginBottom: 'var(--space-lg)'}}>{error}</div>}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
          <div className="skeleton-card" style={{height: '180px'}}></div>
          <div className="skeleton-card" style={{height: '180px'}}></div>
          <div className="skeleton-card" style={{height: '180px'}}></div>
        </div>
      ) : matches.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">⚽</div>
          <h2 className="empty-title">No Matches Yet</h2>
          <p className="empty-desc">Create your first match or upload a CSV schedule.</p>
        </div>
      ) : (
        <div id="match-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-lg)' }}>
          {matches.map((m, i) => {
            const home = m.home_team_name || m.home || '?';
            const away = m.away_team_name || m.away || '?';
            const status = (m.status || 'scheduled').toLowerCase();
            const isScored = status === 'scored' || status === 'completed' || status === 'result_entered';
            const dateObj = m.scheduled_at ? new Date(m.scheduled_at) : null;
            const dateStr = dateObj ? dateObj.toLocaleDateString() : '?';
            const timeStr = dateObj ? dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '';
            
            const homeScore = m.actual_home_goals ?? m.home_goals;
            const awayScore = m.actual_away_goals ?? m.away_goals;

            return (
              <div key={m.id} className="card match-card" style={{ animationDelay: `${i * 80}ms`, cursor: 'pointer' }} onClick={() => setSelectedMatchForDetail(m)}>
                <div className="match-card-header">
                  <span className="match-card-id">M{m.match_number || (i+1)}</span>
                  {m.round && <span className="badge badge-info" style={{fontSize: 'var(--text-xs)'}}>{m.round}</span>}
                  {getStatusBadge(m.status)}
                </div>
                <div className="match-vs-area">
                  <div className="match-team">{home}</div>
                  {isScored && homeScore != null ? (
                    <div className="match-score-display">{homeScore} – {awayScore}</div>
                  ) : (
                    <div className="match-vs-label">vs</div>
                  )}
                  <div className="match-team">{away}</div>
                  <div className="match-date">{dateStr} {timeStr}</div>
                </div>
                <div className="match-footer" style={{ justifyContent: 'flex-end' }}>
                  <div style={{ display: 'flex', gap: 'var(--space-xs)' }}>
                    <button className="btn btn-ghost btn-sm" title="Delete" onClick={(e) => handleDeleteMatch(e, m.id, `${home} vs ${away}`)}>🗑️</button>
                    <button className="btn btn-ghost btn-sm">View &rarr;</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AddMatchModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onMatchCreated={loadMatches} 
      />

      <MatchDetailModal 
        match={selectedMatchForDetail} 
        isOpen={!!selectedMatchForDetail} 
        onClose={() => setSelectedMatchForDetail(null)} 
        onMatchUpdated={() => {
          loadMatches();
          MatchService.listMatches().then(data => {
            const updated = data.find(m => m.id === selectedMatchForDetail.id);
            setSelectedMatchForDetail(updated || null);
          });
        }}
        onEnterResult={() => setSelectedMatchForResult(selectedMatchForDetail)}
      />

      <EnterResultModal 
        match={selectedMatchForResult} 
        isOpen={!!selectedMatchForResult} 
        onClose={() => setSelectedMatchForResult(null)} 
        onResultEntered={loadMatches} 
      />
    </div>
  );
};

export default MatchesView;
