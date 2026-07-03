import { ScoringConfigService } from '../../api/scoringConfigService';
import api from '../../api/axios';

vi.mock('../../api/axios');

describe('ScoringConfigService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getGuidelines sends GET /admin/scoring-config/guidelines', async () => {
    const guidelines = { content: '...' };
    api.get.mockResolvedValue({ data: guidelines });
    const result = await ScoringConfigService.getGuidelines();
    expect(api.get).toHaveBeenCalledWith('/admin/scoring-config/guidelines');
    expect(result).toEqual(guidelines);
  });

  it('getActiveConfig sends GET /admin/scoring-config/active', async () => {
    const config = { id: 1, weights: {} };
    api.get.mockResolvedValue({ data: config });
    const result = await ScoringConfigService.getActiveConfig();
    expect(api.get).toHaveBeenCalledWith('/admin/scoring-config/active');
    expect(result).toEqual(config);
  });

  it('updateConfig sends PUT /admin/scoring-config/:id with data', async () => {
    const config = { weights: { technical: 0.5 } };
    api.put.mockResolvedValue({ data: { id: 1, ...config } });
    const result = await ScoringConfigService.updateConfig(1, config);
    expect(api.put).toHaveBeenCalledWith('/admin/scoring-config/1', config);
    expect(result).toEqual({ id: 1, weights: { technical: 0.5 } });
  });

  it('resetConfig sends POST /admin/scoring-config/reset', async () => {
    api.post.mockResolvedValue({ data: { reset: true } });
    const result = await ScoringConfigService.resetConfig();
    expect(api.post).toHaveBeenCalledWith('/admin/scoring-config/reset');
    expect(result).toEqual({ reset: true });
  });
});
