import React, { useEffect, useState } from 'react';
import { FaCheck, FaListCheck, FaPlus } from 'react-icons/fa6';
import { FaTimes } from 'react-icons/fa';
import { playClick } from './ClickSound';

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
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [tasks, setTasks] = useState(loadTasks);

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(tasks)); } catch (_) {}
  }, [tasks]);

  const addTask = event => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (!cleanTitle) return;
    setTasks(previous => [...previous, { id: `${Date.now()}-${cleanTitle}`, title: cleanTitle, done: false }]);
    setTitle('');
  };

  return <div className="tasks-dock">
    {isOpen && <section className="tasks-menu" aria-label="Tarefas">
      <header><div><span>Foco do dia</span><strong>Tarefas</strong></div><button type="button" aria-label="Fechar tarefas" onClick={() => setIsOpen(false)}><FaTimes /></button></header>
      <form onSubmit={addTask}><label className="sr-only" htmlFor="task-title">Nova tarefa</label><input id="task-title" value={title} onChange={event => setTitle(event.target.value)} placeholder="Adicionar tarefa" /><button type="submit" aria-label="Adicionar tarefa"><FaPlus /></button></form>
      {tasks.length > 0 && <ul>{tasks.map(task => <li key={task.id}><button type="button" className={task.done ? 'is-done' : ''} onClick={() => setTasks(previous => previous.map(item => item.id === task.id ? { ...item, done: !item.done } : item))}><FaCheck aria-hidden="true" /><span>{task.title}</span></button></li>)}</ul>}
    </section>}
    <button type="button" className="tasks-dock__trigger" onClick={() => { playClick(); setIsOpen(open => !open); }} aria-label="Abrir tarefas" aria-expanded={isOpen} title="Tarefas"><FaListCheck aria-hidden="true" /></button>
  </div>;
}
