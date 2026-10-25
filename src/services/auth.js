const storageKey = 'pomocute-auth-v1';
const url = process.env.REACT_APP_SUPABASE_URL?.replace(/\/$/, '');
const anonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const configured = Boolean(url && anonKey && !url.includes('SEU-PROJETO'));
const headers = { 'Content-Type': 'application/json', ...(anonKey ? { apikey: anonKey } : {}) };

function readSession() {
  try { return JSON.parse(localStorage.getItem(storageKey)); } catch (_) { return null; }
}
function saveSession(session) {
  if (session) localStorage.setItem(storageKey, JSON.stringify(session));
  else localStorage.removeItem(storageKey);
}
async function request(path, body) {
  if (!configured) throw new Error('Configure o Supabase para ativar o login.');
  const response = await fetch(`${url}/auth/v1/${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.msg || payload.error_description || payload.message || 'Não foi possível concluir a autenticação.');
  return payload;
}

export const authConfigured = configured;
export function getStoredSession() { return readSession(); }
export function getStoredUser() { return readSession()?.user || null; }
export async function signInWithPassword(email, password) {
  const session = await request('token?grant_type=password', { email, password });
  saveSession(session);
  return session.user;
}
export async function signUpWithPassword(email, password, fullName) {
  const result = await request('signup', { email, password, data: { full_name: fullName } });
  if (result.access_token) saveSession(result);
  return result.user;
}
export function signInWithGoogle() {
  if (!configured) throw new Error('Configure o Supabase para ativar o login.');
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
  if (!session?.access_token || !configured) return null;
  const response = await fetch(`${url}/auth/v1/user`, { headers: { ...headers, Authorization: `Bearer ${session.access_token}` } });
  if (!response.ok) { saveSession(null); return null; }
  const user = await response.json();
  saveSession({ ...session, user });
  return user;
}
export function signOut() { saveSession(null); }