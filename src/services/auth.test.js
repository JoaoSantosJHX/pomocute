const originalUrl = process.env.REACT_APP_SUPABASE_URL;
const originalAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const user = { id: 'user-123', email: 'person@example.com' };

function response(payload, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: jest.fn().mockResolvedValue(payload) };
}

function loadAuth() {
  jest.resetModules();
  return require('./auth');
}

beforeEach(() => {
  localStorage.clear();
  process.env.REACT_APP_SUPABASE_URL = 'https://pomocute-test.supabase.co';
  process.env.REACT_APP_SUPABASE_ANON_KEY = 'anon-key';
  global.fetch = jest.fn();
});

afterEach(() => {
  jest.restoreAllMocks();
  if (originalUrl === undefined) delete process.env.REACT_APP_SUPABASE_URL;
  else process.env.REACT_APP_SUPABASE_URL = originalUrl;
  if (originalAnonKey === undefined) delete process.env.REACT_APP_SUPABASE_ANON_KEY;
  else process.env.REACT_APP_SUPABASE_ANON_KEY = originalAnonKey;
});

describe('auth session persistence', () => {
  it('renews an expired session and restores the user after reopening the app', async () => {
    localStorage.setItem('pomocute-auth-v1', JSON.stringify({
      access_token: 'expired-token', refresh_token: 'old-refresh-token',
      expires_at: Math.floor(Date.now() / 1000) - 10, user,
    }));
    global.fetch
      .mockResolvedValueOnce(response({ access_token: 'fresh-token', refresh_token: 'new-refresh-token', expires_in: 3600, user }))
      .mockResolvedValueOnce(response(user));

    const { loadCurrentUser, getStoredSession } = loadAuth();
    await expect(loadCurrentUser()).resolves.toEqual(user);
    expect(global.fetch).toHaveBeenNthCalledWith(
      1,
      'https://pomocute-test.supabase.co/auth/v1/token?grant_type=refresh_token',
      expect.objectContaining({ method: 'POST', body: JSON.stringify({ refresh_token: 'old-refresh-token' }) }),
    );
    expect(global.fetch).toHaveBeenNthCalledWith(
      2,
      'https://pomocute-test.supabase.co/auth/v1/user',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer fresh-token' }) }),
    );
    expect(getStoredSession()).toEqual(expect.objectContaining({ access_token: 'fresh-token', refresh_token: 'new-refresh-token', user }));
  });

  it('keeps a saved session when a temporary user request fails', async () => {
    const savedSession = { access_token: 'valid-token', refresh_token: 'refresh-token', user };
    localStorage.setItem('pomocute-auth-v1', JSON.stringify(savedSession));
    global.fetch.mockResolvedValueOnce(response({ message: 'Temporarily unavailable' }, 500));

    const { loadCurrentUser, getStoredSession } = loadAuth();
    await expect(loadCurrentUser()).resolves.toEqual(user);
    expect(getStoredSession()).toEqual(expect.objectContaining(savedSession));
  });

  it('refreshes once and retries a Supabase data request after an expired token', async () => {
    localStorage.setItem('pomocute-auth-v1', JSON.stringify({
      access_token: 'expired-token', refresh_token: 'refresh-token',
      expires_at: Math.floor(Date.now() / 1000) + 3600, user,
    }));
    global.fetch
      .mockResolvedValueOnce(response({ message: 'JWT expired' }, 401))
      .mockResolvedValueOnce(response({ access_token: 'fresh-token', refresh_token: 'rotated-refresh-token', expires_in: 3600, user }))
      .mockResolvedValueOnce(response([{ id: 'task-1', title: 'Persisted task' }]));

    const { supabaseDataRequest } = loadAuth();
    await expect(supabaseDataRequest('tasks?select=*')).resolves.toEqual([{ id: 'task-1', title: 'Persisted task' }]);
    expect(global.fetch).toHaveBeenNthCalledWith(
      3,
      'https://pomocute-test.supabase.co/rest/v1/tasks?select=*',
      expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer fresh-token' }) }),
    );
  });

  it('shares one refresh request when two checks happen at the same time', async () => {
    localStorage.setItem('pomocute-auth-v1', JSON.stringify({
      access_token: 'expired-token', refresh_token: 'refresh-token',
      expires_at: Math.floor(Date.now() / 1000) - 10, user,
    }));
    let resolveRequest;
    global.fetch.mockImplementationOnce(() => new Promise(resolve => { resolveRequest = resolve; }));

    const { refreshSession } = loadAuth();
    const firstRefresh = refreshSession();
    const secondRefresh = refreshSession();

    expect(firstRefresh).toBe(secondRefresh);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    resolveRequest(response({ access_token: 'fresh-token', refresh_token: 'new-refresh-token', expires_in: 3600, user }));
    await expect(firstRefresh).resolves.toEqual(expect.objectContaining({ access_token: 'fresh-token' }));
  });

  it('clears the local session and requests remote logout when configured', async () => {
    localStorage.setItem('pomocute-auth-v1', JSON.stringify({ access_token: 'valid-token', user }));
    global.fetch.mockResolvedValueOnce(response({}));

    const { signOut, getStoredSession } = loadAuth();
    const logout = signOut();

    expect(getStoredSession()).toBeNull();
    await logout;
    expect(global.fetch).toHaveBeenCalledWith(
      'https://pomocute-test.supabase.co/auth/v1/logout',
      expect.objectContaining({ method: 'POST', headers: expect.objectContaining({ Authorization: 'Bearer valid-token' }) }),
    );
  });
});
