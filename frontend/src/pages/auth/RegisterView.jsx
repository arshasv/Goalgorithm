import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

const ALLOWED_EMAIL_DOMAINS = ['gmail.com', 'opentrends.com', 'opentrends.net', 'fifa-scoring.com'];

const RegisterView = () => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teamLeaderName, setTeamLeaderName] = useState('');
  const [teamCode, setTeamCode] = useState('');
  
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'ORGANIZER') navigate('/dashboard');
      else navigate('/team-dashboard');
    }
  }, [isAuthenticated, user, navigate]);

  const validateEmailDomain = (val) => {
    if (!val) return null;
    const domain = val.trim().toLowerCase().split('@').pop() || '';
    if (!ALLOWED_EMAIL_DOMAINS.includes(domain)) {
      return 'Only Gmail, OpenTrends, and GOALGORITHM emails are allowed';
    }
    return null;
  };

  const handleEmailChange = (e) => {
    const val = e.target.value;
    setEmail(val);
    const err = validateEmailDomain(val);
    if (err) {
      setEmailError(err);
    } else {
      setEmailError('');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username || !email || !password || !teamLeaderName || !teamCode) {
      setError('Please fill in all required fields');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    const emailErr = validateEmailDomain(email);
    if (emailErr) {
      setError(emailErr);
      return;
    }

    setIsSubmitting(true);
    try {
      await register({
        username,
        email,
        password,
        team_name: teamCode,
        team_leader_name: teamLeaderName
      });
      navigate('/login?registered=true');
    } catch (err) {
      let detail = err.response?.data?.detail || err.message || 'Registration failed. Please try again.';
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
      <div className="auth-container" style={{ maxWidth: '520px' }}>
        <div className="auth-card">
          <div className="auth-header">
            <span className="auth-logo">⚽</span>
            <h1 className="auth-title">GOALGORITHM</h1>
            <p className="auth-subtitle">Create your team leader account</p>
          </div>
          
          {error && <div className="alert alert-error" style={{marginBottom: 'var(--space-md)'}}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="section-label" style={{
              fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', 
              textTransform: 'uppercase', letterSpacing: '0.05em', 
              color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)'
            }}>Account Details</div>

            <div className="auth-field">
              <label htmlFor="username">Username</label>
              <input 
                type="text" 
                id="username"
                className="form-input" 
                placeholder="Choose a username"
                value={username} 
                onChange={e => setUsername(e.target.value)} 
                required 
                autoComplete="username"
                minLength={3}
              />
            </div>

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <input 
                type="email" 
                id="email"
                className={`form-input ${emailError ? 'input-error' : ''}`} 
                placeholder="you@example.com"
                value={email} 
                onChange={handleEmailChange} 
                required 
                autoComplete="email"
              />
              <div className="form-hint" style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px'}}>
                Only Gmail, OpenTrends, and GOALGORITHM emails are allowed
              </div>
              {emailError && <div className="field-error" style={{fontSize: 'var(--text-xs)', color: 'var(--color-status-error)', marginTop: '4px'}}>{emailError}</div>}
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className="password-toggle">
                <input 
                  type={showPassword ? "text" : "password"} 
                  id="password"
                  className="form-input" 
                  placeholder="Create a password (min 6 chars)"
                  value={password} 
                  onChange={e => setPassword(e.target.value)} 
                  required 
                  autoComplete="new-password"
                  minLength={6}
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
              <div className="form-hint" style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px'}}>
                At least 6 characters
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="teamLeaderName">Team Leader Name</label>
              <input 
                type="text" 
                id="teamLeaderName"
                className="form-input" 
                placeholder="Your full name"
                value={teamLeaderName} 
                onChange={e => setTeamLeaderName(e.target.value)} 
                required 
              />
            </div>

            <hr className="section-divider" style={{ border: 'none', borderTop: '1px solid var(--color-border)', margin: 'var(--space-lg) 0' }} />

            <div className="section-label" style={{
              fontFamily: 'var(--font-display)', fontSize: 'var(--text-sm)', 
              textTransform: 'uppercase', letterSpacing: '0.05em', 
              color: 'var(--color-text-muted)', marginBottom: 'var(--space-md)'
            }}>Team Information</div>

            <div className="auth-field">
              <label htmlFor="teamCode">Team Code</label>
              <input 
                type="text" 
                id="teamCode"
                className="form-input" 
                placeholder="e.g. A"
                value={teamCode} 
                onChange={e => setTeamCode(e.target.value)} 
                required 
              />
              <div className="form-hint" style={{fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: '4px'}}>
                Enter the team name (A, B, C, D, E) assigned to your team
              </div>
            </div>

            <div className="auth-btn-wrapper" style={{ marginTop: 'var(--space-lg)' }}>
              <button 
                type="submit" 
                className={`btn btn-primary btn-lg ${isSubmitting ? 'loading' : ''}`} 
                style={{ width: '100%' }}
                disabled={isSubmitting || !!emailError}
              >
                <span>{isSubmitting ? 'Registering...' : 'Register Team'}</span>
                {isSubmitting && <span className="spinner" style={{ display: 'inline-block' }}></span>}
              </button>
            </div>
          </form>

          <div className="auth-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterView;
