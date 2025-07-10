// App.jsx
import React from 'react';
import './App.css';
import Timer from './components/Timer';
import AudioPlayer from './components/AudioPlayer';

function App() {
  return (
    <div className="App">
      <h1>Pomocute</h1>
      <Timer />
      <AudioPlayer />
    </div>
  );
}

export default App;
