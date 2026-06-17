import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { MatchService } from '../../api/matchService';
import { PredictionService } from '../../api/predictionService';
import AddMatchModal from '../../components/matches/AddMatchModal';
import MatchDetailModal from '../../components/matches/MatchDetailModal';
import EnterResultModal from '../../components/matches/EnterResultModal';
import SubmitPredictionModal from '../../components/predictions/SubmitPredictionModal';

const statusBadge = (status) => {
  const s = (status || 'scheduled').toLowerCase();
  switch (s) {
    case 'completed':
    case 'scored':
    case 'result_entered':
      return <span className="badge badge-success">COMPLETED</span>;
    case 'frozen':
      return <span className="badge badge-error">FROZEN</span>;
    case 'scheduled':
      return <span className="badge badge-warning">SCHEDULED</span>;
    default:
      return <span className="badge badge-info">{s.toUpperCase()}</span>;
  }
};

const formatDate = (dateStr) => {
  if (!dateStr) return '?';
  try { return new Date(dateStr).toLocaleDateString(); } catch { return '?'; }
};

const formatTime = (dateStr) => {
  if (!dateStr) return '';
  try { return new Date(dateStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch { return ''; }
};

const MatchesView = () => {
  const { isOrganizer, isTeamLeader } = useAuth();

  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [addMatchOpen, setAddMatchOpen] = useState(false);
  const [detailMatch, setDetailMatch] = useState(null);
  const [enterResultMatch, setEnterResultMatch] = useState(null);
  const [predictionMatch, setPredictionMatch] = useState(null);

  const csvInputRef = useRef(null);

  const loadMatches = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const matchesData = await MatchService.listMatches();
      let predictionsData = [];
      try { predictionsData = await PredictionService.listPredictions(); } catch (e) { /* ignore */ }

      const matchesWithPreds = (Array.isArray(matchesData) ? matchesData : []).map(m => ({
        ...m,
        predictions: predictionsData.filter(p => p.match_id === m.id).length
      }));

      setMatches(matchesWithPreds);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Failed to load matches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadMatches(); }, [loadMatches]);

  const handleCsvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append('file', file);
    try {
      await MatchService.uploadMatchesCsv(fd);
      loadMatches();
    } catch (err) {
      setError(err.response?.data?.detail || err.message || 'Upload failed');
    }
    e.target.value = '';
  };

  const handleDelete = (matchId, label) => {
    if (!window.confirm(`Delete "${label}"? This cannot be undone.`)) return;
    MatchService.deleteMatch(matchId)
      .then(() => loadMatches())
      .catch(err => setError(err.response?.data?.detail || err.message || 'Delete failed'));
  };

  return (
    <div>
      <div className="page-header">
        <div className="page-header-left">
          <h1 className="page-title">⚽ Match Management</h1>
          <p className="page-subtitle">
            {isOrganizer
              ? 'Create matches, upload schedules, enter results and track predictions'
              : 'View matches and submit your predictions'}
          </p>
        </div>
        <div className="page-header-actions" style={{display: 'flex', gap: 'var(--space-sm)', flexWrap: 'wrap'}}>
          {isOrganizer && (
            <>
              <button className="btn btn-secondary" onClick={() => csvInputRef.current?.click()}>📁 Upload CSV</button>
              <input type="file" ref={csvInputRef} accept=".csv" style={{display: 'none'}} onChange={handleCsvUpload} />
              <button className="btn btn-primary" onClick={() => setAddMatchOpen(true)}>+ Add Match</button>
            </>
          )}
          <button className="btn btn-ghost" onClick={loadMatches}>🔄 Refresh</button>
        </div>
      </div>

      {error && <div className="alert alert-error" style={{marginBottom: 'var(--space-lg)'}}>{error}</div>}

      {isOrganizer && (
        <div className="alert alert-info" style={{marginBottom: 'var(--space-lg)'}}>
          <strong>CSV Format:</strong>&nbsp;
          <code>match_number,home_team,away_team,kickoff_date,round</code>
          &mdash; e.g. <code>1,Argentina,Brazil,2026-06-17T18:00:00,Final</code>
        </div>
      )}

      <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 'var(--space-lg)'}}>
        {loading ? (
          Array(6).fill(null).map((_, i) => (
            <div key={i} className="card" style={{animationDelay: `${i * 80}ms`}}>
              <div className="skeleton skeleton-title"></div>
              <div className="skeleton skeleton-text" style={{marginTop: 'var(--space-md)'}}></div>
              <div className="skeleton skeleton-card" style={{marginTop: 'var(--space-md)'}}></div>
            </div>
          ))
        ) : matches.length === 0 ? (
          <div className="empty-state" style={{gridColumn: '1/-1'}}>
            <div className="empty-icon">⚽</div>
            <h2 className="empty-title">No Matches Yet</h2>
            <p className="empty-desc">
              {isOrganizer
                ? 'Create your first match or upload a CSV schedule.'
                : 'Matches will appear here once the organizer adds them.'}
            </p>
          </div>
        ) : (
          matches.map((m, i) => {
            const home = m.home_team_name || m.home || '?';
            const away = m.away_team_name || m.away || '?';
            const status = (m.status || 'scheduled').toLowerCase();
            const isScored = status === 'scored' || status === 'completed' || status === 'result_entered';
            const canPredict = status === 'scheduled' || status === 'frozen';
            const dateStr = formatDate(m.scheduled_at);
            const timeStr = formatTime(m.scheduled_at);
            const homeScore = m.homeGoals ?? m.home_goals ?? m.actual_home_goals;
            const awayScore = m.awayGoals ?? m.away_goals ?? m.actual_away_goals;

            return (
              <div
                key={m.id}
                className="card match-card"
                style={{animationDelay: `${i * 80}ms`, cursor: 'pointer'}}
                onClick={() => setDetailMatch(m)}
              >
                <div className="match-card-header">
                  <span className="match-card-id">M{m.match_number || (i + 1)}</span>
                  {m.round && <span className="badge badge-info" style={{fontSize: 'var(--text-xs)'}}>{m.round}</span>}
                  {statusBadge(status)}
                </div>
                <div className="match-vs-area">
                  <div className="match-team">{home}</div>
                  {isScored ? (
                    <div className="match-score-display">{homeScore != null ? homeScore : '?'} &ndash; {awayScore != null ? awayScore : '?'}</div>
                  ) : (
                    <div className="match-vs-label">vs</div>
                  )}
                  <div className="match-team">{away}</div>
                  <div className="match-date">{dateStr}{timeStr ? ' ' + timeStr : ''}</div>
                </div>
                <div className="match-footer">
                  <span className="badge badge-info">📥 {m.predictions || 0}/5 predictions</span>
                  <div style={{display: 'flex', gap: 'var(--space-xs)'}}>
                    {canPredict && (isTeamLeader || isOrganizer) && (
                      <button className="btn btn-secondary btn-sm" onClick={e => { e.stopPropagation(); setPredictionMatch(m); }}>📝 Predict</button>
                    )}
                    {isOrganizer && (
                      <button className="btn btn-ghost btn-sm" title="Delete" onClick={e => { e.stopPropagation(); handleDelete(m.id, `${home} vs ${away}`); }}>🗑️</button>
                    )}
                    <button className="btn btn-ghost btn-sm" onClick={e => { e.stopPropagation(); setDetailMatch(m); }}>View &rarr;</button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <AddMatchModal
        isOpen={addMatchOpen}
        onClose={() => setAddMatchOpen(false)}
        onMatchCreated={loadMatches}
      />

      <MatchDetailModal
        match={detailMatch}
        isOpen={!!detailMatch}
        onClose={() => setDetailMatch(null)}
        onMatchUpdated={loadMatches}
        onEnterResult={() => { setEnterResultMatch(detailMatch); setDetailMatch(null); }}
      />

      <EnterResultModal
        match={enterResultMatch}
        isOpen={!!enterResultMatch}
        onClose={() => { setEnterResultMatch(null); setDetailMatch(null); }}
        onResultEntered={loadMatches}
      />

      <SubmitPredictionModal
        match={predictionMatch}
        isOpen={!!predictionMatch}
        onClose={() => { setPredictionMatch(null); setDetailMatch(null); }}
        onPredictionSubmitted={loadMatches}
      />
    </div>
  );
};

export default MatchesView;
