import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './FloatingMiniTimer.css';

const modeLabels = { pomodoro: 'Foco', short: 'Pausa curta', long: 'Pausa longa' };
const statusLabels = {
  ready: 'Pronto para começar',
  running: 'Em andamento',
  paused: 'Pausado',
  completed: 'Concluído',
  ended: 'Encerrado',
};

function formatTime(milliseconds) {
  const seconds = Math.ceil(Math.max(0, milliseconds) / 1000);
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
}

function MiniTimerPanel({ mode, status, remainingMs, durationMs, onToggle, onEnd, onClose }) {
  const progress = Math.min(1, Math.max(0, 1 - remainingMs / durationMs));
  const circumference = 2 * Math.PI * 25;
  const dashOffset = circumference * (1 - progress);
  const isRunning = status === 'running';
  const canEnd = isRunning || status === 'paused';

  return (
    <section className="mini-timer-panel" aria-label="Mini-timer do Pomocute">
      <header className="mini-timer-header">
        <span className="mini-timer-brand">Pomocute</span>
        <button
          type="button"
          className="mini-timer-close"
          aria-label="Fechar mini-timer"
          onClick={onClose}
        >
          ×
        </button>
      </header>

      <div className="mini-timer-main">
        <div
          className="mini-timer-progress"
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
          <span aria-hidden="true">{Math.round(progress * 100)}%</span>
        </div>

        <div className="mini-timer-readout">
          <span className="mini-timer-mode">{modeLabels[mode]}</span>
          <strong role="timer" aria-label="Tempo restante">{formatTime(remainingMs)}</strong>
          <span className="mini-timer-status" role="status">{statusLabels[status]}</span>
        </div>
      </div>

      <div className="mini-timer-controls">
        <button type="button" onClick={onToggle} disabled={status === 'completed' || status === 'ended'}>
          {isRunning ? 'Pausar timer' : status === 'paused' ? 'Retomar timer' : 'Começar timer'}
        </button>
        <button type="button" className="mini-timer-end" onClick={onEnd} disabled={!canEnd}>
          Encerrar sessão
        </button>
      </div>
    </section>
  );
}

export default function FloatingMiniTimer({ mode, status, remainingMs, durationMs, onToggle, onEnd }) {
  const [pipWindow, setPipWindow] = useState(null);
  const [fallbackOpen, setFallbackOpen] = useState(false);
  const [notice, setNotice] = useState('');

  const closePip = () => {
    if (pipWindow && !pipWindow.closed) pipWindow.close();
    setPipWindow(null);
  };

  const openMiniTimer = async () => {
    if (pipWindow && !pipWindow.closed) {
      pipWindow.focus();
      return;
    }

    const pictureInPicture = window.documentPictureInPicture;
    if (!pictureInPicture || typeof pictureInPicture.requestWindow !== 'function') {
      setFallbackOpen(true);
      setNotice('Este navegador não oferece uma janela PiP para documentos. O mini-timer abriu nesta página; a janela não ficará sobre outras abas.');
      return;
    }

    try {
      const nextWindow = await pictureInPicture.requestWindow({ width: 340, height: 220 });
      Array.from(document.querySelectorAll('style, link[rel="stylesheet"]')).forEach(source => {
        nextWindow.document.head.appendChild(source.cloneNode(true));
      });
      nextWindow.document.title = 'Pomocute — Mini-timer';
      nextWindow.document.body.classList.add('pomocute-pip-window');
      nextWindow.addEventListener('pagehide', () => {
        setPipWindow(current => current === nextWindow ? null : current);
      }, { once: true });
      setPipWindow(nextWindow);
      setFallbackOpen(false);
      setNotice('');
    } catch (_) {
      setFallbackOpen(true);
      setNotice('Não foi possível abrir a janela PiP. O mini-timer abriu nesta página.');
    }
  };

  const panelProps = { mode, status, remainingMs, durationMs, onToggle, onEnd };

  return (
    <>
      <button type="button" className="mini-timer-launch" onClick={openMiniTimer}>
        Abrir mini-timer flutuante
      </button>
      {notice && <p className="mini-timer-notice" role="status">{notice}</p>}
      {fallbackOpen && (
        <div className="mini-timer-fallback">
          <MiniTimerPanel {...panelProps} onClose={() => setFallbackOpen(false)} />
        </div>
      )}
      {pipWindow && !pipWindow.closed && createPortal(
        <MiniTimerPanel {...panelProps} onClose={closePip} />,
        pipWindow.document.body
      )}
    </>
  );
}
