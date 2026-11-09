import React, { useEffect, useRef, useState } from 'react';
import { FaMusic, FaPause, FaPlay, FaPlus, FaSpotify, FaStepBackward, FaStepForward, FaTimes, FaTrash, FaVolumeUp, FaYoutube } from 'react-icons/fa';
import { playClick } from './ClickSound';
import { getStoredUser } from '../services/auth';
import { createSyncId, createMusicLink, listMusicLinks, removeMusicLink, updateMusicLink } from '../services/data';
import { useI18n } from '../i18n';

const tracks = [
  { name: 'Lofi Chill Beats', url: 'https://stream.laut.fm/lofi' },
  { name: 'Jazz Vibes', url: 'https://stream.laut.fm/jazz' },
  { name: 'Anime Lofi', url: 'https://stream.laut.fm/animefm' },
];
const guestStorageKey = 'pomocute-music-links-v1';
const genericYoutubeTitle = 'Vídeo do YouTube';

function storageKeyFor(userId) {
  return userId ? `${guestStorageKey}:${userId}` : guestStorageKey;
}

function normalizeLink(link) {
  if (!link || typeof link.url !== 'string' || typeof link.embedUrl !== 'string') return null;
  const syncId = typeof link.syncId === 'string' && link.syncId ? link.syncId : createSyncId();
  return {
    id: typeof link.id === 'string' && link.id ? link.id : `local-${syncId}`,
    syncId,
    platform: link.platform === 'spotify' ? 'spotify' : 'youtube',
    title: typeof link.title === 'string' && link.title.trim() ? link.title.trim().slice(0, 280) : genericYoutubeTitle,
    url: link.url,
    embedUrl: link.embedUrl,
    pending: Boolean(link.pending),
    deleted: Boolean(link.deleted),
  };
}

function linkFromRow(link) {
  return normalizeLink({
    id: link.id,
    syncId: link.client_id,
    platform: link.platform,
    title: link.title,
    url: link.source_url,
    embedUrl: link.embed_url,
    pending: false,
  });
}

function loadLinks(userId = null) {
  try {
    const links = JSON.parse(localStorage.getItem(storageKeyFor(userId)));
    return Array.isArray(links) ? links.map(normalizeLink).filter(Boolean) : [];
  } catch (_) {
    return [];
  }
}

function parseEmbedLink(rawUrl) {
  let url;
  try { url = new URL(rawUrl.trim()); } catch (_) { return null; }
  const host = url.hostname.replace(/^www\./, '').toLowerCase();

  if (host === 'youtu.be' || host === 'youtube.com' || host.endsWith('.youtube.com')) {
    const videoId = host === 'youtu.be'
      ? url.pathname.split('/').filter(Boolean)[0]
      : url.searchParams.get('v') || url.pathname.match(/\/(embed|shorts|live)\/([^/?]+)/)?.[2];
    if (!/^[a-zA-Z0-9_-]{11}$/.test(videoId || '')) return null;
    return {
      platform: 'youtube',
      title: genericYoutubeTitle,
      url: url.toString(),
      embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`,
    };
  }

  if (host === 'open.spotify.com') {
    const [kind, id] = url.pathname.split('/').filter(Boolean);
    if (!['track', 'album', 'playlist', 'episode', 'show'].includes(kind) || !/^[a-zA-Z0-9]+$/.test(id || '')) return null;
    return {
      platform: 'spotify',
      title: `Spotify: ${kind === 'track' ? 'faixa' : kind === 'playlist' ? 'playlist' : kind}`,
      url: url.toString(),
      embedUrl: `https://open.spotify.com/embed/${kind}/${id}`,
    };
  }
  return null;
}

function needsYoutubeTitle(link) {
  return link?.platform === 'youtube' && (!link.title || link.title === genericYoutubeTitle);
}

async function resolveYoutubeTitle(link) {
  if (!needsYoutubeTitle(link) || typeof fetch !== 'function') return link;
  try {
    const response = await fetch(`/api/youtube-title?url=${encodeURIComponent(link.url)}`);
    if (!response.ok) return link;
    const data = await response.json();
    const title = typeof data?.title === 'string' ? data.title.trim().replace(/\s+/g, ' ') : '';
    return title ? { ...link, title: title.slice(0, 280) } : link;
  } catch (_) {
    return link;
  }
}

