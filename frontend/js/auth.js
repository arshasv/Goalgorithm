/* Auth Service — JWT token management, login, register */

const TOKEN_KEY = 'fifa_token';
const USER_KEY = 'fifa_user';

const Auth = {
  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  isAuthenticated() {
    return !!this.getToken();
  },

  getRole() {
    const user = this.getUser();
    return user ? user.role : null;
  },

  isOrganizer() {
    return this.getRole() === 'ORGANIZER';
  },

  isTeamLeader() {
    return this.getRole() === 'TEAM_LEADER';
  },

  setSession(token, user) {
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  },

  clearSession() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  },

  async login(email, password) {
    const data = await Api.post('/auth/login', { email, password });
    this.setSession(data.access_token, data.user);
    return data.user;
  },

  async register(payload) {
    const data = await Api.post('/auth/register', payload);
    this.setSession(data.access_token, data.user);
    return data.user;
  },

  async getMe() {
    return await Api.get('/auth/me');
  },

  logout() {
    this.clearSession();
    window.location.href = 'login.html';
  },

  getAuthHeaders() {
    const token = this.getToken();
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  },

  requireAuth(role) {
    if (!this.isAuthenticated()) {
      window.location.href = 'login.html';
      return false;
    }
    if (role && this.getRole() !== role) {
      window.location.href = 'login.html';
      return false;
    }
    return true;
  }
};
