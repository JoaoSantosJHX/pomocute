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

function BackgroundVideo({ scene, className, onReady, onFadeEnd }) {
  return (
    <video
      className={className}
      src={scene.src}
      autoPlay
      loop
      muted
      playsInline
      preload="auto"
      aria-hidden="true"
      onCanPlay={() => onReady?.(scene.id)}
      onError={() => onReady?.(scene.id)}
      onAnimationEnd={() => onFadeEnd?.(scene.id)}
    />
  );
}

function App() {
  const [activeScene, setActiveScene] = useState(() => ({
    group: 'home',
    id: 0,
    src: chooseScene('home'),
  }));
  const [leavingScene, setLeavingScene] = useState(null);
  const [isActiveSceneReady, setIsActiveSceneReady] = useState(false);
  const activeSceneRef = useRef(activeScene);
  const nextSceneId = useRef(1);
  const lastSceneByGroup = useRef({ home: activeScene.src, focus: null, break: null });

  const transitionTo = useCallback((group, { force = false } = {}) => {
    if (!force && activeSceneRef.current.group === group) return;

    const nextScene = {
      group,
      id: nextSceneId.current++,
      src: chooseScene(group, lastSceneByGroup.current[group]),
    };

    lastSceneByGroup.current[group] = nextScene.src;
    setLeavingScene(activeSceneRef.current);
    setIsActiveSceneReady(false);
    activeSceneRef.current = nextScene;
    setActiveScene(nextScene);
  }, []);

  useEffect(() => {
    if (!leavingScene || !isActiveSceneReady) return undefined;
    const timer = window.setTimeout(() => {
      setLeavingScene(previous => previous?.id === leavingScene.id ? null : previous);
    }, 950);
    return () => window.clearTimeout(timer);
  }, [isActiveSceneReady, leavingScene]);

  const markSceneReady = useCallback(id => {
    if (activeSceneRef.current.id === id) setIsActiveSceneReady(true);
  }, []);

  const removeLeavingScene = useCallback(id => {
    setLeavingScene(previous => previous?.id === id ? null : previous);
  }, []);

  const handleSceneAction = useCallback(({ type, mode }) => {
    if (type === 'end') {
      transitionTo('home', { force: true });
      return;
    }

    const sceneGroup = mode === 'pomodoro' ? 'focus' : 'break';
    if (type === 'start') transitionTo(sceneGroup, { force: true });
    if (type === 'mode') transitionTo(mode === 'pomodoro' ? 'home' : 'break', { force: mode !== 'pomodoro' });
  }, [transitionTo]);

  return (
    <div className="app-container">
      {leavingScene && <BackgroundVideo
        key={`leaving-${leavingScene.id}`}
        scene={leavingScene}
        className={`background-scene background-scene--previous${isActiveSceneReady ? ' is-fading' : ''}`}
        onFadeEnd={removeLeavingScene}
      />}
      <BackgroundVideo
        key={`active-${activeScene.id}`}
        scene={activeScene}
        className={`background-scene background-scene--current${isActiveSceneReady ? ' is-ready' : ''}`}
        onReady={markSceneReady}
      />
      <Timer onSceneAction={handleSceneAction} />
    </div>
  );
}

export default App;
