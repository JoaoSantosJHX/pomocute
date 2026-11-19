const storageKey = 'pomocute-auth-v1';
const refreshLeewaySeconds = 60;
const refreshIntervalMs = 60 * 1000;
const url = process.env.REACT_APP_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
let refreshInFlight = null;

export const authConfigured = Boolean(url && anonKey && !url.includes('SEU-PROJETO'));
const headers = { 'Content-Type': 'application/json', ...(anonKey ? { apikey: anonKey } : {}) };

function nowInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function asTimestamp(value) {
  const timestamp = Number(value);
  if (!Number.isFinite(timestamp) || timestamp <= 0) return null;
  return Math.floor(timestamp > 100000000000 ? timestamp / 1000 : timestamp);
}

function getTokenExpiration(accessToken) {
  if (!accessToken || typeof window === 'undefined' || typeof window.atob !== 'function') return null;
  try {
    const encoded = accessToken.split('.')[1];
    if (!encoded) return null;
    const normalized = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')));
    return asTimestamp(payload.exp);
  } catch (_) {
    return null;
  }
}

function getSessionExpiration(session) {
  const explicitExpiration = asTimestamp(session?.expires_at);
  if (explicitExpiration) return explicitExpiration;

  const tokenExpiration = getTokenExpiration(session?.access_token);
  if (tokenExpiration) return tokenExpiration;

  const createdAt = asTimestamp(session?.created_at);
  const expiresIn = Number(session?.expires_in);
  return createdAt && Number.isFinite(expiresIn) && expiresIn > 0
    ? createdAt + Math.floor(expiresIn)
    : null;
}

function normalizeSession(session) {
  if (!session) return null;
  const normalized = { ...session, created_at: asTimestamp(session.created_at) || nowInSeconds() };
  const expiresAt = getSessionExpiration(normalized);
  return expiresAt ? { ...normalized, expires_at: expiresAt } : normalized;
}

function readSession() {
  try { return JSON.parse(localStorage.getItem(storageKey)); } catch (_) { return null; }
}

function notifyAuthChange(user = null) {
  window.dispatchEvent(new CustomEvent('pomocute:auth-change', { detail: { user } }));
}

function saveSession(session) {
  const normalized = normalizeSession(session);
  if (normalized) localStorage.setItem(storageKey, JSON.stringify(normalized));
  else localStorage.removeItem(storageKey);
  return normalized;
}

function clearSession() {
  saveSession(null);
  notifyAuthChange(null);
}

function isAuthenticationFailure(status) {
  return status === 400 || status === 401 || status === 403;
}

function shouldRefreshSession(session) {
  const expiresAt = getSessionExpiration(session);
  return Boolean(expiresAt && expiresAt <= nowInSeconds() + refreshLeewaySeconds);
}

