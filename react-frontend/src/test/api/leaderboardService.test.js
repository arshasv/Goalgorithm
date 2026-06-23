import { LeaderboardService } from '../../api/leaderboardService';
import api from '../../api/axios';

vi.mock('../../api/axios');

describe('LeaderboardService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getLeaderboard sends GET /leaderboard', async () => {
    const lb = [{ rank: 1, team_name: 'A', score: 100 }];
    api.get.mockResolvedValue({ data: lb });
    const result = await LeaderboardService.getLeaderboard();
    expect(api.get).toHaveBeenCalledWith('/leaderboard');
    expect(result).toEqual(lb);
  });

  it('calculateLeaderboard sends POST /leaderboard/calculate', async () => {
    api.post.mockResolvedValue({ data: { calculated: true } });
    const result = await LeaderboardService.calculateLeaderboard();
    expect(api.post).toHaveBeenCalledWith('/leaderboard/calculate');
    expect(result).toEqual({ calculated: true });
  });
});
