import React, { useCallback, useEffect, useRef, useState } from 'react';
import Timer from './components/Timer';
import './App.css';

const scenes = {
  home: [
    '/videos/home/home_page1.mp4',
    '/videos/home/home_page2.mp4',
    '/videos/home/home_page3.mp4',
  ],
  focus: [
    '/videos/estudo/estudo_3.mp4',
    '/videos/estudo/estudo_girl_studying.mp4',
    '/videos/estudo/estudo_natal.mp4',
  ],
  break: [
    '/videos/pausa/pausa.mp4',
    '/videos/pausa/pausa_2.mp4',
    '/videos/pausa/pausa_3.mp4',
  ],
};

const chooseScene = (group, previous) => {
  const options = scenes[group].filter(scene => scene !== previous);
  return options[Math.floor(Math.random() * options.length)] || previous;
};

const groupForSession = ({ mode, status }) => {
  if (status === 'ended') return 'home';
  if (mode === 'pomodoro') return status === 'ready' ? 'home' : 'focus';
  return 'break';
};

function BackgroundVideo({ scene, className }) {
  return (
    <video className={className} autoPlay loop muted playsInline preload="metadata" aria-hidden="true">
      <source src={scene} type="video/mp4" />
    </video>
  );
}

function App() {
  const [scene, setScene] = useState(() => chooseScene('home'));
  const [previousScene, setPreviousScene] = useState(null);
  const currentGroup = useRef('home');
  const lastSceneByGroup = useRef({ home: scene, focus: null, break: null });

  const changeScene = useCallback(group => {
    if (currentGroup.current === group) return;

    currentGroup.current = group;
    const nextScene = chooseScene(group, lastSceneByGroup.current[group]);
    lastSceneByGroup.current[group] = nextScene;
    setPreviousScene(scene);
    setScene(nextScene);
  }, [scene]);

  useEffect(() => {
    if (!previousScene) return undefined;
    const timer = window.setTimeout(() => setPreviousScene(null), 850);
    return () => window.clearTimeout(timer);
  }, [previousScene]);

  const handleSessionChange = useCallback(session => {
    changeScene(groupForSession(session));
  }, [changeScene]);

  return (
    <div className="app-container">
      {previousScene && <BackgroundVideo scene={previousScene} className="background-scene background-scene--previous" />}
      <BackgroundVideo scene={scene} className="background-scene background-scene--current" />
      <Timer onSessionChange={handleSessionChange} />
    </div>
  );
}

export default App;
