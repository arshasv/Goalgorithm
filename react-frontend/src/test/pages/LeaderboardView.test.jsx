import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LeaderboardView from '../../pages/leaderboard/LeaderboardView';

const mockGetLeaderboard = vi.fn();
const mockCalculateLeaderboard = vi.fn();
const mockListTeams = vi.fn();
const mockGetMatchBreakdown = vi.fn();

vi.mock('../../api/leaderboardService', () => ({
  LeaderboardService: {
    getLeaderboard: (...args) => mockGetLeaderboard(...args),
    calculateLeaderboard: (...args) => mockCalculateLeaderboard(...args),
  },
}));

vi.mock('../../api/teamService', () => ({
  TeamService: {
    listTeams: (...args) => mockListTeams(...args),
  },
}));

vi.mock('../../api/scoresService', () => ({
  ScoresService: {
    getMatchBreakdown: (...args) => mockGetMatchBreakdown(...args),
  },
}));

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    isOrganizer: true,
    isTeamLeader: false,
  }),
}));

const mockLeaderboardData = [
  { rank: 1, team_id: 'A', team_code: 'A', team_name: 'Alpha', final_score: 85.5, phase1_score: 50, technical_score: 18, presentation_score: 17.5 },
  { rank: 2, team_id: 'B', team_code: 'B', team_name: 'Beta', final_score: 72.3, phase1_score: 45, technical_score: 15, presentation_score: 12.3 },
  { rank: 3, team_id: 'C', team_code: 'C', team_name: 'Charlie', final_score: 65.0, phase1_score: 40, technical_score: 14, presentation_score: 11.0 },
];

const renderLeaderboard = () => {
  return render(
    <MemoryRouter initialEntries={['/leaderboard']}>
      <LeaderboardView />
    </MemoryRouter>
  );
};

describe('LeaderboardView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetLeaderboard.mockResolvedValue(mockLeaderboardData);
  });

  it('renders loading state initially', () => {
    mockGetLeaderboard.mockImplementationOnce(() => new Promise(() => {}));
    renderLeaderboard();
    expect(screen.getByText('Leaderboard')).toBeInTheDocument();
  });

  it('renders leaderboard data', async () => {
    renderLeaderboard();

    await waitFor(() => {
      expect(screen.getAllByText('A – Alpha').length).toBeGreaterThanOrEqual(1);
    });

    expect(screen.getByText('B – Beta')).toBeInTheDocument();
    expect(screen.getByText('C – Charlie')).toBeInTheDocument();
  });

  it('shows stat cards for organizer', async () => {
    renderLeaderboard();

    await waitFor(() => {
      expect(screen.getByText('Total Teams')).toBeInTheDocument();
      expect(screen.getByText('Top Score')).toBeInTheDocument();
      expect(screen.getByText('Top Team')).toBeInTheDocument();
    });
  });

  it('shows calculate button for organizer', async () => {
    renderLeaderboard();

    await waitFor(() => {
      expect(screen.getByText(/calculate/i)).toBeInTheDocument();
    });
  });

  it('handles calculate action', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    mockCalculateLeaderboard.mockResolvedValueOnce({});
    mockGetLeaderboard.mockResolvedValue(mockLeaderboardData);

    const user = userEvent.setup();
    renderLeaderboard();

    await waitFor(() => {
      expect(screen.getByText(/calculate/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText(/calculate/i));
    expect(confirmSpy).toHaveBeenCalled();

    await waitFor(() => {
      expect(mockCalculateLeaderboard).toHaveBeenCalled();
    });

    confirmSpy.mockRestore();
  });

  it('shows column headers', async () => {
    renderLeaderboard();

    await waitFor(() => {
      expect(screen.getByText('Rank')).toBeInTheDocument();
      expect(screen.getByText('Team')).toBeInTheDocument();
      expect(screen.getByText('Phase 1')).toBeInTheDocument();
      expect(screen.getByText('Technical')).toBeInTheDocument();
      expect(screen.getByText('Presentation')).toBeInTheDocument();
      expect(screen.getByText('Final Score')).toBeInTheDocument();
    });
  });

  it('shows empty state when no data', async () => {
    mockGetLeaderboard.mockResolvedValueOnce([]);
    renderLeaderboard();

    await waitFor(() => {
      expect(screen.getByText('No Leaderboard Data')).toBeInTheDocument();
    });
  });
});
