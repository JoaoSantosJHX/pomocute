const storageKey = 'pomocute-auth-v1';
const url = process.env.REACT_APP_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const refreshLeewayMs = 60 * 1000;

export const authConfigured = Boolean(url && anonKey && !url.includes('SEU-PROJETO'));
const headers = { 'Content-Type': 'application/json', ...(anonKey ? { apikey: anonKey } : {}) };

function readSession() {
  try { return JSON.parse(localStorage.getItem(storageKey)); } catch (_) { return null; }
}

function notifyAuthChange(user = null) {
  window.dispatchEvent(new CustomEvent('pomocute:auth-change', { detail: { user } }));
}

function saveSession(session) {
  if (session) localStorage.setItem(storageKey, JSON.stringify(session));
  else localStorage.removeItem(storageKey);
}

function toSession(payload, previousSession = null) {
  if (!payload?.access_token) return null;
  const expiresIn = Number(payload.expires_in || 0);
  const expiresAt = Number(payload.expires_at) || (expiresIn > 0 ? Math.floor(Date.now() / 1000) + expiresIn : null);
  return {
    access_token: payload.access_token,
    refresh_token: payload.refresh_token || previousSession?.refresh_token || null,
    expires_in: expiresIn || null,
    expires_at: expiresAt,
    token_type: payload.token_type || previousSession?.token_type || 'bearer',
    user: payload.user || previousSession?.user || null,
  };
}

function isExpiring(session) {
  const expiresAt = Number(session?.expires_at);
  return Number.isFinite(expiresAt) && expiresAt * 1000 <= Date.now() + refreshLeewayMs;
}

async function request(path, body, { authorization } = {}) {
  if (!authConfigured) throw new Error('Configure o Supabase para ativar o login.');
  const response = await fetch(`${url}/auth/v1/${path}`, {
    method: 'POST',
    headers: { ...headers, ...(authorization ? { Authorization: `Bearer ${authorization}` } : {}) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.msg || payload.error_description || payload.message || 'Não foi possível concluir a autenticação.');
  return payload;
}

async function refreshSession(session = readSession()) {
  if (!session?.refresh_token || !authConfigured) return null;
  try {
    const payload = await request('token?grant_type=refresh_token', { refresh_token: session.refresh_token });
    const refreshedSession = toSession(payload, session);
    if (!refreshedSession) return null;
    saveSession(refreshedSession);
    notifyAuthChange(refreshedSession.user || null);
    return refreshedSession;
  } catch (_) {
    return null;
  }
}

async function activeSession() {
  const session = readSession();
  if (!session?.access_token) return null;
  if (!isExpiring(session)) return session;
  return refreshSession(session);
}

async function currentUserRequest(session) {
  return fetch(`${url}/auth/v1/user`, {
    headers: { ...headers, Authorization: `Bearer ${session.access_token}` },
  });
}

export function getStoredSession() { return readSession(); }
export function getStoredUser() { return readSession()?.user || null; }
export function getAccessToken() { return readSession()?.access_token || null; }

export async function signInWithPassword(email, password) {
  const payload = await request('token?grant_type=password', { email, password });
  const session = toSession(payload);
  if (session) {
    saveSession(session);
    notifyAuthChange(session.user || null);
  }
  return { user: payload.user || session?.user || null, session };
}

export async function signUpWithPassword(email, password, fullName) {
  const payload = await request('signup', { email, password, data: { full_name: fullName } });
  const session = toSession(payload);
  if (session) {
    saveSession(session);
    notifyAuthChange(session.user || null);
  }
  return { user: payload.user || session?.user || null, session };
}

export function signInWithGoogle() {
  if (!authConfigured) throw new Error('Configure o Supabase para ativar o login.');
  const redirectTo = `${window.location.origin}${window.location.pathname}`;
  window.location.assign(`${url}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectTo)}`);
}

export function captureOAuthSession() {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const session = toSession({
    access_token: params.get('access_token'),
    refresh_token: params.get('refresh_token'),
    expires_in: Number(params.get('expires_in') || 0),
    token_type: params.get('token_type'),
  });
  if (!session) return null;
  saveSession(session);
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return session;
}

export async function loadCurrentUser() {
  let session = await activeSession();
  if (!session || !authConfigured) return null;

  let response = await currentUserRequest(session);
  if (response.status === 401) {
    session = await refreshSession(session);
    if (session) response = await currentUserRequest(session);
  }

  if (!response.ok) {
    if (response.status === 401) {
      saveSession(null);
      notifyAuthChange(null);
    }
    return null;
  }

  const user = await response.json();
  saveSession({ ...session, user });
  notifyAuthChange(user);
  return user;
}

export async function signOut() {
  const session = readSession();
  try {
    if (authConfigured && session?.access_token) {
      await request('logout', undefined, { authorization: session.access_token });
    }
  } catch (_) {
    // A limpeza local não depende da disponibilidade da rede.
  } finally {
    saveSession(null);
    notifyAuthChange(null);
  }
}

export async function supabaseDataRequest(path, { method = 'GET', body, prefer = 'return=representation' } = {}) {
  let session = await activeSession();
  if (!authConfigured || !session?.access_token) return null;

  const send = currentSession => fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: {
      ...headers,
      Authorization: `Bearer ${currentSession.access_token}`,
      Prefer: prefer,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  let response = await send(session);
  if (response.status === 401) {
    session = await refreshSession(session);
    if (session) response = await send(session);
  }

  if (!response.ok) throw new Error('Não foi possível sincronizar seus dados.');
  return response.status === 204 ? null : response.json();
}
