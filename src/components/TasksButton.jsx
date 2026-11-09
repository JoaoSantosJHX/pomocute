import React, { useEffect, useState } from 'react';
import { FaCheck, FaListCheck, FaPlus } from 'react-icons/fa6';
import { FaTimes } from 'react-icons/fa';
import { playClick } from './ClickSound';
import { getStoredUser } from '../services/auth';
import { createTask, listTasks, updateTask } from '../services/data';
import { useI18n } from '../i18n';

const storageKey = 'pomocute-tasks-v1';

function loadTasks() {
  try {
    const tasks = JSON.parse(localStorage.getItem(storageKey));
    return Array.isArray(tasks) ? tasks.filter(task => task && typeof task.title === 'string') : [];
  } catch (_) {
    return [];
  }
}

export default function TasksButton() {
  const { t } = useI18n();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState(loadTasks);
  const [user, setUser] = useState(getStoredUser);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(tasks)); } catch (_) {}
  }, [tasks]);

  useEffect(() => {
    const syncUser = event => setUser(event.detail?.user || getStoredUser());
    window.addEventListener('pomocute:auth-change', syncUser);
    return () => window.removeEventListener('pomocute:auth-change', syncUser);
  }, []);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    const syncTasks = async () => {
      try {
        const remoteRows = await listTasks();
        if (!active || !remoteRows) return;
        const remoteTasks = remoteRows.map(task => ({ id: task.id, title: task.title, done: task.completed }));
        const remoteTitles = new Set(remoteTasks.map(task => `${task.title.trim().toLowerCase()}-${task.done}`));
        const localOnly = loadTasks().filter(task => !remoteTitles.has(`${task.title.trim().toLowerCase()}-${task.done}`));
        const created = await Promise.all(localOnly.map(createTask));
        if (active) setTasks([...remoteTasks, ...created.filter(Boolean).map(task => ({ id: task.id, title: task.title, done: task.completed }))]);
      } catch (_) {
        // Dados locais seguem disponíveis se a sincronização estiver indisponível.
      }
    };
    syncTasks();
    return () => { active = false; };
  }, [user?.id]);

  const addTask = event => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    const localTask = { id: `local-${Date.now()}-${cleanTitle}`, title: cleanTitle, done: false };
    setTasks(previous => [...previous, localTask]);
    if (user?.id) {
      createTask(localTask).then(saved => {
        if (saved) setTasks(previous => previous.map(task => task.id === localTask.id ? { id: saved.id, title: saved.title, done: saved.completed } : task));
      }).catch(() => {});
    }
    setTitle('');
  };

  const toggleTask = task => {
    const updated = { ...task, done: !task.done };
    setTasks(previous => previous.map(item => item.id === task.id ? updated : item));
    if (!user?.id) return;
    const persist = task.id.startsWith('local-') ? createTask(updated) : updateTask(updated);
    persist.then(saved => {
      if (saved) setTasks(previous => previous.map(item => item.id === task.id ? { id: saved.id, title: saved.title, done: saved.completed } : item));
    }).catch(() => {});
  };

  return <div className="tasks-dock">
    {isOpen && <section className="tasks-menu" aria-label={t('tasks.title')}>
      <header><div><span>{t('tasks.eyebrow')}</span><strong>{t('tasks.title')}</strong></div><button type="button" aria-label={t('tasks.close')} onClick={() => setIsOpen(false)}><FaTimes /></button></header>
      <form onSubmit={addTask}><label className="sr-only" htmlFor="task-title">{t('tasks.new')}</label><input id="task-title" value={title} onChange={event => setTitle(event.target.value)} placeholder={t('tasks.placeholder')} /><button type="submit" aria-label={t('tasks.add')}><FaPlus /></button></form>
      {tasks.length > 0 && <ul>{tasks.map(task => <li key={task.id}><button type="button" className={task.done ? 'is-done' : ''} onClick={() => toggleTask(task)}><FaCheck aria-hidden="true" /><span>{task.title}</span></button></li>)}</ul>}
    </section>}
    <button type="button" className="tasks-dock__trigger" onClick={() => { playClick(); setIsOpen(open => !open); }} aria-label={t('tasks.open')} aria-expanded={isOpen} title={t('tasks.title')}><FaListCheck aria-hidden="true" /></button>
  </div>;
}
