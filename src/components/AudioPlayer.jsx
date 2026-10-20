import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaStepBackward, FaStepForward } from 'react-icons/fa';
import { playClick } from './ClickSound';
const tracks = [
  { name: 'Lofi Chill Beats', url: 'https://stream.laut.fm/lofi' },
  { name: 'Jazz Vibes', url: 'https://stream.laut.fm/jazzradio' },
  { name: 'Anime Lofi', url: 'https://stream.laut.fm/animefm' },
];
export default function AudioPlayer({ volume }) {
  const [trackIndex, setTrackIndex] = useState(0);
  const [state, setState] = useState('paused');
  const audioRef = useRef(null);
  const request = useRef(0);
  const shouldResume = useRef(false);
  const track = tracks[trackIndex];

  useEffect(() => () => { request.current += 1; }, []);

  useEffect(() => {
    if (!shouldResume.current) return;
    shouldResume.current = false;
    const audio = audioRef.current;
    const id = ++request.current;
    setState('loading');
    audio.play().then(() => {
      if (request.current === id) setState('playing');
    }).catch(() => {
      if (request.current === id) setState('error');
    });
  }, [trackIndex]);

  const toggle = async () => {
    playClick();
    const audio = audioRef.current;
    const id = ++request.current;
    if (state === 'playing') { audio.pause(); setState('paused'); return; }
    setState('loading');
    try {
      await audio.play();
      if (request.current === id) setState('playing');
    } catch (_) {
      if (request.current === id) setState('error');
    }
  };

  const changeTrack = direction => {
    playClick();
    const wasPlaying = state === 'playing';
    request.current += 1;
    audioRef.current.pause();
    shouldResume.current = wasPlaying;
    setState(wasPlaying ? 'loading' : 'paused');
    setTrackIndex(current => (current + direction + tracks.length) % tracks.length);
  };

  const selectTrack = url => {
    const index = tracks.findIndex(item => item.url === url);
    if (index === trackIndex) return;
    const direction = index > trackIndex ? 1 : -1;
    changeTrack(direction);
    setTrackIndex(index);
  };

  return <section className="audio-player" aria-label="Música ambiente">
    <audio ref={audioRef} src={track.url} preload="none" onError={() => { request.current += 1; setState('error'); }}
      onPlay={event => { event.currentTarget.volume = volume / 100; }} />
    <Volume audioRef={audioRef} volume={volume} />
    <div className="audio-controls">
      <button onClick={() => changeTrack(-1)} className="audio-skip-button" aria-label="Faixa anterior" title="Faixa anterior">
        <FaStepBackward />
      </button>
      <button onClick={toggle} className="audio-button" disabled={state === 'loading'}
        aria-label={state === 'playing' ? 'Pausar música' : 'Tocar música'}>
        {state === 'playing' ? <FaPause /> : <FaPlay />}
      </button>
      <button onClick={() => changeTrack(1)} className="audio-skip-button" aria-label="Próxima faixa" title="Próxima faixa">
        <FaStepForward />
      </button>
    </div>
    <div className="audio-details">
      <p className="audio-info" role="status">{state === 'playing' ? 'Tocando' : state === 'loading' ? 'Carregando' : state === 'error' ? 'Música indisponível. Tente novamente ou escolha outra trilha.' : 'Música pausada'}</p>
      <div className="track-selector">
        <label htmlFor="trackSelect">Escolher trilha:</label>
        <select id="trackSelect" value={track.url} onChange={event => selectTrack(event.target.value)}>
          {tracks.map(item => <option key={item.url} value={item.url}>{item.name}</option>)}
        </select>
      </div>
    </div>
  </section>;
}
function Volume({ audioRef, volume }) {
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [audioRef, volume]);
  return null;
}
