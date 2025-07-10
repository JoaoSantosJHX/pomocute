// src/components/Timer.jsx
import React, { useState, useEffect } from 'react';

const modes = {
  pomodoro: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const Timer = () => {
  const [mode, setMode] = useState('pomodoro');
  const [seconds, setSeconds] = useState(modes[mode]);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    setSeconds(modes[mode]);
    setIsActive(false);
  }, [mode]);

  useEffect(() => {
    let interval;
    if (isActive && seconds > 0) {
      interval = setInterval(() => {
        setSeconds((prev) => prev - 1);
      }, 1000);
    } else if (seconds === 0) {
      clearInterval(interval);
      // Aqui você pode adicionar som ou notificação quando o tempo acabar
    }
    return () => clearInterval(interval);
  }, [isActive, seconds]);

  const formatTime = (s) => {
    const minutes = Math.floor(s / 60);
    const secs = s % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setSeconds(modes[mode]);
    setIsActive(false);
  };

  return (
    <div className="timer-card">
      <div className="tabs">
        <button
          className={`tab-button ${mode === 'pomodoro' ? 'active' : ''}`}
          onClick={() => setMode('pomodoro')}
        >
          Pomodoro
        </button>
        <button
          className={`tab-button ${mode === 'short' ? 'active' : ''}`}
          onClick={() => setMode('short')}
        >
          Short Break
        </button>
        <button
          className={`tab-button ${mode === 'long' ? 'active' : ''}`}
          onClick={() => setMode('long')}
        >
          Long Break
        </button>
      </div>

      <div className="timer-display">{formatTime(seconds)}</div>

      <div className="button-group">
        <button onClick={toggleTimer}>{isActive ? 'Pausar' : 'Começar'}</button>
        <button onClick={resetTimer}>Resetar</button>
      </div>
    </div>
  );
};

export default Timer;
