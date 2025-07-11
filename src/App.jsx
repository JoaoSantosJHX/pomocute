// src/App.jsx
import React from 'react';
import Timer from './components/Timer';
import './App.css'; // importar o CSS que contém os estilos

function App() {
  return (
    <div className="app-container">
      <h1 className="app-title">Pomocute 💕</h1>
      <Timer />
    </div>
  );
}

export default App;
