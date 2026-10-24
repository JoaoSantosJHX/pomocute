import React, { useState, useEffect, useRef } from 'react';
import AudioPlayer from './AudioPlayer';
import FloatingMiniTimer from './FloatingMiniTimer';
import { playClick } from './ClickSound';

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
  const [showFocusDetails, setShowFocusDetails] = useState(false);
  const [musicEnergy, setMusicEnergy] = useState(0);
  const [externalPlayback, setExternalPlayback] = useState(false);
  const alerted = useRef(false);
  const { mode, status, remaining, deadline, count } = session;
  const remainingMs = Math.max(0, status === 'running' ? deadline - now : remaining);
  const seconds = Math.ceil(remainingMs / 1000);
  const durationMs = modes[mode] * 1000;
  const progress = Math.min(1, Math.max(0, remainingMs / durationMs));
  const ringCircumference = 2 * Math.PI * 46;

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
  const nextMode = mode === 'pomodoro' ? (count % 4 === 0 ? 'long' : 'short') : 'pomodoro';
  const messages = { ready: 'Pronto para começar', running: mode === 'pomodoro' ? 'Hora de focar' : 'Hora de descansar',
    paused: 'Sessão pausada', completed: 'Sessão concluída!', ended: 'Sessão encerrada sem contabilizar' };
  const isFocusMode = status === 'running' || status === 'paused';

  useEffect(() => {
    if (!isFocusMode) setShowFocusDetails(false);
  }, [isFocusMode]);

  return <>
    <main
    className={`timer-card${isFocusMode ? ' timer-card--focus' : ''}${showFocusDetails ? ' timer-card--details-visible' : ''}${musicEnergy > .03 ? ' timer-card--music-reactive' : ''}${externalPlayback ? ' timer-card--embed-reactive' : ''}`}
    style={{ '--music-energy': musicEnergy }}
    onMouseEnter={() => { if (isFocusMode) setShowFocusDetails(true); }}
    onMouseLeave={() => setShowFocusDetails(false)}
    onFocusCapture={() => { if (isFocusMode) setShowFocusDetails(true); }}
    onBlurCapture={event => { if (!event.currentTarget.contains(event.relatedTarget)) setShowFocusDetails(false); }}
  >
    <div className="timer-progress-ring" role="progressbar" aria-label="Progresso do timer" aria-valuemin="0" aria-valuemax="100" aria-valuenow={Math.round(progress * 100)}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="timer-progress-ring__track" cx="50" cy="50" r="46" />
        <circle className="timer-progress-ring__value" cx="50" cy="50" r="46" strokeDasharray={ringCircumference} strokeDashoffset={ringCircumference * (1 - progress)} />
      </svg>
    </div>
    <div className="timer-expanded">
      <h1 className="app-title">Pomocute</h1>
      <div className="tabs" role="group" aria-label="Tipo de sessão">
        {Object.keys(modes).map(key => <button key={key} className={'tab-button ' + (mode === key ? 'active' : '')}
          aria-pressed={mode === key} disabled={status === 'running' || status === 'paused'}
          onClick={() => selectMode(key)}>{labels[key]}</button>)}
      </div>
    </div>
    <p className="session-status" role="status">{messages[status]}</p>
    <div className="timer-display" role="timer" aria-label="Tempo restante" aria-live="off">
      {String(Math.floor(seconds / 60)).padStart(2, '0')}:{String(seconds % 60).padStart(2, '0')}
    </div>
    <div className="button-group">
      <button onClick={toggle}>{status === 'running' ? 'Pausar' : status === 'paused' ? 'Retomar' : 'Começar'}</button>
      <button onClick={end} disabled={status !== 'running' && status !== 'paused'}>Encerrar</button>
    </div>
    {isFocusMode && <FloatingMiniTimer
      mode={mode}
      status={status}
      remainingMs={remainingMs}
      durationMs={durationMs}
      onToggle={toggle}
      onEnd={end}
    />}
    {status === 'completed' && <button className="tab-button" onClick={() => selectMode(nextMode)}>Preparar {labels[nextMode].toLowerCase()}</button>}
    <p className="timer-expanded">Sessões de foco concluídas: <strong>{count}</strong></p>
    </main>
    <AudioPlayer volume={volume} onVolumeChange={setVolume} onEnergyChange={setMusicEnergy} onExternalPlayback={setExternalPlayback} />
  </>;
}
