import { AuthService } from '../../api/authService';
import api from '../../api/axios';

vi.mock('../../api/axios');

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('login sends POST /auth/login with credentials', async () => {
    const credentials = { email: 'a@b.com', password: 'p' };
    api.post.mockResolvedValue({ data: { token: 't' } });
    const result = await AuthService.login(credentials);
    expect(api.post).toHaveBeenCalledWith('/auth/login', credentials);
    expect(result).toEqual({ token: 't' });
  });

  it('register sends POST /auth/register with data', async () => {
    const data = { email: 'a@b.com', password: 'p', full_name: 'A' };
    api.post.mockResolvedValue({ data: { id: 1 } });
    const result = await AuthService.register(data);
    expect(api.post).toHaveBeenCalledWith('/auth/register', data);
    expect(result).toEqual({ id: 1 });
  });

  it('getMe sends GET /auth/me', async () => {
    const user = { id: 1, email: 'a@b.com' };
    api.get.mockResolvedValue({ data: user });
    const result = await AuthService.getMe();
    expect(api.get).toHaveBeenCalledWith('/auth/me');
    expect(result).toEqual(user);
  });

  it('forgotPassword sends POST /auth/forgot-password with email', async () => {
    api.post.mockResolvedValue({ data: { msg: 'ok' } });
    const result = await AuthService.forgotPassword('a@b.com');
    expect(api.post).toHaveBeenCalledWith('/auth/forgot-password', { email: 'a@b.com' });
    expect(result).toEqual({ msg: 'ok' });
  });

  it('resetPassword sends POST /auth/reset-password', async () => {
    api.post.mockResolvedValue({ data: { success: true } });
    const result = await AuthService.resetPassword('a@b.com', '123456', 'newpass');
    expect(api.post).toHaveBeenCalledWith('/auth/reset-password', {
      email: 'a@b.com', otp: '123456', new_password: 'newpass'
    });
    expect(result).toEqual({ success: true });
  });
});
