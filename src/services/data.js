import { getStoredUser, supabaseDataRequest } from './auth';

const encode = value => encodeURIComponent(String(value));

export function createSyncId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();

  const values = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(values);
  } else {
    for (let index = 0; index < values.length; index += 1) values[index] = Math.floor(Math.random() * 256);
  }
  values[6] = (values[6] & 0x0f) | 0x40;
  values[8] = (values[8] & 0x3f) | 0x80;
  const hex = [...values].map(value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export async function listTasks() {
  return supabaseDataRequest('tasks?select=id,client_id,title,completed,created_at&order=created_at.asc');
}

export async function createTask(task) {
  const user = getStoredUser();
  if (!user) return null;
  const clientId = task.syncId || createSyncId();
  const rows = await supabaseDataRequest('tasks?on_conflict=user_id,client_id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: {
      user_id: user.id,
      client_id: clientId,
      title: task.title,
      completed: Boolean(task.done),
      completed_at: task.done ? new Date().toISOString() : null,
    },
  });
  return rows?.[0] || null;
}

export async function updateTask(task) {
  const rows = await supabaseDataRequest(`tasks?id=eq.${encode(task.id)}`, {
    method: 'PATCH',
    body: {
      title: task.title,
      completed: Boolean(task.done),
      completed_at: task.done ? new Date().toISOString() : null,
    },
  });
  return rows?.[0] || null;
}

export async function listMusicLinks() {
  return supabaseDataRequest('music_links?select=id,client_id,platform,title,source_url,embed_url,created_at&order=created_at.asc');
}

export async function createMusicLink(link) {
  const user = getStoredUser();
  if (!user) return null;
  const clientId = link.syncId || createSyncId();
  const rows = await supabaseDataRequest('music_links?on_conflict=user_id,client_id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: {
      user_id: user.id,
      client_id: clientId,
      platform: link.platform,
      title: link.title,
      source_url: link.url,
      embed_url: link.embedUrl,
    },
  });
  return rows?.[0] || null;
}

export async function updateMusicLink(id, title) {
  const rows = await supabaseDataRequest(`music_links?id=eq.${encode(id)}`, { method: 'PATCH', body: { title } });
  return rows?.[0] || null;
}

export async function removeMusicLink(id) {
  return supabaseDataRequest(`music_links?id=eq.${encode(id)}`, { method: 'DELETE' });
}

export async function recordFocusSession(mode, durationSeconds) {
  const user = getStoredUser();
  if (!user || mode !== 'pomodoro') return null;
  return supabaseDataRequest('focus_sessions', {
    method: 'POST',
    body: { user_id: user.id, mode, duration_seconds: durationSeconds, completed: true },
  });
}
