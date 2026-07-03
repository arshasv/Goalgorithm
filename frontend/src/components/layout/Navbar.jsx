import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLocation, Link } from 'react-router-dom';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const path = location.pathname.replace('/', '') || 'dashboard';
  const breadcrumb = path.charAt(0).toUpperCase() + path.slice(1).replace(/-/g, ' ');
  const isOrg = user?.role === 'ORGANIZER';

  const [theme, setTheme] = useState('dark');

  useEffect(() => {
    const saved = localStorage.getItem('fifa-theme');
    const sys = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const initial = saved || 'dark'; // default to dark as per original
    setTheme(initial);
    applyTheme(initial, false);
  }, []);

  const applyTheme = (newTheme, animate = true) => {
    if (animate) {
      document.body.classList.add('theme-transitioning');
      clearTimeout(window._themeTr);
      window._themeTr = setTimeout(() => {
        document.body.classList.remove('theme-transitioning');
      }, 600);
    }

    if (newTheme === 'light') document.documentElement.setAttribute('data-theme', 'light');
    else document.documentElement.removeAttribute('data-theme');

    localStorage.setItem('fifa-theme', newTheme);
  };

  const toggleTheme = (e) => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    applyTheme(newTheme, true);

    const btn = e.currentTarget;
    btn.style.transform = 'rotate(90deg) scale(0.8)';
    setTimeout(() => { btn.style.transform = 'rotate(0deg) scale(1)'; }, 200);
  };

  return (
    <header className="navbar" id="navbar">
      <Link to={isOrg ? '/dashboard' : '/team-dashboard'} className="navbar-brand" id="navbar-brand-link">
        <div className="navbar-logo">⚽</div>
        <span className="navbar-title">GOALGORITHM</span>
      </Link>
      <div className="navbar-breadcrumb">
        <span style={{color:'var(--color-text-muted)'}}>›</span>
        <span id="breadcrumb">{breadcrumb}</span>
      </div>
      <div className="navbar-actions">
        {user?.role === 'ORGANIZER' && (
          <span className="role-badge" style={{background:'var(--color-primary)',color:'#ffffff',borderColor:'rgba(255,255,255,0.25)'}}>Organiser</span>
        )}
        {user?.role === 'TEAM_LEADER' && (
          <span className="role-badge" style={{background:'var(--color-accent)',color:'#020617',borderColor:'rgba(2,6,23,0.15)'}}>Team Leader</span>
        )}
        <button className="btn btn-ghost btn-sm" onClick={logout} title="Sign out" style={{padding:'4px 10px',fontSize:'var(--text-sm)'}}>Sign Out</button>
        <button 
          className="theme-toggle" 
          id="theme-toggle-btn" 
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          onClick={toggleTheme}
          style={{ transition: 'transform 0.2s ease' }}
        >
          {theme === 'light' ? '🌙' : '☀️'}
        </button>
      </div>
    </header>
  );
};

export default Navbar;
