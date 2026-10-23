import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { FaPause, FaPlay, FaStop } from 'react-icons/fa';
import { LuPictureInPicture2 } from 'react-icons/lu';
import './FloatingMiniTimer.css';

const modeLabels = { pomodoro: 'Foco', short: 'Pausa curta', long: 'Pausa longa' };

function formatTime(milliseconds) {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function MiniTimerPanel({ mode, status, remainingMs, durationMs, onToggle, onEnd, onClose, isFallback = false }) {
  const progress = Math.min(1, Math.max(0, 1 - remainingMs / durationMs));
  const circumference = 2 * Math.PI * 25;
  const dashOffset = circumference * (1 - progress);
  const isRunning = status === 'running';
  const canEnd = isRunning || status === 'paused';

  return (
    <section className="mini-timer-panel" aria-label="Mini-timer do Pomocute">
      {isFallback && (
        <button
          type="button"
          className="mini-timer-close"
          aria-label="Fechar mini-timer"
          onClick={onClose}
        >
          ×
        </button>
      )}

      <div className="mini-timer-main">
        <div className="mini-timer-progress">
          <div
            className="mini-timer-progress-ring"
            role="progressbar"
            aria-label="Progresso da sessão"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-valuenow={Math.round(progress * 100)}
          >
            <svg viewBox="0 0 64 64" aria-hidden="true">
              <circle className="mini-timer-progress-track" cx="32" cy="32" r="25" />
              <circle
                className="mini-timer-progress-value"
                cx="32"
                cy="32"
                r="25"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
              />
            </svg>
          </div>
          <button
            type="button"
            className="mini-timer-toggle"
            aria-label={isRunning ? 'Pausar timer' : 'Retomar timer'}
            onClick={onToggle}
            disabled={status === 'completed' || status === 'ended'}
          >
            {isRunning ? <FaPause aria-hidden="true" /> : <FaPlay aria-hidden="true" />}
          </button>
        </div>

        <div className="mini-timer-readout">
          <strong role="timer" aria-label="Tempo restante">{formatTime(remainingMs)}</strong>
          <span className="mini-timer-mode"><i aria-hidden="true" />{modeLabels[mode]}</span>
        </div>

        <button
          type="button"
          className="mini-timer-end"
          aria-label="Encerrar sessão"
          onClick={onEnd}
          disabled={!canEnd}
        >
          <FaStop aria-hidden="true" />
        </button>
      </div>
    </section>
  );
}

export default function FloatingMiniTimer({ mode, status, remainingMs, durationMs, onToggle, onEnd }) {
  const [externalWindow, setExternalWindow] = useState(null);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!externalWindow) return undefined;

    const handlePageHide = () => setExternalWindow(current => current === externalWindow ? null : current);
    externalWindow.addEventListener('pagehide', handlePageHide, { once: true });
    return () => {
      externalWindow.removeEventListener('pagehide', handlePageHide);
      if (!externalWindow.closed) externalWindow.close();
    };
  }, [externalWindow]);

  const closeExternalWindow = () => {
    if (externalWindow && !externalWindow.closed) externalWindow.close();
    setExternalWindow(null);
  };

  const prepareExternalWindow = nextWindow => {
    Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).forEach(source => {
      const copy = source.cloneNode(true);
      if (copy.tagName === 'LINK') copy.href = source.href;
      nextWindow.document.head.appendChild(copy);
    });
    nextWindow.document.title = 'Pomocute — Mini-timer';
    nextWindow.document.body.classList.add('pomocute-pip-window');
    setExternalWindow(nextWindow);
    setFallbackOpen(false);
    setNotice('');
  };

  const openBrowserPopup = () => {
    const popup = window.open('', 'pomocute-mini-timer', 'popup=yes,width=360,height=220');
    if (!popup) return false;
    prepareExternalWindow(popup);
    return true;
  };

  const openMiniTimer = async () => {
    if (externalWindow && !externalWindow.closed) {
      externalWindow.focus();
      return;
    }

    const pictureInPicture = window.documentPictureInPicture;
    if (pictureInPicture && typeof pictureInPicture.requestWindow === 'function') {
      try {
        const nextWindow = await pictureInPicture.requestWindow({
          width: 360,
          height: 160,
          preferInitialWindowPlacement: true,
        });
        prepareExternalWindow(nextWindow);
        return;
      } catch (_) {
        // A janela pop-out abaixo mantém a experiência flutuante quando PiP falha.
      }
    }

    if (!openBrowserPopup()) {
      setFallbackOpen(true);
      setNotice('O navegador bloqueou a janela flutuante. O mini-timer abriu nesta página.');
    }
  };

  const panelProps = { mode, status, remainingMs, durationMs, onToggle, onEnd };

  return (
    <>
      <button
        type="button"
        className="mini-timer-launch"
        aria-label="Abrir mini-timer flutuante"
        data-tooltip="Pop out timer"
        onClick={openMiniTimer}
      >
        <LuPictureInPicture2 aria-hidden="true" />
      </button>
      {notice && <p className="mini-timer-notice" role="status">{notice}</p>}
      {fallbackOpen && createPortal(
        <div className="mini-timer-fallback">
          <MiniTimerPanel {...panelProps} isFallback onClose={() => setFallbackOpen(false)} />
        </div>,
        document.body
      )}
      {externalWindow && !externalWindow.closed && createPortal(
        <MiniTimerPanel {...panelProps} onClose={closeExternalWindow} />,
        externalWindow.document.body
      )}
    </>
  );
}
