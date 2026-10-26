import { getStoredUser, supabaseDataRequest } from './auth';

const encode = value => encodeURIComponent(String(value));

export async function listTasks() {
  return supabaseDataRequest('tasks?select=id,title,completed,created_at&order=created_at.asc');
}
export async function createTask(task) {
  const user = getStoredUser();
  if (!user) return null;
  const rows = await supabaseDataRequest('tasks', { method: 'POST', body: { user_id: user.id, title: task.title, completed: Boolean(task.done), completed_at: task.done ? new Date().toISOString() : null } });
  return rows?.[0] || null;
}
export async function updateTask(task) {
  const rows = await supabaseDataRequest(`tasks?id=eq.${encode(task.id)}`, { method: 'PATCH', body: { title: task.title, completed: Boolean(task.done), completed_at: task.done ? new Date().toISOString() : null } });
  return rows?.[0] || null;
}

export async function listMusicLinks() {
  return supabaseDataRequest('music_links?select=id,platform,title,source_url,embed_url,created_at&order=created_at.asc');
}
export async function createMusicLink(link) {
  const user = getStoredUser();
  if (!user) return null;
  const rows = await supabaseDataRequest('music_links', { method: 'POST', body: { user_id: user.id, platform: link.platform, title: link.title, source_url: link.url, embed_url: link.embedUrl } });
  return rows?.[0] || null;
}
export async function removeMusicLink(id) {
  return supabaseDataRequest(`music_links?id=eq.${encode(id)}`, { method: 'DELETE' });
}

export async function recordFocusSession(mode, durationSeconds) {
  const user = getStoredUser();
  if (!user || mode !== 'pomodoro') return null;
  return supabaseDataRequest('focus_sessions', { method: 'POST', body: { user_id: user.id, mode, duration_seconds: durationSeconds, completed: true } });
}
