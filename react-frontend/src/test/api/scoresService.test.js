import { ScoresService } from '../../api/scoresService';
import api from '../../api/axios';

vi.mock('../../api/axios');

describe('ScoresService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMatchBreakdown sends GET /scores/match-breakdown', async () => {
    const breakdown = { match_id: 1, details: [] };
    api.get.mockResolvedValue({ data: breakdown });
    const result = await ScoresService.getMatchBreakdown();
    expect(api.get).toHaveBeenCalledWith('/scores/match-breakdown');
    expect(result).toEqual(breakdown);
  });

  it('getDailyScores sends GET /scores/daily', async () => {
    const daily = { date: '2026-06-22', scores: [] };
    api.get.mockResolvedValue({ data: daily });
    const result = await ScoresService.getDailyScores();
    expect(api.get).toHaveBeenCalledWith('/scores/daily');
    expect(result).toEqual(daily);
  });

  it('getTechnicalEvaluations sends GET /evaluations/technical', async () => {
    const evals = [{ team_id: 1, score: 85 }];
    api.get.mockResolvedValue({ data: evals });
    const result = await ScoresService.getTechnicalEvaluations();
    expect(api.get).toHaveBeenCalledWith('/evaluations/technical');
    expect(result).toEqual(evals);
  });

  it('getPresentationEvaluations sends GET /evaluations/presentation', async () => {
    const evals = [{ team_id: 1, score: 92 }];
    api.get.mockResolvedValue({ data: evals });
    const result = await ScoresService.getPresentationEvaluations();
    expect(api.get).toHaveBeenCalledWith('/evaluations/presentation');
    expect(result).toEqual(evals);
  });
});
