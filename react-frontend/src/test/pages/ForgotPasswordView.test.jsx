import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import ForgotPasswordView from '../../pages/auth/ForgotPasswordView';

const mockForgotPassword = vi.fn();
const mockResetPassword = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../api/authService', () => ({
  AuthService: {
    forgotPassword: (...args) => mockForgotPassword(...args),
    resetPassword: (...args) => mockResetPassword(...args),
  },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderForgotPassword = () => {
  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <ForgotPasswordView />
    </MemoryRouter>
  );
};

describe('ForgotPasswordView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders email step initially', () => {
    renderForgotPassword();
    expect(screen.getByText('Enter your email to receive a reset code')).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset code/i })).toBeInTheDocument();
  });

  it('shows validation error on empty email', async () => {
    const user = userEvent.setup();
    renderForgotPassword();
    document.querySelector('[required]')?.removeAttribute('required');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));
    expect(screen.getByText('Please enter your email address.')).toBeInTheDocument();
  });

  it('sends OTP on valid email', async () => {
    mockForgotPassword.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderForgotPassword();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));

    await waitFor(() => {
      expect(mockForgotPassword).toHaveBeenCalledWith('test@example.com');
    });

    await waitFor(() => {
      expect(screen.getByText(/enter the 6-digit code/i)).toBeInTheDocument();
    });
  });

  it('proceeds to password step after OTP entry', async () => {
    mockForgotPassword.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderForgotPassword();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));

    await waitFor(() => {
      expect(screen.getByText(/enter the 6-digit code/i)).toBeInTheDocument();
    });

    const otpInput = screen.getByLabelText(/6-digit code/i);
    await user.type(otpInput, '123456');

    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByText(/choose your new password/i)).toBeInTheDocument();
    });
  });

  it('validates password match', async () => {
    mockForgotPassword.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderForgotPassword();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/6-digit code/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/6-digit code/i), '123456');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^new password$/i), 'password1');
    await user.type(screen.getByLabelText(/confirm password/i), 'password2');
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match.')).toBeInTheDocument();
    });
  });

  it('completes full reset flow', async () => {
    mockForgotPassword.mockResolvedValueOnce({});
    mockResetPassword.mockResolvedValueOnce({});
    const user = userEvent.setup();
    renderForgotPassword();

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.click(screen.getByRole('button', { name: /send reset code/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/6-digit code/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/6-digit code/i), '123456');
    await user.click(screen.getByRole('button', { name: /continue/i }));

    await waitFor(() => {
      expect(screen.getByLabelText(/^new password$/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/^new password$/i), 'newpass123');
    await user.type(screen.getByLabelText(/confirm password/i), 'newpass123');
    // Remove required attributes to bypass native validation in test env
    document.querySelectorAll('[required]').forEach(el => el.removeAttribute('required'));
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    await waitFor(() => {
      expect(mockResetPassword).toHaveBeenCalledWith(
        'test@example.com',
        '123456',
        'newpass123'
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/password has been reset/i)).toBeInTheDocument();
    });
  });
});
