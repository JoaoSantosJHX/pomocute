function getAudioContext() {
  if (typeof window === 'undefined') return null;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  return AudioContext ? new AudioContext() : null;
}

function addTone(context, destination, { at, frequency, duration, type = 'sine', volume = 0.24 }) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, at);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.03);
}

export function playAlarm(type = 'chime', volume = 65) {
  const context = getAudioContext();
  if (!context) return false;

  const master = context.createGain();
  master.gain.value = Math.max(0, Math.min(100, volume)) / 100;
  master.connect(context.destination);
  const now = context.currentTime + 0.02;

  if (type === 'bell') {
    addTone(context, master, { at: now, frequency: 523.25, duration: 1.25, type: 'sine', volume: 0.2 });
    addTone(context, master, { at: now, frequency: 1318.51, duration: 0.95, type: 'sine', volume: 0.12 });
    addTone(context, master, { at: now + 0.35, frequency: 783.99, duration: 0.9, type: 'triangle', volume: 0.11 });
  } else if (type === 'digital') {
    [0, 0.17, 0.34].forEach((offset, index) => addTone(context, master, {
      at: now + offset,
      frequency: index === 2 ? 990 : 740,
      duration: 0.11,
      type: 'square',
      volume: 0.12,
    }));
  } else {
    addTone(context, master, { at: now, frequency: 783.99, duration: 0.48, type: 'sine', volume: 0.19 });
    addTone(context, master, { at: now + 0.2, frequency: 1046.5, duration: 0.7, type: 'sine', volume: 0.17 });
  }

  context.resume?.().catch(() => {});
  window.setTimeout(() => context.close?.().catch(() => {}), 1800);
  return true;
}
