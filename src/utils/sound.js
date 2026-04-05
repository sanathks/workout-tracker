/**
 * sound.js — Web Audio API notification sounds
 * No external files needed.
 */

let audioCtx = null;

function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}

// Unlock audio on first user interaction (required on iOS)
export function unlockAudio() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    // Play silent buffer to unlock
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch {}
}

/**
 * Play a pleasant "rest over" chime — two ascending tones
 */
export function playRestDone() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    const now = ctx.currentTime;

    // First tone
    playTone(ctx, 660, now, 0.15, 0.3);
    // Second tone (higher, slight delay)
    playTone(ctx, 880, now + 0.15, 0.15, 0.3);
    // Third tone (highest)
    playTone(ctx, 1100, now + 0.3, 0.2, 0.25);
  } catch (e) {
    console.warn('Sound playback failed:', e);
  }
}

/**
 * Play a short tick sound (for countdown warnings)
 */
export function playTick() {
  try {
    const ctx = getCtx();
    if (ctx.state === 'suspended') ctx.resume();
    playTone(ctx, 440, ctx.currentTime, 0.05, 0.1);
  } catch {}
}

function playTone(ctx, freq, startTime, duration, volume = 0.3) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.value = freq;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(volume, startTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start(startTime);
  osc.stop(startTime + duration + 0.01);
}
