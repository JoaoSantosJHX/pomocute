import React, { useEffect, useState } from 'react';
import { FaCheck, FaListCheck, FaPlus } from 'react-icons/fa6';
import { FaTimes } from 'react-icons/fa';
import { playClick } from './ClickSound';
import { getStoredUser } from '../services/auth';
import { createSyncId, createTask, listTasks, updateTask } from '../services/data';
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

  useEffect(() => {
    try { localStorage.setItem(storageKeyFor(user?.id), JSON.stringify(tasks)); } catch (_) {}
  }, [tasks, user?.id]);

  useEffect(() => {
    const syncUser = event => {
      const nextUser = event.detail?.user || getStoredUser();
      if (nextUser?.id) {
        // Itens de visitante não são enviados automaticamente para uma conta.
        try { localStorage.removeItem(guestStorageKey); } catch (_) {}
        setTasks(loadTasks(nextUser.id));
      } else {
        // Após sair, não exibimos os dados da conta anterior nem de outro visitante.
        setTasks([]);
      }
      setUser(nextUser);
    };
    window.addEventListener('pomocute:auth-change', syncUser);
    return () => window.removeEventListener('pomocute:auth-change', syncUser);
  }, []);

  useEffect(() => {
    if (!user?.id) return undefined;
    let active = true;

    const syncTasks = async () => {
      try {
        const remoteRows = await listTasks();
        if (!active || !remoteRows) return;

        const remoteTasks = remoteRows.map(taskFromRow).filter(Boolean);
        const remoteBySyncId = new Map(remoteTasks.map(task => [task.syncId, task]));
        const localTasks = loadTasks(user.id);
        const pendingOrMissing = localTasks.filter(task => task.pending || !remoteBySyncId.has(task.syncId));

        const resolved = await Promise.all(pendingOrMissing.map(async task => {
          const remote = remoteBySyncId.get(task.syncId);
          try {
            const saved = remote
              ? await updateTask({ ...task, id: remote.id })
              : await createTask(task);
            return saved ? taskFromRow(saved) : { ...task, pending: true };
          } catch (_) {
            return { ...task, pending: true };
          }
        }));

        if (!active) return;
        const merged = new Map(remoteTasks.map(task => [task.syncId, task]));
        resolved.forEach(task => merged.set(task.syncId, task));
        setTasks([...merged.values()]);
      } catch (_) {
        // O cache separado da própria conta permanece disponível sem rede.
      }
    };

    syncTasks();
    return () => { active = false; };
  }, [user?.id]);

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
    setTasks(previous => [...previous, localTask]);

    if (user?.id) {
      createTask(localTask).then(saved => {
        if (saved) {
          const syncedTask = taskFromRow(saved);
          setTasks(previous => previous.map(task => task.syncId === localTask.syncId ? syncedTask : task));
        }
      }).catch(() => {});
    }
    setTitle('');
  };

  const toggleTask = task => {
    const updated = { ...task, done: !task.done, pending: Boolean(user?.id) };
    setTasks(previous => previous.map(item => item.syncId === task.syncId ? updated : item));
    if (!user?.id) return;

    const persist = task.id.startsWith('local-') ? createTask(updated) : updateTask(updated);
    persist.then(saved => {
      if (saved) {
        const syncedTask = taskFromRow(saved);
        setTasks(previous => previous.map(item => item.syncId === task.syncId ? syncedTask : item));
      }
    }).catch(() => {});
  };

  return <div className="tasks-dock">
    {isOpen && <section className="tasks-menu" aria-label={t('tasks.title')}>
      <header><div><span>{t('tasks.eyebrow')}</span><strong>{t('tasks.title')}</strong></div><button type="button" aria-label={t('tasks.close')} onClick={() => setIsOpen(false)}><FaTimes /></button></header>
      <form onSubmit={addTask}><label className="sr-only" htmlFor="task-title">{t('tasks.new')}</label><input id="task-title" maxLength="280" value={title} onChange={event => setTitle(event.target.value)} placeholder={t('tasks.placeholder')} /><button type="submit" aria-label={t('tasks.add')}><FaPlus /></button></form>
      {tasks.length > 0 && <ul>{tasks.map(task => <li key={task.syncId}><button type="button" className={task.done ? 'is-done' : ''} onClick={() => toggleTask(task)}><FaCheck aria-hidden="true" /><span>{task.title}</span></button></li>)}</ul>}
    </section>}
    <button type="button" className="tasks-dock__trigger" onClick={() => { playClick(); setIsOpen(open => !open); }} aria-label={t('tasks.open')} aria-expanded={isOpen} title={t('tasks.title')}><FaListCheck aria-hidden="true" /></button>
  </div>;
}
