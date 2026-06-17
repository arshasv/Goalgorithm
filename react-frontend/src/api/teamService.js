import api from './axios';

export const TeamService = {
  listTeams: async () => {
    const res = await api.get('/teams');
    return res.data;
  },
  getMyTeam: async () => {
    const res = await api.get('/teams/my-team');
    return res.data;
  },
  createTeam: async (data) => {
    const res = await api.post('/teams', data);
    return res.data;
  },
  updateTeam: async (teamId, data) => {
    const res = await api.put(`/teams/${teamId}`, data);
    return res.data;
  },
  uploadTeamsCsv: async (formData) => {
    const res = await api.post('/teams/upload-members-csv', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data;
  },
  addTeamMemberAdmin: async (teamId, data) => {
    const res = await api.post(`/teams/${teamId}/members`, data);
    return res.data;
  },
  updateTeamMemberAdmin: async (teamId, memberId, data) => {
    const res = await api.put(`/teams/${teamId}/members/${memberId}`, data);
    return res.data;
  },
  removeTeamMemberAdmin: async (teamId, memberId) => {
    const res = await api.delete(`/teams/${teamId}/members/${memberId}`);
    return res.data;
  }
};
