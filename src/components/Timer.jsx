import React, { useState, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import { playClick } from './ClickSound';

const modes = {
  pomodoro: 25 * 60,
  short: 5 * 60,
  long: 15 * 60,
};

const Timer = ({onModeChange}) => {
  const [mode, setMode] = useState('pomodoro');
  const [seconds, setSeconds] = useState(modes[mode]);
  const [isActive, setIsActive] = useState(false);
  const [volume, setVolume] = useState(50); 
  const [cycleCount, setCycleCount] = useState(0);

 useEffect(() => {
    if (onModeChange) {
      onModeChange(mode);
    }
  }, [mode]);

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

    const notificationSound = new Audio('/assets/alert.mp3');
    notificationSound.play();

    if (mode === 'pomodoro') {
      const nextCycle = cycleCount + 1;
      setCycleCount(nextCycle);

      if (nextCycle % 4 === 0) {
        setMode('long'); // A cada 4 ciclos, faz long break
      } else {
        setMode('short'); // Senão, short break
      }
    } else {
      setMode('pomodoro'); // Depois de qualquer break, volta pro pomodoro
    }

    setIsActive(false);
  }

  return () => clearInterval(interval);
}, [isActive, seconds, mode, cycleCount]);

  const formatTime = (s) => {
    const minutes = Math.floor(s / 60);
    const secs = s % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    playClick();
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    playClick();
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
          onClick={() => {
            playClick();
            setMode('pomodoro');}}
        >
          Pomodoro
        </button>
        <button
          className={`tab-button ${mode === 'short' ? 'active' : ''}`}
          onClick={() => {
            playClick();
            setMode('short');}}
        >
          Short Break
        </button>
        <button
          className={`tab-button ${mode === 'long' ? 'active' : ''}`}
          onClick={() => {
            playClick();
            setMode('long');}}
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