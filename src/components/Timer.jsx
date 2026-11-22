import React, { useEffect, useRef, useState } from 'react';
import { FaPause, FaPlay, FaStop } from 'react-icons/fa';
import AudioPlayer from './AudioPlayer';
import FloatingMiniTimer from './FloatingMiniTimer';
import TasksButton from './TasksButton';
import { playClick } from './ClickSound';
import AccountControls from './AccountControls';
import { playAlarm } from './AlarmSound';
import { I18nProvider, useI18n } from '../i18n';
import { createSyncId, recordFocusSession } from '../services/data';
import { getStoredUser } from '../services/auth';

const storageKey = 'pomocute-session-v1';
const preferencesKey = 'pomocute-preferences-v1';
const modeKeys = ['pomodoro', 'short', 'long'];

const defaultPreferences = {
  language: 'en',
  durations: { pomodoro: 25, short: 5, long: 15 },
  alarm: { enabled: true, type: 'chime', volume: 65 },
};

const durationLimits = {
  pomodoro: { min: 1, max: 120 },
  short: { min: 1, max: 60 },
  long: { min: 1, max: 60 },
};

function clamp(value, min, max, fallback) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.round(numeric)));
}

function loadPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(preferencesKey));
    const durations = stored?.durations || {};
    const alarm = stored?.alarm || {};
    const allowedLanguages = ['en', 'pt-BR', 'es', 'fr', 'de'];
    const allowedSounds = ['chime', 'bell', 'digital'];

    return {
      language: allowedLanguages.includes(stored?.language) ? stored.language : defaultPreferences.language,
      durations: Object.fromEntries(modeKeys.map(mode => [
        mode,
        clamp(durations[mode], durationLimits[mode].min, durationLimits[mode].max, defaultPreferences.durations[mode]),
      ])),
      alarm: {
        enabled: alarm.enabled !== false,
        type: allowedSounds.includes(alarm.type) ? alarm.type : defaultPreferences.alarm.type,
        volume: clamp(alarm.volume, 0, 100, defaultPreferences.alarm.volume),
      },
    };
  } catch (_) {
    return defaultPreferences;
  }
}

function durationSeconds(preferences, mode) {
  return preferences.durations[mode] * 60;
}

function loadSession(preferences) {
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    const maxRemaining = durationSeconds(preferences, saved?.mode) * 1000;
    if (
      saved
      && modeKeys.includes(saved.mode)
      && ['ready', 'running', 'paused', 'completed', 'ended'].includes(saved.status)
      && Number.isFinite(saved.remaining)
      && saved.remaining >= 0
      && saved.remaining <= maxRemaining
      && Number.isSafeInteger(saved.count)
      && saved.count >= 0
      && (saved.status !== 'running' || (Number.isFinite(saved.deadline) && saved.deadline > 0))
    ) {
      const hasValidSyncId = typeof saved.syncId === 'string'
        && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved.syncId);
      const hasValidUserId = typeof saved.userId === 'string'
        && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(saved.userId);
      const needsSyncId = saved.status === 'running' || saved.status === 'paused';
      return {
        ...saved,
        syncId: hasValidSyncId ? saved.syncId : (needsSyncId ? createSyncId() : null),
        userId: hasValidUserId ? saved.userId : null,
      };
    }
  } catch (_) {
    // O timer recomeça com segurança quando não há uma sessão legível no navegador.
  }
  return {
    mode: 'pomodoro',
    status: 'ready',
    remaining: durationSeconds(preferences, 'pomodoro') * 1000,
    deadline: null,
    count: 0,
    syncId: null,
    userId: null,
  };
}

function formatTime(milliseconds) {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  return String(Math.floor(seconds / 60)).padStart(2, '0') + ':' + String(seconds % 60).padStart(2, '0');
}

