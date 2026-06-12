/* API Service Layer — HTTP client with auth support */

const API_BASE = 'http://localhost:8000/api/v1';

const Api = {
  async request(method, path, body=null, auth=true) {
    const headers = {};
    const isFormData = body instanceof FormData;
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }
    if (auth) {
      const token = Auth.getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }
    const opts = { method, headers };
    if (body) {
      opts.body = isFormData ? body : JSON.stringify(body);
    }
    try {
      const r = await fetch(API_BASE + path, opts);
      if (!r.ok) {
        const err = await r.json().catch(() => ({detail: r.statusText}));
        if (r.status === 401) {
          Auth.clearSession();
          window.location.href = 'login.html';
          throw { status: 401, message: 'Session expired', data: err };
        }
        throw { status: r.status, message: err.detail || 'Request failed', data: err };
      }
      return r.status === 204 ? null : await r.json();
    } catch(e) {
      if (e.status) throw e;
      throw { status: 0, message: 'Network error — check connection', data: null };
    }
  },
  get: (path, auth=true) => Api.request('GET', path, null, auth),
  post: (path, body, auth=true) => Api.request('POST', path, body, auth),
  put: (path, body, auth=true) => Api.request('PUT', path, body, auth),
  delete: (path, auth=true) => Api.request('DELETE', path, null, auth),
};

/* Auth endpoints — no auth header needed */
const AuthService = {
  login: (data) => Api.post('/auth/login', data, false),
  register: (data) => Api.post('/auth/register', data, false),
  getMe: () => Api.get('/auth/me'),
};

/* Team endpoints */
const TeamService = {
  getMyTeam: () => Api.get('/teams/my-team'),
  updateMyTeam: (data) => Api.put('/teams/my-team', data),
  addMember: (data) => Api.post('/teams/my-team/members', data),
  removeMember: (id) => Api.delete(`/teams/my-team/members/${id}`),
  listTeams: () => Api.get('/teams'),
  updateTeam: (id, data) => Api.put(`/teams/${id}`, data),
  uploadMembersCsv: (formData) => Api.request('POST', '/teams/upload-members-csv', formData, true),
};

/* Prediction endpoints */
const PredictionService = {
  submit: (data) => Api.post('/predictions', data),
  list: () => Api.get('/predictions'),
};

/* Actual result endpoints */
const ActualResultService = {
  submit: (data) => Api.post('/actual-results', data),
};

/* Scoring endpoints */
const ScoringService = {
  calculateMatchScore: (prediction, actual_result) => Api.post('/calculate-match-score', {prediction, actual_result}),
  calculateTechnical: (data) => Api.post('/technical-score', data),
  calculatePresentation: (list) => Api.post('/presentation-score', list),
};

/* Leaderboard endpoints */
const LeaderboardService = {
  calculate: (entries) => Api.post('/leaderboard/calculate', entries),
  get: () => Api.get('/leaderboard'),
};

/* Match endpoints (if available) — currently managed client-side */
