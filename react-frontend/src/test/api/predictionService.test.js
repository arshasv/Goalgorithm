import { PredictionService } from '../../api/predictionService';
import api from '../../api/axios';

vi.mock('../../api/axios');

describe('PredictionService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('submitPrediction sends POST /predictions with data', async () => {
    const data = { match_id: 1, predicted_home_score: 2, predicted_away_score: 1 };
    api.post.mockResolvedValue({ data: { id: 10, ...data } });
    const result = await PredictionService.submitPrediction(data);
    expect(api.post).toHaveBeenCalledWith('/predictions', data);
    expect(result).toEqual({ id: 10, ...data });
  });

  it('listPredictions sends GET /predictions', async () => {
    const predictions = [{ id: 1, match_id: 1 }];
    api.get.mockResolvedValue({ data: predictions });
    const result = await PredictionService.listPredictions();
    expect(api.get).toHaveBeenCalledWith('/predictions');
    expect(result).toEqual(predictions);
  });
});