export default function Timer({ onSceneAction }) {
  const [preferences, setPreferences] = useState(loadPreferences);
  const [session, setSession] = useState(() => loadSession(loadPreferences()));
  const [now, setNow] = useState(Date.now);
  const [musicVolume, setMusicVolume] = useState(50);
  const [musicEnergy, setMusicEnergy] = useState(0);
  const [externalPlayback, setExternalPlayback] = useState(false);
  const alerted = useRef(false);

  const { mode, status, remaining, deadline } = session;
  const remainingMs = Math.max(0, status === 'running' ? deadline - now : remaining);
  const durationMs = durationSeconds(preferences, mode) * 1000;
  const progress = Math.min(1, Math.max(0, remainingMs / durationMs));
  const ringCircumference = 2 * Math.PI * 48.5;
  const isSessionLocked = status === 'running';

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(session));
    } catch (_) {
      // Persistência local é opcional; o timer segue em funcionamento sem ela.
    }
  }, [session]);

  useEffect(() => {
    try {
      localStorage.setItem(preferencesKey, JSON.stringify(preferences));
    } catch (_) {
      // Preferências ficam apenas nesta sessão caso o navegador bloqueie storage.
    }
  }, [preferences]);

  useEffect(() => {
    if (status !== 'running') return undefined;

    const sync = () => {
      const time = Date.now();
      setNow(time);
      setSession(previous => (
        previous.status === 'running' && previous.deadline <= time
          ? {
            ...previous,
            status: 'completed',
            remaining: 0,
            deadline: null,
            count: previous.count + (previous.mode === 'pomodoro' ? 1 : 0),
          }
          : previous
      ));
    };

    sync();
    const interval = window.setInterval(sync, 250);
    window.addEventListener('focus', sync);
    document.addEventListener('visibilitychange', sync);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', sync);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [status]);

  useEffect(() => {
    if (status !== 'completed') {
      alerted.current = false;
      return;
    }

    if (alerted.current) return;
    alerted.current = true;
    if (session.syncId) {
      recordFocusSession(mode, durationSeconds(preferences, mode), session.syncId, session.userId).catch(() => {});
    }
    if (preferences.alarm.enabled) {
      playAlarm(preferences.alarm.type, preferences.alarm.volume);
    }
  }, [mode, preferences, session.syncId, session.userId, status]);

  const selectMode = nextMode => {
    playClick();
    onSceneAction?.({ type: 'mode', mode: nextMode });
    setSession(previous => ({
      ...previous,
      mode: nextMode,
      status: 'ready',
      remaining: durationSeconds(preferences, nextMode) * 1000,
      deadline: null,
      syncId: null,
      userId: null,
    }));
  };

  const toggle = () => {
    playClick();
    const time = Date.now();
    setNow(time);
    if (status !== 'running' && status !== 'paused') {
      onSceneAction?.({ type: 'start', mode });
    }

    setSession(previous => {
      if (previous.status === 'running') {
        const left = Math.max(0, previous.deadline - time);
        return {
          ...previous,
          status: left ? 'paused' : 'completed',
          remaining: left,
          deadline: null,
          count: previous.count + (!left && previous.mode === 'pomodoro' ? 1 : 0),
        };
      }

      const left = previous.status === 'paused'
        ? previous.remaining
        : durationSeconds(preferences, previous.mode) * 1000;
      const syncId = previous.status === 'paused' && previous.syncId ? previous.syncId : createSyncId();
      const userId = previous.status === 'paused' ? previous.userId : getStoredUser()?.id || null;
      return { ...previous, syncId, userId, status: 'running', remaining: left, deadline: time + left };
    });
  };

  const reset = () => {
    playClick();
    setNow(Date.now());
    setSession(previous => ({
      ...previous,
      status: 'ready',
      remaining: durationSeconds(preferences, previous.mode) * 1000,
      deadline: null,
      syncId: null,
      userId: null,
    }));
  };

  const end = () => {
    playClick();
    const time = Date.now();
    onSceneAction?.({ type: 'end', mode });
    setSession(previous => {
      const completed = previous.status === 'running' && previous.deadline <= time;
      return {
        ...previous,
        status: completed ? 'completed' : 'ended',
        remaining: completed ? 0 : durationSeconds(preferences, previous.mode) * 1000,
        deadline: null,
        count: previous.count + (completed && previous.mode === 'pomodoro' ? 1 : 0),
      };
    });
  };

  const changeDuration = (targetMode, delta) => {
    if (isSessionLocked) return;
    const limits = durationLimits[targetMode];
    const nextMinutes = clamp(
      preferences.durations[targetMode] + delta,
      limits.min,
      limits.max,
      preferences.durations[targetMode],
    );
    if (nextMinutes === preferences.durations[targetMode]) return;

    setPreferences(previous => ({
      ...previous,
      durations: { ...previous.durations, [targetMode]: nextMinutes },
    }));
    setSession(previous => (
      previous.mode === targetMode
        ? {
          ...previous,
          status: 'ready',
          remaining: nextMinutes * 60 * 1000,
          deadline: null,
          syncId: null,
          userId: null,
        }
        : previous
    ));
  };

  const changeLanguage = language => {
    setPreferences(previous => ({ ...previous, language }));
  };

  const updateAlarm = patch => {
    setPreferences(previous => ({
      ...previous,
      alarm: { ...previous.alarm, ...patch },
    }));
  };

  return (
    <I18nProvider language={preferences.language}>
      <TimerView
        session={session}
        remainingMs={remainingMs}
        durationMs={durationMs}
        progress={progress}
        ringCircumference={ringCircumference}
        preferences={preferences}
        musicVolume={musicVolume}
        musicEnergy={musicEnergy}
        externalPlayback={externalPlayback}
        isSessionLocked={isSessionLocked}
        onSelectMode={selectMode}
        onToggle={toggle}
        onReset={reset}
        onEnd={end}
        onDurationChange={changeDuration}
        onLanguageChange={changeLanguage}
        onAlarmEnabledChange={enabled => updateAlarm({ enabled })}
        onAlarmSoundChange={type => updateAlarm({ type })}
        onAlarmVolumeChange={volume => updateAlarm({ volume })}
        onTestAlarm={() => playAlarm(preferences.alarm.type, preferences.alarm.volume)}
        onMusicVolumeChange={setMusicVolume}
        onMusicEnergyChange={setMusicEnergy}
        onExternalPlaybackChange={setExternalPlayback}
      />
    </I18nProvider>
  );
}

function TimerView({
  session,
  remainingMs,
  durationMs,
  progress,
  ringCircumference,
  preferences,
  musicVolume,
  musicEnergy,
  externalPlayback,
  isSessionLocked,
  onSelectMode,
  onToggle,
  onReset,
  onEnd,
  onDurationChange,
  onLanguageChange,
  onAlarmEnabledChange,
  onAlarmSoundChange,
  onAlarmVolumeChange,
  onTestAlarm,
  onMusicVolumeChange,
  onMusicEnergyChange,
  onExternalPlaybackChange,
}) {
  const { t } = useI18n();
  const { mode, status } = session;
  const labels = {
    pomodoro: t('mode.pomodoro'),
    short: t('mode.short'),
    long: t('mode.long'),
  };
  const isBreak = mode !== 'pomodoro';
  const statusLabel = status === 'ended' ? 'ready' : status;
  const statusMessage = isBreak && (status === 'running' || status === 'paused')
    ? ''
    : t(`status.${statusLabel}${isBreak ? 'Break' : ''}`);
  const isFocusMode = status === 'running' || status === 'paused';
  const timerActionLabel = status === 'running' ? t('timer.pause') : status === 'paused' ? t('timer.resume') : t('timer.start');

  return <section className="timer-experience" aria-label="Pomodoro timer">
    <header className="app-header">
      <div><h1>Pomocute</h1><p className="app-header__tagline">Pomodoro timer for focus</p></div>
      <AccountControls
        preferences={preferences}
        isSessionLocked={isSessionLocked}
        onDurationChange={onDurationChange}
        onLanguageChange={onLanguageChange}
        onAlarmEnabledChange={onAlarmEnabledChange}
        onAlarmSoundChange={onAlarmSoundChange}
        onAlarmVolumeChange={onAlarmVolumeChange}
        onTestAlarm={onTestAlarm}
      />
    </header>

    <nav className="session-mode-selector" aria-label={t('session.type')}>
      {modeKeys.map(key => <button
        key={key}
        className={mode === key ? 'active' : ''}
        aria-pressed={mode === key}
        disabled={isSessionLocked}
        onClick={() => onSelectMode(key)}
      >{labels[key]}</button>)}
    </nav>

    <main
      className={'timer-card' + (isFocusMode ? ' timer-card--focus' : '') + (musicEnergy > 0.03 ? ' timer-card--music-reactive' : '') + (externalPlayback ? ' timer-card--embed-reactive' : '')}
      style={{ '--music-energy': musicEnergy }}
    >
      <div
        className="timer-progress-ring"
        role="progressbar"
        aria-label={t('timer.progress')}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={Math.round(progress * 100)}
      >
        <svg viewBox="0 0 100 100" aria-hidden="true">
          <defs>
            <linearGradient id="timer-ring-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ef8bc9" />
              <stop offset="25%" stopColor="#f8b7e0" />
              <stop offset="38%" stopColor="#fff4fb" />
              <stop offset="43%" stopColor="#ffe0f3" />
              <stop offset="59%" stopColor="#e890ce" />
              <stop offset="79%" stopColor="#d39aee" />
              <stop offset="100%" stopColor="#b197ff" />
            </linearGradient>
          </defs>
          <circle className="timer-progress-ring__track" cx="50" cy="50" r="48.5" />
          <circle
            className={status === 'running' ? 'timer-progress-ring__value timer-progress-ring__value--running' : 'timer-progress-ring__value'}
            cx="50"
            cy="50"
            r="48.5"
            strokeDasharray={ringCircumference}
            strokeDashoffset={ringCircumference * (1 - progress)}
          />
        </svg>
      </div>
      <div className="timer-display" role="timer" aria-label={t('timer.remaining')} aria-live="off">
        {formatTime(remainingMs)}
      </div>
      <div className="timer-actions">
        <button
          type="button"
          className="timer-toggle"
          onClick={onToggle}
          aria-label={timerActionLabel}
          title={timerActionLabel}
        >
          {status === 'running' ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />}
        </button>
        <button
          type="button"
          className="timer-toggle timer-reset"
          onClick={onReset}
          aria-label={t('timer.reset', { mode: labels[mode] })}
          title={t('timer.reset', { mode: labels[mode] })}
        >
          <FaStop aria-hidden="true" />
        </button>
      </div>
    </main>
    <p className="timer-status" role="status">{statusMessage}</p>

    <FloatingMiniTimer
      mode={mode}
      status={status}
      remainingMs={remainingMs}
      durationMs={durationMs}
      onToggle={onToggle}
      onEnd={onEnd}
    />
    <TasksButton />
    <AudioPlayer
      volume={musicVolume}
      onVolumeChange={onMusicVolumeChange}
      onEnergyChange={onMusicEnergyChange}
      onExternalPlayback={onExternalPlaybackChange}
    />
  </section>;
}
