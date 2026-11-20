import React, { useCallback, useEffect, useRef, useState } from 'react';
import { FaCheck, FaListCheck, FaPlus } from 'react-icons/fa6';
import { FaTimes } from 'react-icons/fa';
import { playClick } from './ClickSound';
import { getStoredUser } from '../services/auth';
import { createSyncId, createTask, deleteTask, listTasks, updateTask } from '../services/data';
import { useI18n } from '../i18n';

const guestStorageKey = 'pomocute-tasks-v1';

function storageKeyFor(userId) {
  return userId ? `${guestStorageKey}:${userId}` : guestStorageKey;
}

function normalizeTask(task) {
  if (!task || typeof task.title !== 'string' || !task.title.trim()) return null;
  const syncId = typeof task.syncId === 'string' && task.syncId ? task.syncId : createSyncId();
  return {
    id: typeof task.id === 'string' && task.id ? task.id : `local-${syncId}`,
    syncId,
    title: task.title.trim().slice(0, 280),
    done: Boolean(task.done),
    pending: Boolean(task.pending),
    deleted: Boolean(task.deleted),
  };
}

function taskFromRow(task) {
  return normalizeTask({
    id: task.id,
    syncId: task.client_id,
    title: task.title,
    done: task.completed,
    pending: false,
  });
}

function loadTasks(userId = null) {
  try {
    const tasks = JSON.parse(localStorage.getItem(storageKeyFor(userId)));
    return Array.isArray(tasks) ? tasks.map(normalizeTask).filter(Boolean) : [];
  } catch (_) {
    return [];
  }
}

export default function TasksButton() {
  const { t } = useI18n();
  const initialUser = getStoredUser();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [user, setUser] = useState(initialUser);
  const [tasks, setTasks] = useState(() => loadTasks(initialUser?.id));
  const userIdRef = useRef(initialUser?.id || null);
  const tasksRef = useRef(tasks);
  const requestSync = useRef(null);
  const visibleTasks = tasks.filter(task => !task.deleted);

  const storeTasks = useCallback((userId, nextTasks) => {
    tasksRef.current = nextTasks;
    try { localStorage.setItem(storageKeyFor(userId), JSON.stringify(nextTasks)); } catch (_) {}
    setTasks(nextTasks);
  }, []);

  useEffect(() => {
    const syncUser = event => {
      const nextUser = event.detail?.user || getStoredUser();
      const nextUserId = nextUser?.id || null;
      if (nextUserId === userIdRef.current) return;
      userIdRef.current = nextUserId;
      // Cada conta e o visitante mantêm seu próprio cache.
      const nextTasks = loadTasks(nextUserId);
      tasksRef.current = nextTasks;
      setTasks(nextTasks);
      setUser(nextUser);
    };
    window.addEventListener('pomocute:auth-change', syncUser);
    return () => window.removeEventListener('pomocute:auth-change', syncUser);
  }, []);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) return undefined;
    let active = true;
    let syncing = false;
    let syncAgain = false;
    const isCurrent = () => active && userIdRef.current === userId;

    const syncTasks = async () => {
      if (!isCurrent()) return;
      if (syncing) {
        syncAgain = true;
        return;
      }
      syncing = true;
      const snapshot = tasksRef.current;
      try {
        const remoteRows = await listTasks();
        if (!isCurrent() || !Array.isArray(remoteRows)) return;

        const remoteTasks = remoteRows.map(taskFromRow).filter(Boolean);
        const merged = new Map(remoteTasks.map(task => [task.syncId, task]));
        const remoteById = new Map(remoteTasks.map(task => [task.id, task]));
        for (const task of snapshot) {
          if (!isCurrent()) return;
          if (!task.pending) continue;
          const remote = merged.get(task.syncId) || remoteById.get(task.id);
          const isLocal = task.id.startsWith('local-');
          try {
            if (task.deleted) {
              if (remote) merged.delete(remote.syncId);
              if (!await deleteTask(remote || task)) merged.set(task.syncId, task);
            } else if (remote || isLocal) {
              const saved = remote
                ? await updateTask({ ...task, id: remote.id })
                : await createTask(task);
              if (remote && remote.syncId !== task.syncId) merged.delete(remote.syncId);
              merged.set(task.syncId, saved ? taskFromRow(saved) : task);
            }
          } catch (_) {
            if (remote) merged.delete(remote.syncId);
            merged.set(task.syncId, task);
          }
        }

        if (!isCurrent()) return;
        const original = new Map(snapshot.map(task => [task.syncId, task]));
        for (const task of tasksRef.current) {
          if (original.get(task.syncId) !== task) merged.set(task.syncId, task);
        }
        storeTasks(userId, [...merged.values()]);
      } catch (_) {
        // O cache separado da própria conta permanece disponível sem rede.
      } finally {
        syncing = false;
        if (syncAgain && isCurrent()) {
          syncAgain = false;
          void syncTasks();
        }
      }
    };

    requestSync.current = syncTasks;
    window.addEventListener('online', syncTasks);
    syncTasks();
    return () => {
      active = false;
      requestSync.current = null;
      window.removeEventListener('online', syncTasks);
    };
  }, [storeTasks, user?.id]);

  const changeTasks = update => {
    storeTasks(userIdRef.current, update(tasksRef.current));
    void requestSync.current?.();
  };

  const addTask = event => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;

    const syncId = createSyncId();
    const localTask = {
      id: `local-${syncId}`,
      syncId,
      title: cleanTitle.slice(0, 280),
      done: false,
      pending: Boolean(user?.id),
    };
    changeTasks(previous => [...previous, localTask]);
    setTitle('');
  };

  const toggleTask = task => {
    const updated = { ...task, done: !task.done, pending: Boolean(user?.id) };
    changeTasks(previous => previous.map(item => item.syncId === task.syncId ? updated : item));
  };
  const removeTask = task => {
    playClick();
    changeTasks(previous => user?.id
      ? previous.map(item => item.syncId === task.syncId ? { ...item, deleted: true, pending: true } : item)
      : previous.filter(item => item.syncId !== task.syncId));
  };

  return <div className="tasks-dock">
    {isOpen && <section className="tasks-menu" aria-label={t('tasks.title')}>
      <header><div><span>{t('tasks.eyebrow')}</span><strong>{t('tasks.title')}</strong></div><button type="button" aria-label={t('tasks.close')} onClick={() => setIsOpen(false)}><FaTimes /></button></header>
      <form onSubmit={addTask}><label className="sr-only" htmlFor="task-title">{t('tasks.new')}</label><input id="task-title" maxLength="280" value={title} onChange={event => setTitle(event.target.value)} placeholder={t('tasks.placeholder')} /><button type="submit" aria-label={t('tasks.add')}><FaPlus /></button></form>
      {visibleTasks.length > 0 && <ul>{visibleTasks.reverse().map(task => <li key={task.syncId}><button type="button" className={`tasks-menu__task${task.done ? ' is-done' : ''}`} onClick={() => toggleTask(task)}><FaCheck aria-hidden="true" /><span>{task.title}</span></button><button type="button" className="tasks-menu__delete" onClick={() => removeTask(task)} aria-label={t('tasks.remove', { title: task.title })} title={t('tasks.remove', { title: task.title })}><FaTimes aria-hidden="true" /></button></li>)}</ul>}
    </section>}
    <button type="button" className="tasks-dock__trigger" onClick={() => { playClick(); setIsOpen(open => !open); }} aria-label={t('tasks.open')} aria-expanded={isOpen} title={t('tasks.title')}><FaListCheck aria-hidden="true" /></button>
  </div>;
}
