import React, { useEffect, useRef, useState } from 'react';
import { FaMusic, FaPause, FaPlay, FaPlus, FaSpotify, FaStepBackward, FaStepForward, FaTimes, FaTrash, FaVolumeUp, FaYoutube } from 'react-icons/fa';
import { playClick } from './ClickSound';

const tracks = [
  { name: 'Lofi Chill Beats', url: 'https://stream.laut.fm/lofi' },
  { name: 'Jazz Vibes', url: 'https://stream.laut.fm/jazzradio' },
  { name: 'Anime Lofi', url: 'https://stream.laut.fm/animefm' },
];
const linksStorageKey = 'pomocute-music-links-v1';

function loadLinks() {
  try {
    const links = JSON.parse(localStorage.getItem(linksStorageKey));
    return Array.isArray(links) ? links.filter(link => link && link.url && link.embedUrl) : [];
  } catch (_) { return []; }
}

function parseEmbedLink(rawUrl) {
  let url;
  try { url = new URL(rawUrl.trim()); } catch (_) { return null; }
  const host = url.hostname.replace(/^www\./, '').toLowerCase();
  if (host === 'youtu.be' || host.endsWith('youtube.com')) {
    const videoId = host === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : url.searchParams.get('v') || url.pathname.match(/\/(embed|shorts|live)\/([^/?]+)/)?.[2];
    if (!videoId) return null;
    return { id: `youtube-${videoId}`, platform: 'youtube', title: 'Vídeo do YouTube', url: url.toString(), embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0` };
  }
  if (host === 'open.spotify.com') {
    const [kind, id] = url.pathname.split('/').filter(Boolean);
    if (!['track', 'album', 'playlist', 'episode', 'show'].includes(kind) || !id) return null;
    return { id: `spotify-${kind}-${id}`, platform: 'spotify', title: `Spotify: ${kind === 'track' ? 'faixa' : kind === 'playlist' ? 'playlist' : kind}`, url: url.toString(), embedUrl: `https://open.spotify.com/embed/${kind}/${id}` };
  }
  return null;
}

export default function AudioPlayer({ volume, onVolumeChange, onEnergyChange, onExternalPlayback }) {
  const [trackIndex, setTrackIndex] = useState(0);
  const [state, setState] = useState('paused');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState('');
  const [customLinks, setCustomLinks] = useState(loadLinks);
  const [activeEmbed, setActiveEmbed] = useState(null);
  const audioRef = useRef(null);
  const request = useRef(0);
  const shouldResume = useRef(false);
  const analyser = useRef(null);
  const animationFrame = useRef(null);
  const lastEnergyUpdate = useRef(0);
  const track = tracks[trackIndex];

  useEffect(() => () => {
    request.current += 1;
    if (animationFrame.current) window.cancelAnimationFrame(animationFrame.current);
  }, []);
  useEffect(() => { try { localStorage.setItem(linksStorageKey, JSON.stringify(customLinks)); } catch (_) {} }, [customLinks]);
  useEffect(() => { onExternalPlayback?.(Boolean(activeEmbed)); }, [activeEmbed, onExternalPlayback]);
  useEffect(() => {
    if (!shouldResume.current) return;
    shouldResume.current = false;
    const audio = audioRef.current;
    const id = ++request.current;
    setState('loading');
    audio.play().then(() => { if (request.current === id) setState('playing'); }).catch(() => { if (request.current === id) setState('error'); });
  }, [trackIndex]);

  const toggle = async () => {
    playClick();
    const audio = audioRef.current;
    const id = ++request.current;
    if (state === 'playing') { audio.pause(); onEnergyChange?.(0); setState('paused'); return; }
    setState('loading');
    try { await audio.play(); if (request.current === id) setState('playing'); } catch (_) { if (request.current === id) setState('error'); }
  };
  const startVisualizer = () => {
    if (!onEnergyChange || analyser.current || !audioRef.current || !window.AudioContext) return;
    try {
      const context = new window.AudioContext();
      const source = context.createMediaElementSource(audioRef.current);
      const nextAnalyser = context.createAnalyser();
      nextAnalyser.fftSize = 64;
      source.connect(nextAnalyser);
      nextAnalyser.connect(context.destination);
      analyser.current = nextAnalyser;
      const samples = new Uint8Array(nextAnalyser.frequencyBinCount);
      const readEnergy = timestamp => {
        nextAnalyser.getByteFrequencyData(samples);
        const lowFrequencies = samples.slice(1, 9);
        const average = lowFrequencies.reduce((total, value) => total + value, 0) / lowFrequencies.length;
        if (timestamp - lastEnergyUpdate.current > 90) {
          lastEnergyUpdate.current = timestamp;
          onEnergyChange(Math.min(.85, Math.max(0, (average - 20) / 180)));
        }
        animationFrame.current = window.requestAnimationFrame(readEnergy);
      };
      context.resume()?.catch(() => {});
      animationFrame.current = window.requestAnimationFrame(readEnergy);
    } catch (_) {
      onEnergyChange(0);
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
  const chooseTrack = index => {
    if (index !== trackIndex) {
      const wasPlaying = state === 'playing';
      request.current += 1;
      audioRef.current.pause();
      shouldResume.current = wasPlaying;
      setState(wasPlaying ? 'loading' : 'paused');
      setTrackIndex(index);
    }
    setIsMenuOpen(false);
  };
  const addLink = event => {
    event.preventDefault();
    const link = parseEmbedLink(linkInput);
    if (!link) { setLinkError('Use um link válido do YouTube ou Spotify.'); return; }
    setCustomLinks(previous => previous.some(item => item.id === link.id) ? previous : [...previous, link]);
    setLinkInput('');
    setLinkError('');
    setActiveEmbed(link);
    setIsMenuOpen(false);
  };
  const removeLink = id => {
    setCustomLinks(previous => previous.filter(link => link.id !== id));
    setActiveEmbed(previous => previous?.id === id ? null : previous);
  };

  return <>
    <audio ref={audioRef} src={track.url} preload="none" onError={() => { request.current += 1; onEnergyChange?.(0); setState('error'); }} onPlay={event => { event.currentTarget.volume = volume / 100; startVisualizer(); }} />
    <Volume audioRef={audioRef} volume={volume} />
    {activeEmbed && <aside className="embedded-player-window" aria-label={`Player ${activeEmbed.platform}`}>
      <button type="button" className="embedded-player-close" onClick={() => setActiveEmbed(null)} aria-label="Fechar player externo"><FaTimes /></button>
      <iframe title={activeEmbed.title} src={activeEmbed.embedUrl} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
    </aside>}
    <div className="music-dock">
      {isMenuOpen && <section className="music-menu" aria-label="Menu de música">
        <div className="music-menu__header"><div><span>Estação Pomocute</span><strong>Escolha sua trilha</strong></div><button type="button" onClick={() => setIsMenuOpen(false)} aria-label="Fechar menu de música"><FaTimes /></button></div>
        <div className="music-menu__preset-list">
          {tracks.map((item, index) => <button type="button" key={item.url} className={index === trackIndex ? 'is-selected' : ''} onClick={() => chooseTrack(index)}><FaPlay aria-hidden="true" /><span>{item.name}</span>{index === trackIndex && <small>{state === 'playing' ? 'Tocando' : 'Selecionada'}</small>}</button>)}
        </div>
        <div className="music-menu__links">
          <span>Seus links</span>
          {customLinks.length === 0 && <p>Adicione um link do YouTube ou Spotify.</p>}
          {customLinks.map(link => <div key={link.id} className="music-menu__link"><button type="button" onClick={() => { setActiveEmbed(link); setIsMenuOpen(false); }}>{link.platform === 'youtube' ? <FaYoutube aria-hidden="true" /> : <FaSpotify aria-hidden="true" />}<span>{link.title}</span></button><button type="button" onClick={() => removeLink(link.id)} aria-label={`Remover ${link.title}`}><FaTrash /></button></div>)}
        </div>
        <form className="music-menu__add-link" onSubmit={addLink}><label className="sr-only" htmlFor="music-link">Link do YouTube ou Spotify</label><input id="music-link" value={linkInput} onChange={event => { setLinkInput(event.target.value); setLinkError(''); }} placeholder="Cole um link do YouTube ou Spotify" /><button type="submit" aria-label="Adicionar link"><FaPlus /></button></form>
        {linkError && <p className="music-menu__error" role="alert">{linkError}</p>}
        {state === 'error' && <span className="sr-only">Música indisponível. Tente novamente ou escolha outra trilha.</span>}
        <div className="music-menu__controls" aria-label="Controles de música"><button type="button" onClick={() => changeTrack(-1)} aria-label="Faixa anterior"><FaStepBackward /></button><button type="button" className="music-menu__play" onClick={toggle} disabled={state === 'loading'} aria-label={state === 'playing' ? 'Pausar música' : 'Tocar música'}>{state === 'playing' ? <FaPause /> : <FaPlay />}</button><button type="button" onClick={() => changeTrack(1)} aria-label="Próxima faixa"><FaStepForward /></button><label className="music-menu__volume" htmlFor="music-volume"><FaVolumeUp aria-hidden="true" /><span className="sr-only">Volume da música:</span><input id="music-volume" type="range" min="0" max="100" value={volume} onChange={event => onVolumeChange(Number(event.target.value))} /></label></div>
      </section>}
      <button type="button" className="music-dock__trigger" onClick={() => { playClick(); setIsMenuOpen(open => !open); }} aria-label="Abrir menu de música" aria-expanded={isMenuOpen} title="Música"><FaMusic aria-hidden="true" /></button>
    </div>
  </>;
}

function Volume({ audioRef, volume }) {
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [audioRef, volume]);
  return null;
}