async function request(path, body) {
  if (!authConfigured) throw new Error('Configure o Supabase para ativar o login.');
  const response = await fetch(`${url}/auth/v1/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(payload.msg || payload.error_description || payload.message || 'Não foi possível concluir a autenticação.');
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function fetchCurrentUser(accessToken) {
  return fetch(`${url}/auth/v1/user`, { headers: { ...headers, Authorization: `Bearer ${accessToken}` } });
}

async function getUsableSession({ forceRefresh = false } = {}) {
  const session = readSession();
  if (!session?.access_token) return null;
  if (!forceRefresh && !shouldRefreshSession(session)) return session;
  return refreshSession();
}

export function getStoredSession() { return readSession(); }
export function getStoredUser() { return readSession()?.user || null; }
export function getAccessToken() { return readSession()?.access_token || null; }

export function refreshSession() {
  if (refreshInFlight) return refreshInFlight;

  const session = readSession();
  if (!session?.refresh_token) {
    if (session) clearSession();
    return Promise.resolve(null);
  }

  const refreshPromise = (async () => {
    try {
      const refreshed = await request('token?grant_type=refresh_token', { refresh_token: session.refresh_token });
      const nextSession = saveSession({ ...session, ...refreshed, user: refreshed.user || session.user });
      notifyAuthChange(nextSession?.user || null);
      return nextSession;
    } catch (error) {
      if (isAuthenticationFailure(error.status)) clearSession();
      throw error;
    }
  })();

  refreshInFlight = refreshPromise.finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function signInWithPassword(email, password) {
  const session = await request('token?grant_type=password', { email, password });
  const savedSession = saveSession(session);
  notifyAuthChange(savedSession?.user || null);
  return savedSession?.user || null;
}

export async function signUpWithPassword(email, password, fullName) {
  const result = await request('signup', { email, password, data: { full_name: fullName } });
  if (result.access_token) {
    const session = saveSession(result);
    notifyAuthChange(session?.user || null);
  }
  return result.user;
}

export function signInWithGoogle() {
  if (!authConfigured) throw new Error('Configure o Supabase para ativar o login.');
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  window.location.assign(`${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`);
}

export function captureOAuthSession() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const accessToken = params.get('access_token');
  if (!accessToken) return null;
  const session = saveSession({
    access_token: accessToken,
    refresh_token: params.get('refresh_token'),
    expires_in: Number(params.get('expires_in') || 0),
    expires_at: Number(params.get('expires_at') || 0) || undefined,
    user: null,
  });
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return session;
}

export async function loadCurrentUser() {
  const storedSession = readSession();
  if (!storedSession?.access_token) return null;
  if (!authConfigured) return storedSession.user || null;

  let session;
  try {
    session = await getUsableSession();
  } catch (_) {
    return readSession()?.user || null;
  }
  if (!session?.access_token) return null;

  let response = await fetchCurrentUser(session.access_token);
  if (isAuthenticationFailure(response.status)) {
    try {
      session = await getUsableSession({ forceRefresh: true });
    } catch (_) {
      return readSession()?.user || null;
    }
    if (!session?.access_token) return null;
    response = await fetchCurrentUser(session.access_token);
  }

  if (!response.ok) {
    if (isAuthenticationFailure(response.status)) clearSession();
    return readSession()?.user || null;
  }

  const user = await response.json();
  saveSession({ ...session, user });
  notifyAuthChange(user);
  return user;
}

export function startSessionAutoRefresh() {
  if (!authConfigured || typeof window === 'undefined') return () => {};

  const refreshIfNeeded = async () => {
    const session = readSession();
    if (!session || !shouldRefreshSession(session)) return;
    try { await refreshSession(); } catch (_) {
      // Mantém a sessão salva em falhas transitórias de rede.
    }
  };
  const refreshOnFocus = () => { void refreshIfNeeded(); };
  const refreshOnVisibility = () => {
    if (document.visibilityState === 'visible') void refreshIfNeeded();
  };

  const interval = window.setInterval(refreshIfNeeded, refreshIntervalMs);
  window.addEventListener('focus', refreshOnFocus);
  document.addEventListener('visibilitychange', refreshOnVisibility);
  void refreshIfNeeded();

  return () => {
    window.clearInterval(interval);
    window.removeEventListener('focus', refreshOnFocus);
    document.removeEventListener('visibilitychange', refreshOnVisibility);
  };
}

export function signOut() { clearSession(); }

async function requestData(path, method, body, accessToken) {
  return fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: { ...headers, Authorization: `Bearer ${accessToken}`, Prefer: 'return=representation' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
}

export async function supabaseDataRequest(path, { method = 'GET', body } = {}) {
  if (!authConfigured || !readSession()?.access_token) return null;

  let session;
  try {
    session = await getUsableSession();
  } catch (_) {
    session = readSession();
  }
  if (!session?.access_token) return null;

  let response = await requestData(path, method, body, session.access_token);
  if (isAuthenticationFailure(response.status)) {
    try {
      session = await getUsableSession({ forceRefresh: true });
    } catch (_) {
      if (!readSession()) return null;
      throw new Error('Não foi possível renovar sua sessão.');
    }
    if (!session?.access_token) return null;
    response = await requestData(path, method, body, session.access_token);
  }

  if (!response.ok) throw new Error('Não foi possível sincronizar seus dados.');
  return response.status === 204 ? null : response.json();
}
