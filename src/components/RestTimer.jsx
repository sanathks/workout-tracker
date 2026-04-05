import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, Plus, Minus, SkipForward } from 'lucide-react';
import { playRestDone, playTick } from '../utils/sound';

/**
 * RestTimer — uses absolute end time so it survives screen lock / background.
 * When the user returns, remaining time is calculated from Date.now().
 */
export default function RestTimer({ restSeconds = 90, onDismiss }) {
  const [totalTime, setTotalTime] = useState(restSeconds);
  const [endTime, setEndTime] = useState(() => Date.now() + restSeconds * 1000);
  const [remaining, setRemaining] = useState(restSeconds);
  const [finished, setFinished] = useState(false);
  const soundPlayed = useRef(false);
  const rafRef = useRef(null);

  // Tick loop — uses requestAnimationFrame + Date.now() for accuracy
  useEffect(() => {
    if (finished) return;

    const tick = () => {
      const now = Date.now();
      const left = Math.max(0, Math.ceil((endTime - now) / 1000));
      setRemaining(left);

      if (left <= 0) {
        setFinished(true);
        if (!soundPlayed.current) {
          soundPlayed.current = true;
          playRestDone();
        }
        return;
      }

      // Tick sounds at 3, 2, 1
      if (left <= 3 && left > 0) {
        const msToNext = (endTime - now) % 1000;
        if (msToNext > 900) playTick();
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);

    // Also re-check when page becomes visible (returning from lock screen)
    const onVisible = () => {
      if (document.visibilityState === 'visible') {
        // Force an immediate recalc
        const left = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
        setRemaining(left);
        if (left <= 0 && !soundPlayed.current) {
          soundPlayed.current = true;
          setFinished(true);
          playRestDone();
        }
      }
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [endTime, finished]);

  const adjust = useCallback((delta) => {
    const newTotal = Math.max(15, totalTime + delta);
    setTotalTime(newTotal);
    setEndTime(prev => prev + delta * 1000);
    setFinished(false);
    soundPlayed.current = false;
  }, [totalTime]);

  const progress = totalTime > 0 ? ((totalTime - remaining) / totalTime) : 1;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - progress);

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      gap: '20px', padding: '8px 0',
    }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        color: 'var(--text-sub)', fontSize: '0.8rem', fontWeight: '600',
      }}>
        <Timer size={16} />
        <span>{finished ? 'Rest complete!' : 'Rest timer'}</span>
      </div>

      {/* Circular countdown */}
      <div style={{ position: 'relative', width: '160px', height: '160px' }}>
        <svg width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="80" cy="80" r={radius} fill="none" stroke="var(--surface2)" strokeWidth="6" />
          <circle
            cx="80" cy="80" r={radius} fill="none"
            stroke={finished ? 'var(--primary)' : remaining <= 10 ? 'var(--warning)' : 'var(--primary)'}
            strokeWidth="6" strokeLinecap="round"
            strokeDasharray={circumference} strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.3s linear, stroke 0.3s' }}
          />
        </svg>
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
        }}>
          <span style={{
            fontSize: '2.2rem', fontWeight: '800', fontVariantNumeric: 'tabular-nums',
            color: finished ? 'var(--primary)' : remaining <= 10 ? 'var(--warning)' : 'var(--text)',
            transition: 'color 0.3s',
          }}>
            {mins}:{secs.toString().padStart(2, '0')}
          </span>
          {!finished && (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '2px' }}>remaining</span>
          )}
        </div>
      </div>

      {/* Adjust time */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button onClick={() => adjust(-15)} style={{
          background: 'var(--surface2)', border: '1.5px solid var(--border)',
          borderRadius: '50%', width: '44px', height: '44px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)',
        }}>
          <Minus size={18} />
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: '600', minWidth: '40px', textAlign: 'center' }}>
          {totalTime}s
        </span>
        <button onClick={() => adjust(15)} style={{
          background: 'var(--surface2)', border: '1.5px solid var(--border)',
          borderRadius: '50%', width: '44px', height: '44px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)',
        }}>
          <Plus size={18} />
        </button>
      </div>

      {/* Skip / Dismiss */}
      <button onClick={onDismiss} style={{
        background: finished ? 'var(--primary)' : 'var(--surface2)',
        color: finished ? '#000' : 'var(--text-sub)',
        border: finished ? 'none' : '1.5px solid var(--border)',
        borderRadius: 'var(--radius)', padding: '14px 32px',
        fontWeight: '700', fontSize: '0.9rem',
        display: 'flex', alignItems: 'center', gap: '8px', minHeight: '48px',
      }}>
        {finished ? <>Next set</> : <><SkipForward size={16} /> Skip rest</>}
      </button>
    </div>
  );
}
