import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AddMatchModal from '../../components/matches/AddMatchModal';

const mockCreateMatch = vi.fn();

vi.mock('../../api/matchService', () => ({
  MatchService: {
    createMatch: (...args) => mockCreateMatch(...args),
  },
}));

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onMatchCreated: vi.fn(),
};

describe('AddMatchModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders nothing when closed', () => {
    const { container } = render(<AddMatchModal {...defaultProps} isOpen={false} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders the form when open', () => {
    render(<AddMatchModal {...defaultProps} />);
    expect(screen.getByText('+ Add New Match')).toBeInTheDocument();
    expect(screen.getByText('Match Number')).toBeInTheDocument();
    expect(screen.getByText(/home team/i)).toBeInTheDocument();
    expect(screen.getByText(/away team/i)).toBeInTheDocument();
    expect(screen.getByText(/kickoff/i)).toBeInTheDocument();
  });

  it('shows validation error on incomplete submit', async () => {
    const user = userEvent.setup();
    render(<AddMatchModal {...defaultProps} />);
    document.querySelectorAll('[required]').forEach(el => el.removeAttribute('required'));
    await user.click(screen.getByRole('button', { name: /create match/i }));
    expect(screen.getByText('Please fill in all required fields.')).toBeInTheDocument();
  });

  it('calls createMatch on valid submit', async () => {
    mockCreateMatch.mockResolvedValueOnce({});
    const user = userEvent.setup();
    const onClose = vi.fn();
    const onMatchCreated = vi.fn();

    render(
      <AddMatchModal
        isOpen={true}
        onClose={onClose}
        onMatchCreated={onMatchCreated}
      />
    );

    await user.type(screen.getByPlaceholderText('1'), '1');
    await user.type(screen.getByPlaceholderText('Argentina'), 'Home Team');
    await user.type(screen.getByPlaceholderText('Brazil'), 'Away Team');
    await user.type(screen.getByLabelText(/kickoff/i), '2026-06-17T18:00');

    await user.click(screen.getByRole('button', { name: /create match/i }));

    await waitFor(() => {
      expect(mockCreateMatch).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(onMatchCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('closes on overlay click', async () => {
    const onClose = vi.fn();
    const { container } = render(
      <AddMatchModal {...defaultProps} onClose={onClose} />
    );

    const overlay = container.querySelector('.modal-overlay');
    await userEvent.setup().click(overlay);
    expect(onClose).toHaveBeenCalled();
  });

  it('does not close on modal content click', async () => {
    const onClose = vi.fn();
    render(<AddMatchModal {...defaultProps} onClose={onClose} />);

    const modalContainer = screen.getByText('+ Add New Match').closest('.modal-container');
    await userEvent.setup().click(modalContainer);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('shows error on API failure', async () => {
    mockCreateMatch.mockRejectedValueOnce({
      response: { data: { detail: 'Match already exists' } },
    });
    const user = userEvent.setup();

    render(<AddMatchModal {...defaultProps} />);

    await user.type(screen.getByPlaceholderText('1'), '1');
    await user.type(screen.getByPlaceholderText('Argentina'), 'Home');
    await user.type(screen.getByPlaceholderText('Brazil'), 'Away');
    await user.type(screen.getByLabelText(/kickoff/i), '2026-06-17T18:00');

    await user.click(screen.getByRole('button', { name: /create match/i }));

    await waitFor(() => {
      expect(screen.getByText('Match already exists')).toBeInTheDocument();
    });
  });
});
