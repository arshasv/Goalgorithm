import { MatchService } from '../../api/matchService';
import api from '../../api/axios';

vi.mock('../../api/axios');

describe('MatchService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listMatches sends GET /matches', async () => {
    const matches = [{ id: 1, home_team: 'A' }];
    api.get.mockResolvedValue({ data: matches });
    const result = await MatchService.listMatches();
    expect(api.get).toHaveBeenCalledWith('/matches');
    expect(result).toEqual(matches);
  });

  it('createMatch sends POST /matches with data', async () => {
    const data = { match_number: 1, home_team_name: 'A', away_team_name: 'B' };
    api.post.mockResolvedValue({ data: { id: 1, ...data } });
    const result = await MatchService.createMatch(data);
    expect(api.post).toHaveBeenCalledWith('/matches', data);
    expect(result).toEqual({ id: 1, ...data });
  });

  it('updateMatch sends PUT /matches/:id with data', async () => {
    api.put.mockResolvedValue({ data: { id: 1, match_number: 2 } });
    const result = await MatchService.updateMatch(1, { match_number: 2 });
    expect(api.put).toHaveBeenCalledWith('/matches/1', { match_number: 2 });
    expect(result).toEqual({ id: 1, match_number: 2 });
  });

  it('deleteMatch sends DELETE /matches/:id', async () => {
    api.delete.mockResolvedValue({ data: { success: true } });
    const result = await MatchService.deleteMatch(1);
    expect(api.delete).toHaveBeenCalledWith('/matches/1');
    expect(result).toEqual({ success: true });
  });

  it('uploadMatchesCsv sends POST /matches/upload-csv with form data', async () => {
    const fd = new FormData();
    api.post.mockResolvedValue({ data: { count: 10 } });
    const result = await MatchService.uploadMatchesCsv(fd);
    expect(api.post).toHaveBeenCalledWith('/matches/upload-csv', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    expect(result).toEqual({ count: 10 });
  });

  it('importApiMatches sends POST /external-matches/import with target_date', async () => {
    api.post.mockResolvedValue({ data: { imported: 5 } });
    const result = await MatchService.importApiMatches('2026-06-22');
    expect(api.post).toHaveBeenCalledWith('/external-matches/import', { target_date: '2026-06-22' });
    expect(result).toEqual({ imported: 5, ...result });
  });

  it('syncApiResults sends POST /external-matches/sync-results', async () => {
    api.post.mockResolvedValue({ data: { synced: 3 } });
    const result = await MatchService.syncApiResults();
    expect(api.post).toHaveBeenCalledWith('/external-matches/sync-results');
    expect(result).toEqual({ synced: 3 });
  });
});
