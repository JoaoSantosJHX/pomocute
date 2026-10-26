import React, { useState, useEffect, useRef } from 'react';
import AudioPlayer from './AudioPlayer';
import FloatingMiniTimer from './FloatingMiniTimer';
import TasksButton from './TasksButton';
import { playClick } from './ClickSound';
import { FaPause, FaPlay, FaStop } from 'react-icons/fa';
import AccountControls from './AccountControls';
import { recordFocusSession } from '../services/data';

const modes = { pomodoro: 1500, short: 300, long: 900 };
const labels = { pomodoro: 'Pomodoro', short: 'Pausa curta', long: 'Pausa longa' };
const storageKey = 'pomocute-session-v1';
const initial = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && Object.hasOwn(modes, saved.mode) &&
        ['ready', 'running', 'paused', 'completed', 'ended'].includes(saved.status) &&
        Number.isFinite(saved.remaining) && saved.remaining >= 0 && saved.remaining <= modes[saved.mode] * 1000 &&
        Number.isSafeInteger(saved.count) && saved.count >= 0 &&
        (saved.status !== 'running' || (Number.isFinite(saved.deadline) && saved.deadline > 0))) return saved;
  } catch (_) { /* Storage can be unavailable. */ }
  return { mode: 'pomodoro', status: 'ready', remaining: modes.pomodoro * 1000, deadline: null, count: 0 };
};

export default function Timer({ onSceneAction }) {
  const [session, setSession] = useState(initial);
  const [now, setNow] = useState(Date.now);
  const [volume, setVolume] = useState(50);
  const [musicEnergy, setMusicEnergy] = useState(0);
  const [externalPlayback, setExternalPlayback] = useState(false);
  const alerted = useRef(false);
  const { mode, status, remaining, deadline } = session;
  const remainingMs = Math.max(0, status === 'running' ? deadline - now : remaining);
  const seconds = Math.ceil(remainingMs / 1000);
  const durationMs = modes[mode] * 1000;
  const progress = Math.min(1, Math.max(0, remainingMs / durationMs));
  const ringCircumference = 2 * Math.PI * 48.5;

  useEffect(() => {
    try { localStorage.setItem(storageKey, JSON.stringify(session)); } catch (_) {}
  }, [session]);
  useEffect(() => {
    if (status !== 'running') return;
    const sync = () => {
      const time = Date.now();
      setNow(time);
      setSession(previous => previous.status === 'running' && previous.deadline <= time
        ? { ...previous, status: 'completed', remaining: 0, deadline: null,
            count: previous.count + (previous.mode === 'pomodoro' ? 1 : 0) }
        : previous);
    };
    sync();
    const interval = setInterval(sync, 250);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [status]);
  useEffect(() => {
    if (status !== 'completed') { alerted.current = false; return; }
    if (!alerted.current) {
      alerted.current = true;
      recordFocusSession(mode, modes[mode]).catch(() => {});
      new Audio('/assets/alert.mp3').play()?.catch(() => {});
    }
  }, [status]);

  const selectMode = next => {
    playClick();
    onSceneAction?.({ type: 'mode', mode: next });
    setSession(previous => ({ ...previous, mode: next, status: 'ready', remaining: modes[next] * 1000, deadline: null }));
  };
  const toggle = () => {
    playClick();
    const time = Date.now();
    setNow(time);
    if (status !== 'running' && status !== 'paused') onSceneAction?.({ type: 'start', mode });
    setSession(previous => {
      if (previous.status === 'running') {
        const left = Math.max(0, previous.deadline - time);
        return { ...previous, status: left ? 'paused' : 'completed', remaining: left, deadline: null,
          count: previous.count + (!left && previous.mode === 'pomodoro' ? 1 : 0) };
      }
      const left = previous.status === 'paused' ? previous.remaining : modes[previous.mode] * 1000;
      return { ...previous, status: 'running', remaining: left, deadline: time + left };
    });
  };
  const reset = () => {
    playClick();
    const time = Date.now();
    setNow(time);
    setSession(previous => ({
      ...previous,
      status: 'ready',
      remaining: modes[previous.mode] * 1000,
      deadline: null,
    }));
  };
  const end = () => {
    playClick();
    const time = Date.now();
    onSceneAction?.({ type: 'end', mode });
    setSession(previous => {
      const completed = previous.status === 'running' && previous.deadline <= time;
      return { ...previous, status: completed ? 'completed' : 'ended',
        remaining: completed ? 0 : modes[previous.mode] * 1000, deadline: null,
        count: previous.count + (completed && previous.mode === 'pomodoro' ? 1 : 0) };
    });
  };
  const messages = { ready: 'Pronto para começar', running: mode === 'pomodoro' ? 'Hora de focar' : 'Hora de descansar',
    paused: 'Sessão pausada', completed: 'Sessão concluída!', ended: 'Sessão encerrada sem contabilizar' };
  const isFocusMode = status === 'running' || status === 'paused';

  return <>
    <header className="app-header">
      <h1>Pomocute</h1>
      <AccountControls />
    </header>
    <nav className="session-mode-selector" aria-label="Tipo de sessão">
      {Object.keys(modes).map(key => <button key={key} className={mode === key ? 'active' : ''}
        aria-pressed={mode === key} disabled={status === 'running'}
        onClick={() => selectMode(key)}>{labels[key]}</button>)}
    </nav>
    <main
    className={`timer-card${isFocusMode ? ' timer-card--focus' : ''}${musicEnergy > .03 ? ' timer-card--music-reactive' : ''}${externalPlayback ? ' timer-card--embed-reactive' : ''}`}
    style={{ '--music-energy': musicEnergy }}
  >
    <div className="timer-progress-ring" role="progressbar" aria-label="Progresso do timer" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <defs>
          <linearGradient id="timer-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#f6daf0" />
            <stop offset="48%" stopColor="#e78dc4" />
            <stop offset="100%" stopColor="#9e8aff" />
          </linearGradient>
        </defs>
        <circle className="timer-progress-ring__track" cx="50" cy="50" r="48.5" />
        <circle className="timer-progress-ring__value" cx="50" cy="50" r="48.5" strokeDasharray={ringCircumference} strokeDashoffset={ringCircumference * (1 - progress)} />
      </svg>
    </div>
    <p className="session-status" role="status">{messages[status]}</p>
    <div className="timer-display" role="timer" aria-label="Tempo restante" aria-live="off">
      {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
    </div>
    <div className="timer-actions">
      <button
        type="button"
        className="timer-toggle"
        onClick={toggle}
        aria-label={status === 'running' ? 'Pausar' : status === 'paused' ? 'Retomar' : 'Começar'}
        title={status === 'running' ? 'Pausar' : status === 'paused' ? 'Retomar' : 'Começar'}
      >
        {status === 'running' ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />}
      </button>
      <button
        type="button"
        className="timer-toggle timer-reset"
        onClick={reset}
        aria-label={`Reiniciar ${labels[mode]}`}
        title={`Reiniciar ${labels[mode]}`}
      >
        <FaStop aria-hidden="true" />
      </button>
    </div>
    {status === 'completed' && <p className="timer-next-mode">Escolha uma pausa acima para continuar.</p>}
    </main>
    <FloatingMiniTimer
      mode={mode}
      status={status}
      remainingMs={remainingMs}
      durationMs={durationMs}
      onToggle={toggle}
      onEnd={end}
    />
    <TasksButton />
    <AudioPlayer volume={volume} onVolumeChange={setVolume} onEnergyChange={setMusicEnergy} onExternalPlayback={setExternalPlayback} />
  </>;
}
