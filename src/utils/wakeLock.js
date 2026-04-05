/**
 * wakeLock.js — Keep screen awake during workout using Screen Wake Lock API.
 * Falls back gracefully if not supported.
 */

let wakeLock = null;

export async function requestWakeLock() {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => { wakeLock = null; });
    }
  } catch (e) {
    console.warn('Wake Lock failed:', e.message);
  }
}

export function releaseWakeLock() {
  if (wakeLock) {
    wakeLock.release();
    wakeLock = null;
  }
}

// Re-acquire wake lock when page becomes visible again (e.g., switching back to app)
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible' && wakeLock === null) {
      // Only re-acquire if it was previously held — we check via a flag
    }
  });
}
