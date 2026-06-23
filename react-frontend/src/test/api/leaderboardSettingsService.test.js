import { LeaderboardSettingsService } from '../../api/leaderboardSettingsService';
import api from '../../api/axios';

vi.mock('../../api/axios');

describe('LeaderboardSettingsService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getSettings sends GET /admin/leaderboard/settings', async () => {
    const settings = { show_public: true };
    api.get.mockResolvedValue({ data: settings });
    const result = await LeaderboardSettingsService.getSettings();
    expect(api.get).toHaveBeenCalledWith('/admin/leaderboard/settings');
    expect(result).toEqual(settings);
  });

  it('updateSettings sends PUT /admin/leaderboard/settings with data', async () => {
    const settings = { show_public: false };
    api.put.mockResolvedValue({ data: { ...settings, updated: true } });
    const result = await LeaderboardSettingsService.updateSettings(settings);
    expect(api.put).toHaveBeenCalledWith('/admin/leaderboard/settings', settings);
    expect(result).toEqual({ show_public: false, updated: true });
  });
});