export default function AudioPlayer({ volume, onVolumeChange, onEnergyChange, onExternalPlayback }) {
  const { t } = useI18n();
  const initialUser = getStoredUser();
  const [trackIndex, setTrackIndex] = useState(0);
  const [state, setState] = useState('paused');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [linkError, setLinkError] = useState('');
  const [user, setUser] = useState(initialUser);
  const [customLinks, setCustomLinks] = useState(() => loadLinks(initialUser?.id));
  const [activeEmbed, setActiveEmbed] = useState(null);
  const audioRef = useRef(null);
  const request = useRef(0);
  const shouldResume = useRef(false);
  const track = tracks[trackIndex];
  const visibleLinks = customLinks.filter(link => !link.deleted);

  useEffect(() => () => {
    request.current += 1;
    onEnergyChange?.(0);
  }, [onEnergyChange]);

  useEffect(() => {
    try { localStorage.setItem(storageKeyFor(user?.id), JSON.stringify(customLinks)); } catch (_) {}
  }, [customLinks, user?.id]);

  useEffect(() => {
    let active = true;
    const hydrateLocalTitles = async () => {
      const localLinks = loadLinks(initialUser?.id);
      const hydratedLinks = await Promise.all(localLinks.map(resolveYoutubeTitle));
      if (active && hydratedLinks.some((link, index) => link.title !== localLinks[index].title)) setCustomLinks(hydratedLinks);
    };
    hydrateLocalTitles();
    return () => { active = false; };
  }, [initialUser?.id]);

  useEffect(() => {
    const syncUser = event => {
      const nextUser = event.detail?.user || getStoredUser();
      if (nextUser?.id) {
        try { localStorage.removeItem(guestStorageKey); } catch (_) {}
        setCustomLinks(loadLinks(nextUser.id));
      } else {
        try { localStorage.removeItem(guestStorageKey); } catch (_) {}
        setCustomLinks([]);
      }
      setActiveEmbed(null);
      setUser(nextUser);
    };
    window.addEventListener('pomocute:auth-change', syncUser);
    return () => window.removeEventListener('pomocute:auth-change', syncUser);
  }, []);

  useEffect(() => {
    if (!user?.id) return undefined;
    let active = true;

    const syncLinks = async () => {
      try {
        const remoteRows = await listMusicLinks();
        if (!active || !remoteRows) return;

        const remoteLinks = remoteRows.map(linkFromRow).filter(Boolean);
        const remoteBySyncId = new Map(remoteLinks.map(link => [link.syncId, link]));
        const remoteById = new Map(remoteLinks.map(link => [link.id, link]));
        const localLinks = loadLinks(user.id);

        const deletions = localLinks.filter(link => link.deleted);
        const deletionResults = await Promise.all(deletions.map(async link => {
          const remote = remoteBySyncId.get(link.syncId) || remoteById.get(link.id);
          if (!remote) return { ...link, deleted: true, pending: false, remove: true };
          try {
            await removeMusicLink(remote.id);
            return { ...link, id: remote.id, syncId: remote.syncId, deleted: true, pending: false, remove: true };
          } catch (_) {
            return { ...link, deleted: true, pending: true, remove: false };
          }
        }));

        const pendingOrMissing = localLinks.filter(link => {
          if (link.deleted) return false;
          const remote = remoteBySyncId.get(link.syncId) || remoteById.get(link.id);
          return link.pending || !remote;
        });
        const resolved = await Promise.all(pendingOrMissing.map(async localLink => {
          const remote = remoteBySyncId.get(localLink.syncId) || remoteById.get(localLink.id);
          if (remote) return remote;
          const titledLink = await resolveYoutubeTitle(localLink);
          try {
            const saved = await createMusicLink(titledLink);
            return saved ? linkFromRow(saved) : { ...titledLink, pending: true };
          } catch (_) {
            return { ...titledLink, pending: true };
          }
        }));

        const titledRemoteLinks = await Promise.all(remoteLinks.map(resolveYoutubeTitle));
        titledRemoteLinks.forEach((link, index) => {
          if (link.title !== remoteLinks[index].title) updateMusicLink(link.id, link.title).catch(() => {});
        });

        if (!active) return;
        const merged = new Map(titledRemoteLinks.map(link => [link.syncId, link]));
        deletionResults.forEach(link => {
          if (link.remove) merged.delete(link.syncId);
          else merged.set(link.syncId, link);
        });
        resolved.forEach(link => merged.set(link.syncId, link));
        setCustomLinks([...merged.values()]);
      } catch (_) {
        // O cache separado da própria conta permanece disponível sem rede.
      }
    };

    syncLinks();
    return () => { active = false; };
  }, [user?.id]);

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
    const parsedLink = parseEmbedLink(linkInput);
    if (!parsedLink) { setLinkError(t('music.invalid')); return; }

    const existing = visibleLinks.find(link => link.url === parsedLink.url);
    const syncId = createSyncId();
    const localLink = {
      ...parsedLink,
      id: `local-${syncId}`,
      syncId,
      pending: Boolean(user?.id),
      deleted: false,
    };

    if (!existing) {
      setCustomLinks(previous => [...previous, localLink]);
      const enrichAndSave = async () => {
        const titledLink = await resolveYoutubeTitle(localLink);
        if (titledLink.title !== localLink.title) {
          setCustomLinks(previous => previous.map(link => link.syncId === localLink.syncId ? titledLink : link));
          setActiveEmbed(previous => previous?.syncId === localLink.syncId ? titledLink : previous);
        }
        if (!user?.id) return;
        try {
          const saved = await createMusicLink(titledLink);
          if (saved) {
            const syncedLink = linkFromRow(saved);
            setCustomLinks(previous => previous.map(link => link.syncId === localLink.syncId ? syncedLink : link));
            setActiveEmbed(previous => previous?.syncId === localLink.syncId ? syncedLink : previous);
          }
        } catch (_) {}
      };
      enrichAndSave();
    }

    setLinkInput('');
    setLinkError('');
    setActiveEmbed(existing || localLink);
    setIsMenuOpen(false);
  };

  const removeLink = link => {
    setActiveEmbed(previous => previous?.syncId === link.syncId ? null : previous);
    if (!user?.id || link.id.startsWith('local-')) {
      setCustomLinks(previous => previous.filter(item => item.syncId !== link.syncId));
      return;
    }

    const pendingDeletion = { ...link, deleted: true, pending: true };
    setCustomLinks(previous => previous.map(item => item.syncId === link.syncId ? pendingDeletion : item));
    removeMusicLink(link.id).then(() => {
      setCustomLinks(previous => previous.filter(item => item.syncId !== link.syncId));
    }).catch(() => {});
  };

  return <>
    <audio ref={audioRef} src={track.url} preload="none" onError={() => { request.current += 1; onEnergyChange?.(0); setState('error'); }} onPlay={event => { event.currentTarget.volume = volume / 100; onEnergyChange?.(0); }} />
    <Volume audioRef={audioRef} volume={volume} />
    {activeEmbed && <aside className="embedded-player-window" aria-label={`Player ${activeEmbed.platform}`}>
      <button type="button" className="embedded-player-close" onClick={() => setActiveEmbed(null)} aria-label={t('music.closePlayer')}><FaTimes /></button>
      <iframe title={activeEmbed.title} src={activeEmbed.embedUrl} referrerPolicy="strict-origin-when-cross-origin" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" allowFullScreen />
    </aside>}
    <div className="music-dock">
      {isMenuOpen && <section className="music-menu" aria-label={t('music.open')}>
        <div className="music-menu__header"><div><span>{t('music.station')}</span><strong>{t('music.choose')}</strong></div><button type="button" onClick={() => setIsMenuOpen(false)} aria-label={t('music.close')}><FaTimes /></button></div>
        <div className="music-menu__preset-list">
          {tracks.map((item, index) => <button type="button" key={item.url} className={index === trackIndex ? 'is-selected' : ''} onClick={() => chooseTrack(index)}><FaPlay aria-hidden="true" /><span>{item.name}</span>{index === trackIndex && <small>{state === 'playing' ? t('music.playing') : t('music.selected')}</small>}</button>)}
        </div>
        <div className="music-menu__links">
          <span>{t('music.links')}</span>
          {visibleLinks.length === 0 && <p>{t('music.empty')}</p>}
          {visibleLinks.map(link => <div key={link.syncId} className="music-menu__link"><button type="button" title={link.title} onClick={() => { setActiveEmbed(link); setIsMenuOpen(false); }}>{link.platform === 'youtube' ? <FaYoutube aria-hidden="true" /> : <FaSpotify aria-hidden="true" />}<span>{link.title}</span></button><button type="button" onClick={() => removeLink(link)} aria-label={`Remover ${link.title}`}><FaTrash /></button></div>)}
        </div>
        <form className="music-menu__add-link" onSubmit={addLink}><label className="sr-only" htmlFor="music-link">{t('music.linkLabel')}</label><input id="music-link" maxLength="2048" value={linkInput} onChange={event => { setLinkInput(event.target.value); setLinkError(''); }} placeholder={t('music.linkPlaceholder')} /><button type="submit" aria-label={t('music.add')}><FaPlus /></button></form>
        {linkError && <p className="music-menu__error" role="alert">{linkError}</p>}
        {state === 'error' && <span className="sr-only">{t('music.unavailable')}</span>}
        <div className="music-menu__controls" aria-label={t('music.open')}><button type="button" onClick={() => changeTrack(-1)} aria-label={t('music.previous')}><FaStepBackward /></button><button type="button" className="music-menu__play" onClick={toggle} disabled={state === 'loading'} aria-label={state === 'playing' ? t('music.pause') : t('music.play')}>{state === 'playing' ? <FaPause /> : <FaPlay />}</button><button type="button" onClick={() => changeTrack(1)} aria-label={t('music.next')}><FaStepForward /></button><label className="music-menu__volume" htmlFor="music-volume"><FaVolumeUp aria-hidden="true" /><span className="sr-only">{t('music.volume')}</span><input id="music-volume" type="range" min="0" max="100" value={volume} onChange={event => onVolumeChange(Number(event.target.value))} /></label></div>
      </section>}
      <button type="button" className="music-dock__trigger" onClick={() => { playClick(); setIsMenuOpen(open => !open); }} aria-label={t('music.open')} aria-expanded={isMenuOpen} title={t('music.open')}><FaMusic aria-hidden="true" /></button>
    </div>
  </>;
}

function Volume({ audioRef, volume }) {
  useEffect(() => { if (audioRef.current) audioRef.current.volume = volume / 100; }, [audioRef, volume]);
  return null;
}
