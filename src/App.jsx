import React, { useCallback, useEffect, useRef, useState } from 'react';
import Timer from './components/Timer';
import './App.css';

const scenes = {
  home: [
    '/videos/home/home_page1.mp4',
    '/videos/home/home_page2.mp4',
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
      preload="metadata"
      aria-hidden="true"
      onCanPlay={() => onReady?.(scene.id)}
      onError={() => onReady?.(scene.id)}
      onAnimationEnd={() => onFadeEnd?.(scene.id)}
    />
  );
}

function SeoContent() {
  return (
    <section className="seo-content" aria-labelledby="pomocute-focus-title">
      <div className="seo-content__inner">
        <p className="seo-content__eyebrow">FOCUS, GENTLY</p>
        <h2 id="pomocute-focus-title">A calm Pomodoro timer for focused work</h2>
        <p className="seo-content__lead">
          Pomocute gives you a simple place to start a focus session, take intentional breaks,
          keep a short task list, and choose a soundtrack that helps you stay with what matters.
        </p>

        <div className="seo-content__grid">
          <article>
            <h3>One session at a time</h3>
            <p>Start with a classic 25-minute focus block, then pause, reset, or choose the break that fits your rhythm.</p>
          </article>
          <article>
            <h3>Keep the next task visible</h3>
            <p>Add a small task before you begin so the timer supports one clear intention instead of another busy workspace.</p>
          </article>
          <article>
            <h3>Stay close to your timer</h3>
            <p>Use the floating mini timer when your browser supports it and keep your session in view while you work elsewhere.</p>
          </article>
        </div>

        <section className="seo-content__method" aria-labelledby="pomodoro-method-title">
          <h3 id="pomodoro-method-title">How the Pomodoro technique works</h3>
          <ol>
            <li>Choose one task for the next focus session.</li>
            <li>Work until the timer ends, traditionally for 25 minutes.</li>
            <li>Take a short break, then return for the next session.</li>
            <li>Use a longer break after several focus sessions.</li>
          </ol>
        </section>

        <section className="seo-content__faq" aria-labelledby="pomocute-faq-title">
          <h3 id="pomocute-faq-title">Frequently asked questions</h3>
          <details>
            <summary>Do I need an account to use Pomocute?</summary>
            <p>No. You can start a timer and keep local tasks without creating an account. An account is optional when you want to sync supported data across devices.</p>
          </details>
          <details>
            <summary>Can I adjust focus and break lengths?</summary>
            <p>Yes. Session lengths can be adjusted in settings when a timer is not running.</p>
          </details>
          <details>
            <summary>Does the timer keep time when I change tabs?</summary>
            <p>Pomocute uses the real elapsed time for an active session, so returning to the tab does not restart the countdown.</p>
          </details>
        </section>
      </div>
    </section>
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
      <SeoContent />
    </div>
  );
}

export default App;
