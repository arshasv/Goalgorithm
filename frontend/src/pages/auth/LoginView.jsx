import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Auth.css';

const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If arriving from registration success
    const params = new URLSearchParams(location.search);
    if (params.get('registered') === 'true') {
      setSuccess('Registration successful! Please sign in.');
    }
  }, [location]);

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ORGANIZER') navigate('/dashboard');
      else navigate('/team-dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email, password });
      // Navigation is handled by the useEffect above
    } catch (err) {
      // Parse error
      let detail = err.response?.data?.detail || err.message || 'Login failed. Please try again.';
      if (Array.isArray(detail)) {
        detail = detail.map(d => d.msg).join(', ');
      }
      setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
      setIsSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="stadium-beam"></div>
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">⚽</span>
            <h1 className="auth-title">GOALGORITHM</h1>
            <p className="auth-subtitle">Sign in to your account</p>
          </div>
          
          {success && <div className="alert alert-success" style={{marginBottom: 'var(--space-md)'}}>{success}</div>}
          {error && <div className="alert alert-error" style={{marginBottom: 'var(--space-md)'}}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="email">Email Address / Username</label>
              <input 
                type="text" 
                id="email"
                className="form-input" 
                placeholder="you@example.com"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
                autoComplete="email"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="password-toggle">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password"
                  className="form-input" 
                  placeholder="Enter password"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  autoComplete="current-password"
                />
                <button 
                  type="button" 
                  className="toggle-btn" 
                  onClick={() => setShowPassword(!showPassword)} 
                  tabIndex="-1"
                >
                  👁
                </button>
              </div>
            </div>

            <div className="auth-btn-wrapper" style={{ marginTop: 'var(--space-lg)' }}>
              <button 
                type="submit" 
                className={`btn btn-primary btn-lg ${isSubmitting ? 'loading' : ''}`} 
                style={{ width: '100%' }}
                disabled={isSubmitting}
              >
                <span>{isSubmitting ? 'Signing in...' : 'Sign In'}</span>
                {isSubmitting && <span className="spinner" style={{ display: 'inline-block' }}></span>}
              </button>
            </div>
          </form>

          <div className="auth-footer" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <Link to="/forgot-password" style={{ color: 'var(--color-text-link)', fontWeight: 600, fontSize: 'var(--text-sm)' }}>Forgot Password?</Link>
            <span>Don't have an account? <Link to="/register">Register Team</Link></span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginView;
