import { ScoringService } from '../../api/scoringService';
import api from '../../api/axios';

vi.mock('../../api/axios');

describe('ScoringService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculateMatchScoreBulk sends POST /matches/:id/calculate-scores', async () => {
    api.post.mockResolvedValue({ data: { calculated: true } });
    const result = await ScoringService.calculateMatchScoreBulk(1);
    expect(api.post).toHaveBeenCalledWith('/matches/1/calculate-scores');
    expect(result).toEqual({ calculated: true });
  });

  it('getMatchBreakdown sends GET /scores/match-breakdown', async () => {
    const breakdown = { match_id: 1, scores: [] };
    api.get.mockResolvedValue({ data: breakdown });
    const result = await ScoringService.getMatchBreakdown();
    expect(api.get).toHaveBeenCalledWith('/scores/match-breakdown');
    expect(result).toEqual(breakdown);
  });

  it('calculatePresentation sends POST /presentation-score with evaluations', async () => {
    const evaluations = [{ team_id: 1, score: 90 }];
    api.post.mockResolvedValue({ data: { success: true } });
    const result = await ScoringService.calculatePresentation(evaluations);
    expect(api.post).toHaveBeenCalledWith('/presentation-score', evaluations);
    expect(result).toEqual({ success: true });
  });

  it('listJudges sends GET /judges', async () => {
    const judges = [{ id: 1, name: 'Judge A' }];
    api.get.mockResolvedValue({ data: judges });
    const result = await ScoringService.listJudges();
    expect(api.get).toHaveBeenCalledWith('/judges');
    expect(result).toEqual(judges);
  });

  it('createJudge sends POST /judges with judgeData', async () => {
    const judgeData = { name: 'Judge B' };
    api.post.mockResolvedValue({ data: { id: 2, ...judgeData } });
    const result = await ScoringService.createJudge(judgeData);
    expect(api.post).toHaveBeenCalledWith('/judges', judgeData);
    expect(result).toEqual({ id: 2, name: 'Judge B' });
  });

  it('deleteJudge sends DELETE /judges/:id', async () => {
    api.delete.mockResolvedValue({ data: { success: true } });
    const result = await ScoringService.deleteJudge(5);
    expect(api.delete).toHaveBeenCalledWith('/judges/5');
    expect(result).toEqual({ success: true });
  });

  it('uploadPresentationCSV sends POST /presentation-score/upload-csv with FormData', async () => {
    const file = new File(['dummy'], 'scores.csv', { type: 'text/csv' });
    api.post.mockResolvedValue({ data: { processed: 2, failed: 0, errors: [] } });
    const result = await ScoringService.uploadPresentationCSV(file);
    expect(api.post).toHaveBeenCalledWith(
      '/presentation-score/upload-csv',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } },
    );
    expect(result.processed).toBe(2);
    expect(result.failed).toBe(0);
  });

  it('downloadPresentationTemplate fetches blob and triggers download', async () => {
    const blob = new Blob(['Team Name,Judge Name\n'], { type: 'text/csv' });
    global.fetch = vi.fn().mockResolvedValue({
      blob: vi.fn().mockResolvedValue(blob),
    });

    const fakeUrl = 'blob://dummy';
    URL.createObjectURL = vi.fn().mockReturnValue(fakeUrl);
    URL.revokeObjectURL = vi.fn();

    const click = vi.fn();
    document.createElement = vi.fn().mockReturnValue({ href: '', click, download: '' });

    await ScoringService.downloadPresentationTemplate();

    expect(global.fetch).toHaveBeenCalled();
    expect(click).toHaveBeenCalled();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith(fakeUrl);

    vi.restoreAllMocks();
  });
});
