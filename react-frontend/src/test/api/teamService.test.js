import { TeamService } from '../../api/teamService';
import api from '../../api/axios';

vi.mock('../../api/axios');

describe('TeamService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('listTeams sends GET /teams', async () => {
    const teams = [{ id: 1, name: 'A' }];
    api.get.mockResolvedValue({ data: teams });
    const result = await TeamService.listTeams();
    expect(api.get).toHaveBeenCalledWith('/teams');
    expect(result).toEqual(teams);
  });

  it('getMyTeam sends GET /teams/my-team', async () => {
    const team = { id: 1, name: 'My Team' };
    api.get.mockResolvedValue({ data: team });
    const result = await TeamService.getMyTeam();
    expect(api.get).toHaveBeenCalledWith('/teams/my-team');
    expect(result).toEqual(team);
  });

  it('createTeam sends POST /teams with data', async () => {
    const data = { name: 'New Team' };
    api.post.mockResolvedValue({ data: { id: 2, ...data } });
    const result = await TeamService.createTeam(data);
    expect(api.post).toHaveBeenCalledWith('/teams', data);
    expect(result).toEqual({ id: 2, name: 'New Team' });
  });

  it('updateTeam sends PUT /teams/:id with data', async () => {
    api.put.mockResolvedValue({ data: { id: 1, name: 'Updated' } });
    const result = await TeamService.updateTeam(1, { name: 'Updated' });
    expect(api.put).toHaveBeenCalledWith('/teams/1', { name: 'Updated' });
    expect(result).toEqual({ id: 1, name: 'Updated' });
  });

  it('uploadMembers sends POST /teams/upload-members with form data', async () => {
    const fd = new FormData();
    api.post.mockResolvedValue({ data: { count: 5 } });
    const result = await TeamService.uploadMembers(fd);
    expect(api.post).toHaveBeenCalledWith('/teams/upload-members', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    expect(result).toEqual({ count: 5 });
  });

  it('uploadTeams sends POST /teams/upload-teams with form data', async () => {
    const fd = new FormData();
    api.post.mockResolvedValue({ data: { count: 3 } });
    const result = await TeamService.uploadTeams(fd);
    expect(api.post).toHaveBeenCalledWith('/teams/upload-teams', fd, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    expect(result).toEqual({ count: 3 });
  });

  it('downloadMembersTemplate sends GET /teams/template/members as blob', async () => {
    const blob = new Blob();
    api.get.mockResolvedValue({ data: blob });
    const result = await TeamService.downloadMembersTemplate();
    expect(api.get).toHaveBeenCalledWith('/teams/template/members', { responseType: 'blob' });
    expect(result).toEqual(blob);
  });

  it('downloadTeamsTemplate sends GET /teams/template/teams as blob', async () => {
    const blob = new Blob();
    api.get.mockResolvedValue({ data: blob });
    const result = await TeamService.downloadTeamsTemplate();
    expect(api.get).toHaveBeenCalledWith('/teams/template/teams', { responseType: 'blob' });
    expect(result).toEqual(blob);
  });

  it('addTeamMemberAdmin sends POST /teams/:id/members', async () => {
    api.post.mockResolvedValue({ data: { id: 10, name: 'Member' } });
    const result = await TeamService.addTeamMemberAdmin(1, { name: 'Member' });
    expect(api.post).toHaveBeenCalledWith('/teams/1/members', { name: 'Member' });
    expect(result).toEqual({ id: 10, name: 'Member' });
  });

  it('updateTeamMemberAdmin sends PUT /teams/:id/members/:memberId', async () => {
    api.put.mockResolvedValue({ data: { id: 10, name: 'Updated' } });
    const result = await TeamService.updateTeamMemberAdmin(1, 10, { name: 'Updated' });
    expect(api.put).toHaveBeenCalledWith('/teams/1/members/10', { name: 'Updated' });
    expect(result).toEqual({ id: 10, name: 'Updated' });
  });

  it('removeTeamMemberAdmin sends DELETE /teams/:id/members/:memberId', async () => {
    api.delete.mockResolvedValue({ data: { success: true } });
    const result = await TeamService.removeTeamMemberAdmin(1, 10);
    expect(api.delete).toHaveBeenCalledWith('/teams/1/members/10');
    expect(result).toEqual({ success: true });
  });
});
