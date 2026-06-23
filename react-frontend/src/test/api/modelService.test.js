import { ModelService } from '../../api/modelService';
import api from '../../api/axios';

vi.mock('../../api/axios');

describe('ModelService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMyModels sends GET /teams/my-team/models', async () => {
    const models = [{ id: 1, name: 'model.zip' }];
    api.get.mockResolvedValue({ data: models });
    const result = await ModelService.getMyModels();
    expect(api.get).toHaveBeenCalledWith('/teams/my-team/models');
    expect(result).toEqual(models);
  });

  it('getAllModels sends GET /admin/models', async () => {
    const models = [{ id: 1, team: 'A' }];
    api.get.mockResolvedValue({ data: models });
    const result = await ModelService.getAllModels();
    expect(api.get).toHaveBeenCalledWith('/admin/models');
    expect(result).toEqual(models);
  });

  it('uploadModel sends POST /teams/my-team/model with file as FormData', async () => {
    const file = new File(['content'], 'model.zip');
    api.post.mockResolvedValue({ data: { id: 1, filename: 'model.zip' } });
    const result = await ModelService.uploadModel(file);
    expect(api.post).toHaveBeenCalledWith(
      '/teams/my-team/model',
      expect.any(FormData),
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    const callArg = api.post.mock.calls[0][1];
    expect(callArg.get('file')).toEqual(file);
    expect(result).toEqual({ id: 1, filename: 'model.zip' });
  });

  it('getUploadWindow sends GET /upload-window', async () => {
    const window = { open: true, closes_at: '2026-07-01T00:00:00Z' };
    api.get.mockResolvedValue({ data: window });
    const result = await ModelService.getUploadWindow();
    expect(api.get).toHaveBeenCalledWith('/upload-window');
    expect(result).toEqual(window);
  });

  it('updateUploadWindow sends PUT /upload-window with data', async () => {
    const data = { closes_at: '2026-07-10T00:00:00Z' };
    api.put.mockResolvedValue({ data: { ...data, updated: true } });
    const result = await ModelService.updateUploadWindow(data);
    expect(api.put).toHaveBeenCalledWith('/upload-window', data);
    expect(result).toEqual({ closes_at: '2026-07-10T00:00:00Z', updated: true });
  });
});
