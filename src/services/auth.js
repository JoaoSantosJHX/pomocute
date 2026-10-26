const storageKey = 'pomocute-auth-v1';
const url = process.env.REACT_APP_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

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
async function request(path, body) {
  if (!authConfigured) throw new Error('Configure o Supabase para ativar o login.');
  const response = await fetch(`${url}/auth/v1/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.msg || payload.error_description || payload.message || 'Não foi possível concluir a autenticação.');
  return payload;
}

export function getStoredSession() { return readSession(); }
export function getStoredUser() { return readSession()?.user || null; }
export function getAccessToken() { return readSession()?.access_token || null; }
export async function signInWithPassword(email, password) {
  const session = await request('token?grant_type=password', { email, password });
  saveSession(session);
  notifyAuthChange(session.user || null);
  return session.user;
}
export async function signUpWithPassword(email, password, fullName) {
  const result = await request('signup', { email, password, data: { full_name: fullName } });
  if (result.access_token) {
    saveSession(result);
    notifyAuthChange(result.user || null);
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
  const session = { access_token: accessToken, refresh_token: params.get('refresh_token'), expires_in: Number(params.get('expires_in') || 0), user: null };
  saveSession(session);
  window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
  return session;
}
export async function loadCurrentUser() {
  const session = readSession();
  if (!session?.access_token || !authConfigured) return null;
  const response = await fetch(`${url}/auth/v1/user`, { headers: { ...headers, Authorization: `Bearer ${session.access_token}` } });
  if (!response.ok) { saveSession(null); notifyAuthChange(null); return null; }
  const user = await response.json();
  saveSession({ ...session, user });
  notifyAuthChange(user);
  return user;
}
export function signOut() { saveSession(null); notifyAuthChange(null); }

export async function supabaseDataRequest(path, { method = 'GET', body } = {}) {
  const token = getAccessToken();
  if (!authConfigured || !token) return null;
  const response = await fetch(`${url}/rest/v1/${path}`, {
    method,
    headers: { ...headers, Authorization: `Bearer ${token}`, Prefer: 'return=representation' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!response.ok) throw new Error('Não foi possível sincronizar seus dados.');
  return response.status === 204 ? null : response.json();
}
