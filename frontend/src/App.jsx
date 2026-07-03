import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoginView from './pages/auth/LoginView';
import RegisterView from './pages/auth/RegisterView';
import ForgotPasswordView from './pages/auth/ForgotPasswordView';
import OrganizerDashboard from './pages/dashboard/OrganizerDashboard';
import TeamLeaderDashboard from './pages/dashboard/TeamLeaderDashboard';
import TeamsView from './pages/teams/TeamsView';
import MatchesView from './pages/matches/MatchesView';
import ScoringView from './pages/scoring/ScoringView';
import LeaderboardView from './pages/leaderboard/LeaderboardView';
import TechnicalView from './pages/technical/TechnicalView';
import PresentationView from './pages/presentation/PresentationView';
import PredictionsView from './pages/predictions/PredictionsView';
import AnalyticsView from './pages/analytics/AnalyticsView';
import FinalScoresView from './pages/finalscores/FinalScoresView';
import ScoringConfigView from './pages/scoringconfig/ScoringConfigView';
import ModelManagementView from './pages/modelmanagement/ModelManagementView';
import ModelSubmissionView from './pages/modelsubmission/ModelSubmissionView';
import LeaderboardSettingsView from './pages/leaderboardsettings/LeaderboardSettingsView';
import ModelEvaluation from './pages/modelevaluation/ModelEvaluation';
import ReportsView from './pages/reports/ReportsView';
import ModelExecutionView from './pages/modelexecution/ModelExecutionView';
import BatchModelExecutionView from './pages/modelexecution/BatchModelExecutionView';

const PrivateRoute = ({ element, roleRequired }) => {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) return null;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  
  if (roleRequired && user?.role !== roleRequired) {
    // If user accesses an unauthorized route, redirect to their home
    return <Navigate to="/" replace />;
  }
  
  return element;
};

const DashboardRouter = () => {
  const { user } = useAuth();
  if (user?.role === 'ORGANIZER') {
    return <Navigate to="/dashboard" replace />;
  }
  if (user?.role === 'TEAM_LEADER') {
    return <Navigate to="/team-dashboard" replace />;
  }
  return <Navigate to="/login" replace />;
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />
          <Route path="/forgot-password" element={<ForgotPasswordView />} />
          
          <Route element={<Layout />}>
            <Route path="/" element={<DashboardRouter />} />
            <Route 
              path="/dashboard" 
              element={<PrivateRoute element={<OrganizerDashboard />} roleRequired="ORGANIZER" />} 
            />
            <Route 
              path="/team-dashboard" 
              element={<PrivateRoute element={<TeamLeaderDashboard />} roleRequired="TEAM_LEADER" />} 
            />
            
            <Route 
              path="/teams" 
              element={<PrivateRoute element={<TeamsView />} roleRequired="ORGANIZER" />} 
            />
            
            <Route 
              path="/matches" 
              element={<PrivateRoute element={<MatchesView />} />} 
            />
            
            {/* Removed placeholders as migration is complete */}
            
            <Route 
              path="/scoring" 
              element={<PrivateRoute element={<ScoringView />} roleRequired="ORGANIZER" />} 
            />
            
            <Route 
              path="/leaderboard" 
              element={<PrivateRoute element={<LeaderboardView />} />} 
            />
            
            <Route 
              path="/technical" 
              element={<PrivateRoute element={<TechnicalView />} roleRequired="ORGANIZER" />} 
            />
            <Route 
              path="/presentation" 
              element={<PrivateRoute element={<PresentationView />} roleRequired="ORGANIZER" />} 
            />
            <Route 
              path="/predictions" 
              element={<PrivateRoute element={<PredictionsView />} roleRequired="ORGANIZER" />} 
            />
            <Route 
              path="/model-evaluation" 
              element={<PrivateRoute element={<ModelEvaluation />} roleRequired="ORGANIZER" />} 
            />
            <Route 
              path="/my-predictions" 
              element={<PrivateRoute element={<PredictionsView />} roleRequired="TEAM_LEADER" />} 
            />
            <Route 
              path="/analytics" 
              element={<PrivateRoute element={<AnalyticsView />} />} 
            />
            <Route 
              path="/reports" 
              element={<PrivateRoute element={<ReportsView />} roleRequired="ORGANIZER" />} 
            />
            <Route 
              path="/match-results" 
              element={<PrivateRoute element={<FinalScoresView />} roleRequired="ORGANIZER" />} 
            />
            <Route 
              path="/scoring-config" 
              element={<PrivateRoute element={<ScoringConfigView />} roleRequired="ORGANIZER" />} 
            />
            <Route 
              path="/prediction-upload" 
              element={<PrivateRoute element={<ModelManagementView />} roleRequired="ORGANIZER" />} 
            />
            <Route 
              path="/leaderboard-settings" 
              element={<PrivateRoute element={<LeaderboardSettingsView />} roleRequired="ORGANIZER" />} 
            />
            <Route 
              path="/submit-predictions" 
              element={<PrivateRoute element={<ModelSubmissionView />} roleRequired="TEAM_LEADER" />} 
            />
            <Route 
              path="/model-execution" 
              element={<PrivateRoute element={<ModelExecutionView />} roleRequired="ORGANIZER" />} 
            />
            <Route 
              path="/batch-execution" 
              element={<PrivateRoute element={<BatchModelExecutionView />} roleRequired="ORGANIZER" />} 
            />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
