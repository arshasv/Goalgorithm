import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { LeaderboardSettingsService } from '../../api/leaderboardSettingsService';

const Sidebar = () => {
  const { isOrganizer, isTeamLeader } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPage = location.pathname.replace('/', '') || 'dashboard';
  const [analyticsEnabled, setAnalyticsEnabled] = useState(false);

  useEffect(() => {
    if (isTeamLeader) {
      LeaderboardSettingsService.getSettings()
        .then(data => setAnalyticsEnabled(data.analytics_visibility_enabled))
        .catch(() => setAnalyticsEnabled(false));
    }
  }, [isTeamLeader]);

  const nav = (page) => {
    navigate('/' + page);
  };

  const isActive = (page) => currentPage === page ? 'nav-item active' : 'nav-item';

  return (
    <aside className="sidebar" id="sidebar">
      <button className="sidebar-toggle" id="sidebar-toggle" title="Toggle sidebar">☰</button>
      <nav>
        {isOrganizer && (
          <>
            <div className="nav-section" id="org-nav-section">
              <div className="nav-section-title">Main</div>
              <a className={isActive('dashboard')} data-page="dashboard" onClick={() => nav('dashboard')}>
                <span className="nav-icon">🏠</span><span className="nav-label">Dashboard</span>
              </a>
              <a className={isActive('leaderboard')} data-page="leaderboard" onClick={() => nav('leaderboard')}>
                <span className="nav-icon">🏆</span><span className="nav-label">Leaderboard</span>
              </a>
              <a className={isActive('teams')} data-page="teams" onClick={() => nav('teams')}>
                <span className="nav-icon">👥</span><span className="nav-label">Teams</span>
              </a>
              <a className={isActive('prediction-upload')} data-page="prediction-upload" onClick={() => nav('prediction-upload')}>
                <span className="nav-icon">🤖</span><span className="nav-label">Model Mgmt</span>
              </a>
              <a className={isActive('match-results')} data-page="match-results" onClick={() => nav('match-results')}>
                <span className="nav-icon">📊</span><span className="nav-label">Final Scores</span>
              </a>
            </div>
            <div className="nav-section" id="org-nav-matches">
              <div className="nav-section-title">Matches</div>
              <a className={isActive('matches')} data-page="matches" onClick={() => nav('matches')}>
                <span className="nav-icon">⚽</span><span className="nav-label">Match Results</span>
              </a>
              <a className={isActive('scoring')} data-page="scoring" onClick={() => nav('scoring')}>
                <span className="nav-icon">⚡</span><span className="nav-label">Scoring Engine</span>
              </a>
              <a className={isActive('predictions')} data-page="predictions" onClick={() => nav('predictions')}>
                <span className="nav-icon">📋</span><span className="nav-label">Predictions</span>
              </a>
            </div>
            <div className="nav-section" id="org-nav-eval">
              <div className="nav-section-title">Evaluation</div>
              <a className={isActive('model-evaluation')} data-page="model-evaluation" onClick={() => nav('model-evaluation')}>
                <span className="nav-icon">🤖</span><span className="nav-label">Model Evaluation</span>
              </a>
              <a className={isActive('technical')} data-page="technical" onClick={() => nav('technical')}>
                <span className="nav-icon">💻</span><span className="nav-label">Technical Eval</span>
              </a>
              <a className={isActive('presentation')} data-page="presentation" onClick={() => nav('presentation')}>
                <span className="nav-icon">🎤</span><span className="nav-label">Presentation Eval</span>
              </a>
            </div>
            <div className="nav-section" id="org-nav-intel">
              <div className="nav-section-title">Intelligence</div>
              <a className={isActive('analytics')} data-page="analytics" onClick={() => nav('analytics')}>
                <span className="nav-icon">📈</span><span className="nav-label">Analytics</span>
              </a>
              <a className={isActive('reports')} data-page="reports" onClick={() => nav('reports')}>
                <span className="nav-icon">📑</span><span className="nav-label">Reports</span>
              </a>
              <a className={isActive('scoring-config')} data-page="scoring-config" onClick={() => nav('scoring-config')}>
                <span className="nav-icon">⚙️</span><span className="nav-label">Scoring Config</span>
              </a>
              <a className={isActive('leaderboard-settings')} data-page="leaderboard-settings" onClick={() => nav('leaderboard-settings')}>
                <span className="nav-icon">👁️</span><span className="nav-label">Leaderboard Settings</span>
              </a>
            </div>
          </>
        )}
        {isTeamLeader && (
          <>
            <div className="nav-section" id="tl-nav-section">
              <div className="nav-section-title">Main</div>
              <a className={isActive('team-dashboard')} data-page="team-dashboard" onClick={() => nav('team-dashboard')}>
                <span className="nav-icon">🏠</span><span className="nav-label">Team Dashboard</span>
              </a>
              <a className={isActive('submit-predictions')} data-page="submit-predictions" onClick={() => nav('submit-predictions')}>
                <span className="nav-icon">🤖</span><span className="nav-label">Model Submission</span>
              </a>
            </div>
            <div className="nav-section" id="tl-nav-matches">
              <div className="nav-section-title">Matches</div>
              <a className={isActive('matches')} data-page="matches" onClick={() => nav('matches')}>
                <span className="nav-icon">⚽</span><span className="nav-label">Match Results</span>
              </a>
              <a className={isActive('my-predictions')} data-page="my-predictions" onClick={() => nav('my-predictions')}>
                <span className="nav-icon">📋</span><span className="nav-label">Predictions</span>
              </a>
            </div>
            <div className="nav-section" id="tl-nav-stats">
              <div className="nav-section-title">Standings</div>
              <a className={isActive('leaderboard')} data-page="leaderboard" onClick={() => nav('leaderboard')}>
                <span className="nav-icon">🏆</span><span className="nav-label">Leaderboard</span>
              </a>
              {analyticsEnabled && (
                <a className={isActive('analytics')} data-page="analytics" onClick={() => nav('analytics')}>
                  <span className="nav-icon">📈</span><span className="nav-label">Analytics</span>
                </a>
              )}
            </div>
          </>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;
