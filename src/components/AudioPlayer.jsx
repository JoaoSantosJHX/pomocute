import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';
import { playClick } from './ClickSound';
const tracks = [
  { name: 'Lofi Chill Beats', url: 'https://stream.laut.fm/lofi' },
  { name: 'Jazz Vibes', url: 'https://stream.laut.fm/jazzradio' },
  { name: 'Anime Lofi', url: 'https://stream.laut.fm/animefm' },
];
export default function AudioPlayer({ volume }) {
  const [track, setTrack] = useState(tracks[0].url);
  const [state, setState] = useState('paused');
  const audioRef = useRef(null);
  const request = useRef(0);
  useEffect(() => () => { request.current += 1; }, []);
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
  return <section className="audio-player" aria-label="Música ambiente">
    <audio ref={audioRef} src={track} preload="none" onError={() => { request.current += 1; setState('error'); }}
      onPlay={event => { event.currentTarget.volume = volume / 100; }} />
    <Volume audioRef={audioRef} volume={volume} />
    <button onClick={toggle} className="audio-button" disabled={state === 'loading'}
      aria-label={state === 'playing' ? 'Pausar música' : 'Tocar música'}>
      {state === 'playing' ? <FaPause /> : <FaPlay />}
    </button>
    <p className="audio-info" role="status">{state === 'playing' ? 'Tocando' : state === 'loading' ? 'Carregando' : state === 'error' ? 'Música indisponível. Tente novamente ou escolha outra trilha.' : 'Música pausada'}</p>
    <div className="track-selector">
      <label htmlFor="trackSelect">Escolher trilha:</label>
      <select id="trackSelect" value={track} onChange={event => {
        request.current += 1; audioRef.current.pause(); setState('paused'); setTrack(event.target.value);
      }}>{tracks.map(item => <option key={item.url} value={item.url}>{item.name}</option>)}</select>
    </div>
  </section>;
}
function Volume({ audioRef, volume }) {
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [audioRef, volume]);
  return null;
}
