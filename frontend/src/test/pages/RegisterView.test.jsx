import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RegisterView from '../../pages/auth/RegisterView';

const mockRegister = vi.fn();
const mockNavigate = vi.fn();

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    token: null,
    loading: false,
    register: mockRegister,
    logout: () => {},
    isAuthenticated: false,
  }),
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const renderRegister = () => {
  return render(
    <MemoryRouter initialEntries={['/register']}>
      <RegisterView />
    </MemoryRouter>
  );
};

describe('RegisterView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the registration form', () => {
    renderRegister();
    expect(screen.getByText(/create your team leader account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/team leader name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/team code/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty form', async () => {
    const user = userEvent.setup();
    renderRegister();
    // Remove required attributes to bypass native HTML5 validation
    document.querySelectorAll('[required]').forEach(el => el.removeAttribute('required'));
    await user.click(screen.getByRole('button', { name: /register team/i }));
    expect(screen.getByText('Please fill in all required fields')).toBeInTheDocument();
  });

  it('submits with valid data', async () => {
    mockRegister.mockResolvedValueOnce(undefined);
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email/i), 'test@gmail.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/team leader name/i), 'John Doe');
    await user.type(screen.getByLabelText(/team code/i), 'A');

    await user.click(screen.getByRole('button', { name: /register team/i }));

    await waitFor(() => {
      expect(mockRegister).toHaveBeenCalledWith({
        username: 'testuser',
        email: 'test@gmail.com',
        password: 'password123',
        team_name: 'A',
        team_leader_name: 'John Doe',
      });
    });

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login?registered=true');
    });
  });

  it('shows error on registration failure', async () => {
    mockRegister.mockRejectedValueOnce({
      response: { data: { detail: 'Email already registered' } },
    });
    const user = userEvent.setup();
    renderRegister();

    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/email/i), 'test@gmail.com');
    await user.type(screen.getByLabelText(/^password$/i), 'password123');
    await user.type(screen.getByLabelText(/team leader name/i), 'John Doe');
    await user.type(screen.getByLabelText(/team code/i), 'A');

    await user.click(screen.getByRole('button', { name: /register team/i }));

    await waitFor(() => {
      expect(screen.getByText('Email already registered')).toBeInTheDocument();
    });
  });

  it('validates email domain', async () => {
    const user = userEvent.setup();
    renderRegister();

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'test@invalid.com');

    const messages = screen.getAllByText(/only gmail/i);
    expect(messages.length).toBe(2);
    expect(messages[0]).toBeInTheDocument();
  });
});
