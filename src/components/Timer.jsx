import React, { useState, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';

const modes = {
  pomodoro: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const Timer = ({onModeChange}) => {
  const [mode, setMode] = useState('pomodoro');
  const [seconds, setSeconds] = useState(modes[mode]);
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(50); // Movido para dentro do componente

 useEffect(() => {
    if (onModeChange) {
      onModeChange(mode);
    }
  }, [mode]);

 useEffect(() => {
  let interval;
  if (isActive && seconds > 0) {
    interval = setInterval(() => {
      setSeconds((prev) => prev - 1);
    }, 1000);
  } else if (seconds === 0) {
    clearInterval(interval);
    const notificationSound = new Audio('/assets/alert.mp3');
    notificationSound.play();
    alert('Tempo encerrado! ✨ Faça uma pausa.');
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

  const getBackgroundStyle = () => {
  switch (mode) {
    case 'pomodoro':
      return { backgroundImage: "url('/images/pomo.jpg')" };
    case 'short':
      return { backgroundImage: "url('/images/short.jpg')" };
    case 'long':
      return { backgroundImage: "url('/images/long.jpg')" };
    default:
      return {};
  }
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
      
      <AudioPlayer volume={volume} />
      
      <div className="volume-control">
        <label>Volume:</label>
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={(e) => setVolume(e.target.value)}
          className="volume-slider"
        />
      </div>
    </div>
  );
};

export default Timer;