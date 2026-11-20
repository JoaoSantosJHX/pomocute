jest.mock('./auth', () => ({
  getStoredUser: jest.fn(),
  supabaseDataRequest: jest.fn(),
}));

import { getStoredUser, supabaseDataRequest } from './auth';
import { createMusicLink, createTask, recordFocusSession } from './data';

beforeEach(() => {
  jest.clearAllMocks();
  getStoredUser.mockReturnValue({ id: 'user-1' });
  supabaseDataRequest.mockResolvedValue([{ id: 'server-record' }]);
});

test('cria tarefa com chave estável para repetição segura', async () => {
  const task = { syncId: '8c10d20a-0000-4000-8000-000000000001', title: 'Revisar proposta', done: false };

  await expect(createTask(task)).resolves.toEqual({ id: 'server-record' });

  expect(supabaseDataRequest).toHaveBeenCalledWith('tasks?on_conflict=user_id,client_id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: {
      user_id: 'user-1',
      client_id: task.syncId,
      title: task.title,
      completed: false,
      completed_at: null,
    },
  });
});

test('cria link de música com chave estável para repetição segura', async () => {
  const link = {
    syncId: '8c10d20a-0000-4000-8000-000000000002',
    platform: 'youtube',
    title: 'Foco lo-fi',
    url: 'https://www.youtube.com/watch?v=M7lc1UVf-VE',
    embedUrl: 'https://www.youtube-nocookie.com/embed/M7lc1UVf-VE',
  };

  await expect(createMusicLink(link)).resolves.toEqual({ id: 'server-record' });

  expect(supabaseDataRequest).toHaveBeenCalledWith('music_links?on_conflict=user_id,client_id', {
    method: 'POST',
    prefer: 'resolution=merge-duplicates,return=representation',
    body: {
      user_id: 'user-1',
      client_id: link.syncId,
      platform: link.platform,
      title: link.title,
      source_url: link.url,
      embed_url: link.embedUrl,
    },
  });
});

test('registra sessão concluída usando uma chave idempotente', async () => {
  const syncId = '8c10d20a-0000-4000-8000-000000000003';

  await recordFocusSession('pomodoro', 1500, syncId, 'user-1');

  expect(supabaseDataRequest).toHaveBeenCalledWith('focus_sessions?on_conflict=user_id,client_id', {
    method: 'POST',
    prefer: 'resolution=ignore-duplicates,return=minimal',
    body: {
      user_id: 'user-1',
      client_id: syncId,
      mode: 'pomodoro',
      duration_seconds: 1500,
      completed: true,
    },
  });
});

test('não registra sessão sem conta ou sem chave estável', async () => {
  await expect(recordFocusSession('pomodoro', 1500, undefined, 'user-1')).resolves.toBeNull();
  getStoredUser.mockReturnValue(null);
  await expect(recordFocusSession('pomodoro', 1500, '8c10d20a-0000-4000-8000-000000000003', 'user-1')).resolves.toBeNull();
  getStoredUser.mockReturnValue({ id: 'user-2' });
  await expect(recordFocusSession('pomodoro', 1500, '8c10d20a-0000-4000-8000-000000000003', 'user-1')).resolves.toBeNull();
  expect(supabaseDataRequest).not.toHaveBeenCalled();
});

test('não envia dados locais sem uma conta autenticada', async () => {
  getStoredUser.mockReturnValue(null);

  await expect(createTask({ title: 'Tarefa local' })).resolves.toBeNull();

  expect(supabaseDataRequest).not.toHaveBeenCalled();
});
