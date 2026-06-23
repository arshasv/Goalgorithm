import { ResultService } from '../../api/resultService';
import api from '../../api/axios';

vi.mock('../../api/axios');

describe('ResultService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submitActualResult sends POST /actual-results with data', async () => {
    const data = { match_id: 1, home_score: 2, away_score: 1 };
    api.post.mockResolvedValue({ data: { id: 10, ...data } });
    const result = await ResultService.submitActualResult(data);
    expect(api.post).toHaveBeenCalledWith('/actual-results', data);
    expect(result).toEqual({ id: 10, ...data });
  });

  it('getActualResult sends GET /actual-results/:matchId', async () => {
    const resultData = { match_id: 1, home_score: 2, away_score: 1 };
    api.get.mockResolvedValue({ data: resultData });
    const result = await ResultService.getActualResult(1);
    expect(api.get).toHaveBeenCalledWith('/actual-results/1');
    expect(result).toEqual(resultData);
  });
});
