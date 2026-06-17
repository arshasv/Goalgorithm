import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { useAuth } from '../../contexts/AuthContext';

const ToastContainer = () => (
  <div className="toast-container" id="toast-container"></div>
);

const Layout = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="app-layout">
        <div className="main-content">
          <div className="page-content">
            <div className="empty-state">
              <div className="empty-icon">⚽</div>
              <h2 className="empty-title">Loading GOALGORITHM…</h2>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content" id="main-content">
        <Navbar />
        <main className="page-content" id="page-content">
          <Outlet />
        </main>
      </div>
      <ToastContainer />
    </div>
  );
};

export default Layout;
