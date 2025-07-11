import React, { useState, useEffect, useRef } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';

const tracks = [
  { name: 'Lofi Chill Beats', url: 'https://stream.laut.fm/lofi' },
  { name: 'Jazz Vibes', url: 'https://stream.laut.fm/jazzradio' },
  { name: 'Anime Lofi', url: 'https://stream.laut.fm/animefm' },
];

const AudioPlayer = ({ volume }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrack, setCurrentTrack] = useState(tracks[0]);
  const audioRef = useRef(null);

 // 1. Inicialização simples
useEffect(() => {
  audioRef.current = new Audio();
  return () => {
    audioRef.current.pause();
  };
}, []);

 // 2. Atualiza volume quando slider muda
 // eslint-disable-next-line react-hooks/exhaustive-deps
useEffect(() => {
  if (audioRef.current) {
    audioRef.current.volume = volume / 100;
  }
}, [volume]);

// 3. Troca de música
useEffect(() => {
  if (audioRef.current) {
    const wasPlaying = isPlaying;
    audioRef.current.pause();
    audioRef.current = new Audio(currentTrack.url);
    audioRef.current.loop = true;
    audioRef.current.volume = volume / 100;
    if (wasPlaying) {
      audioRef.current.play().catch((e) => console.log('Erro ao tocar:', e));
    }
  }
}, [currentTrack, isPlaying]); // não adicionar o volume aqui e manter o warning 

  const handlePlay = async () => {
    try {
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (err) {
      console.log('Reprodução bloqueada:', err);
      audioRef.current.muted = true;
      await audioRef.current.play();
      audioRef.current.muted = false;
      setIsPlaying(true);
    }
  };

  const handlePause = () => {
    audioRef.current.pause();
    setIsPlaying(false);
  };

  const toggleAudio = () => {
    isPlaying ? handlePause() : handlePlay();
  };

  return (
    <div className="audio-player">
      <div className="audio-controls">
        <button 
          onClick={toggleAudio}
          className="audio-button"
          aria-label={isPlaying ? "Pausar" : "Tocar"}
        >
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>
      </div>

      <p className="audio-info">🎵 Tocando: {currentTrack.name}</p>

      <div className="track-selector">
        <label htmlFor="trackSelect">Escolher trilha:</label>
        <select
          id="trackSelect"
          value={currentTrack.url}
          onChange={(e) => {
            const selected = tracks.find(t => t.url === e.target.value);
            setCurrentTrack(selected);
          }}
        >
          {tracks.map((track) => (
            <option key={track.url} value={track.url}>
              {track.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default AudioPlayer;
