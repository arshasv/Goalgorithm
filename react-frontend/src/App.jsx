import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/layout/Layout';
import LoginView from './pages/auth/LoginView';
import RegisterView from './pages/auth/RegisterView';
import OrganizerDashboard from './pages/dashboard/OrganizerDashboard';
import TeamLeaderDashboard from './pages/dashboard/TeamLeaderDashboard';
import TeamsView from './pages/teams/TeamsView';
import MatchesView from './pages/matches/MatchesView';

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
              element={<PrivateRoute element={<MatchesView />} roleRequired="ORGANIZER" />} 
            />
            
            {/* Placeholders for upcoming feature migrations */}
            <Route path="/predictions" element={<div>Predictions Feature Placeholder</div>} />
            <Route path="/scoring" element={<div>Scoring Feature Placeholder</div>} />
            <Route path="/leaderboard" element={<div>Leaderboard Feature Placeholder</div>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
};

export default App;
