import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthService } from '../../api/authService';
import './Auth.css';

const STEPS = { EMAIL: 1, OTP: 2, PASSWORD: 3, SUCCESS: 4 };

const ForgotPasswordView = () => {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [sentEmail, setSentEmail] = useState('');

  const navigate = useNavigate();

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthService.forgotPassword(email);
      setSentEmail(email);
      setStep(STEPS.OTP);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Something went wrong.';
      setError(Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsSubmitting(true);
    try {
      await AuthService.forgotPassword(sentEmail);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Something went wrong.';
      setError(Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOtp = (e) => {
    e.preventDefault();
    setError('');

    if (!otp || otp.length !== 6) {
      setError('Please enter the 6-digit code sent to your email.');
      return;
    }

    setStep(STEPS.PASSWORD);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setError('');

    if (!newPassword || newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    try {
      await AuthService.resetPassword(email, otp, newPassword);
      setStep(STEPS.SUCCESS);
    } catch (err) {
      const detail = err.response?.data?.detail || err.message || 'Failed to reset password.';
      setError(Array.isArray(detail) ? detail.map(d => d.msg).join(', ') : typeof detail === 'string' ? detail : JSON.stringify(detail));
    } finally {
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
            <p className="auth-subtitle">
              {step === STEPS.EMAIL && 'Enter your email to receive a reset code'}
              {step === STEPS.OTP && `Enter the 6-digit code sent to ${sentEmail}`}
              {step === STEPS.PASSWORD && 'Choose your new password'}
              {step === STEPS.SUCCESS && 'Password reset complete'}
            </p>
          </div>

          {error && <div className="alert alert-error" style={{marginBottom: 'var(--space-md)'}}>{error}</div>}

          {step === STEPS.EMAIL && (
            <form onSubmit={handleSendOtp}>
              <div className="auth-field">
                <label htmlFor="reset-email">Email Address</label>
                <input
                  type="email"
                  id="reset-email"
                  className="form-input"
                  placeholder="you@example.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
              <div className="auth-btn-wrapper" style={{ marginTop: 'var(--space-lg)' }}>
                <button
                  type="submit"
                  className={`btn btn-primary btn-lg ${isSubmitting ? 'loading' : ''}`}
                  style={{ width: '100%' }}
                  disabled={isSubmitting}
                >
                  <span>{isSubmitting ? 'Sending...' : 'Send Reset Code'}</span>
                  {isSubmitting && <span className="spinner" style={{ display: 'inline-block' }}></span>}
                </button>
              </div>
            </form>
          )}

          {step === STEPS.OTP && (
            <form onSubmit={handleVerifyOtp}>
              <div className="auth-field">
                <label htmlFor="otp">6-Digit Code</label>
                <input
                  type="text"
                  id="otp"
                  className="form-input"
                  placeholder="000000"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  required
                  autoComplete="one-time-code"
                  autoFocus
                  inputMode="numeric"
                  style={{ textAlign: 'center', fontSize: 'var(--text-2xl)', letterSpacing: '8px', fontFamily: 'var(--font-mono)' }}
                />
              </div>
              <div className="auth-btn-wrapper" style={{ marginTop: 'var(--space-lg)' }}>
                <button
                  type="submit"
                  className="btn btn-primary btn-lg"
                  style={{ width: '100%' }}
                  disabled={otp.length !== 6}
                >
                  Continue
                </button>
              </div>
              <div className="auth-footer" style={{ marginTop: 'var(--space-md)' }}>
                <button
                  type="button"
                  className="btn btn-text"
                  onClick={handleResendOtp}
                  disabled={isSubmitting}
                  style={{ background: 'none', border: 'none', color: 'var(--color-text-link)', cursor: 'pointer', fontWeight: 600, fontSize: 'var(--text-sm)' }}
                >
                  {isSubmitting ? 'Sending...' : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          {step === STEPS.PASSWORD && (
            <form onSubmit={handleResetPassword}>
              <div className="auth-field">
                <label htmlFor="new-password">New Password</label>
                <div className="password-toggle">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="new-password"
                    className="form-input"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={e => setNewPassword(e.target.value)}
                    required
                    autoComplete="new-password"
                    autoFocus
                  />
                </div>
              </div>
              <div className="auth-field">
                <label htmlFor="confirm-password">Confirm Password</label>
                <div className="password-toggle">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="confirm-password"
                    className="form-input"
                    placeholder="Repeat your new password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    autoComplete="new-password"
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
                  <span>{isSubmitting ? 'Resetting...' : 'Reset Password'}</span>
                  {isSubmitting && <span className="spinner" style={{ display: 'inline-block' }}></span>}
                </button>
              </div>
            </form>
          )}

          {step === STEPS.SUCCESS && (
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '48px', marginBottom: 'var(--space-md)' }}>✅</div>
              <p style={{ color: 'var(--color-text-secondary)', marginBottom: 'var(--space-lg)', lineHeight: 1.6 }}>
                Your password has been reset successfully. You can now sign in with your new password.
              </p>
              <Link to="/login" className="btn btn-primary btn-lg" style={{ textDecoration: 'none', display: 'inline-block' }}>
                Sign In
              </Link>
            </div>
          )}

          {step !== STEPS.SUCCESS && (
            <div className="auth-footer">
              Remember your password? <Link to="/login">Sign In</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordView;
