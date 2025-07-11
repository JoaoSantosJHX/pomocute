import React, { useState } from 'react';
import Timer from './components/Timer';
import './App.css';

function App() {
  const [currentMode, setCurrentMode] = useState('pomodoro');

  const getBackgroundStyle = () => {
    switch (currentMode) {
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
    <div className="app-container" style={getBackgroundStyle()}>
      <Timer onModeChange={setCurrentMode} />
    </div>
  );
}

export default App;
