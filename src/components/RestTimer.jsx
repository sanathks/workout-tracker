import { useState, useEffect, useRef, useCallback } from 'react';
import { Timer, X, Plus, Minus, SkipForward } from 'lucide-react';
import { playRestDone, playTick } from '../utils/sound';

/**
 * RestTimer — shows after logging a set (not the last one).
 * Counts down from the rest duration, plays a chime when done.
 *
 * Props:
 *   restSeconds  — default rest time in seconds
 *   onDismiss    — called when timer is skipped or dismissed after finishing
 */
export default function RestTimer({ restSeconds = 90, onDismiss }) {
  const [totalTime, setTotalTime] = useState(restSeconds);
  const [remaining, setRemaining] = useState(restSeconds);
  const [finished, setFinished] = useState(false);
  const intervalRef = useRef(null);
  const soundPlayed = useRef(false);

  // Countdown
  useEffect(() => {
    if (finished) return;

    intervalRef.current = setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setFinished(true);
          if (!soundPlayed.current) {
            soundPlayed.current = true;
            playRestDone();
          }
          return 0;
        }
        // Tick sound at 3, 2, 1
        if (prev <= 4 && prev > 1) playTick();
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(intervalRef.current);
  }, [finished, totalTime]);

  const adjust = useCallback((delta) => {
    const newTotal = Math.max(15, totalTime + delta);
    setTotalTime(newTotal);
    setRemaining(prev => Math.max(0, prev + delta));
    setFinished(false);
    soundPlayed.current = false;
  }, [totalTime]);

  const progress = totalTime > 0 ? ((totalTime - remaining) / totalTime) : 1;
  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  // Circle progress
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
          {/* Background circle */}
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke="var(--surface2)"
            strokeWidth="6"
          />
          {/* Progress circle */}
          <circle
            cx="80" cy="80" r={radius}
            fill="none"
            stroke={finished ? 'var(--primary)' : remaining <= 10 ? 'var(--warning)' : 'var(--primary)'}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }}
          />
        </svg>
        {/* Time display */}
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
            <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '2px' }}>
              remaining
            </span>
          )}
        </div>
      </div>

      {/* Adjust time buttons */}
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button
          onClick={() => adjust(-15)}
          style={{
            background: 'var(--surface2)', border: '1.5px solid var(--border)',
            borderRadius: '50%', width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-sub)',
          }}
        >
          <Minus size={18} />
        </button>
        <span style={{ fontSize: '0.8rem', color: 'var(--text-sub)', fontWeight: '600', minWidth: '40px', textAlign: 'center' }}>
          {totalTime}s
        </span>
        <button
          onClick={() => adjust(15)}
          style={{
            background: 'var(--surface2)', border: '1.5px solid var(--border)',
            borderRadius: '50%', width: '44px', height: '44px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-sub)',
          }}
        >
          <Plus size={18} />
        </button>
      </div>

      {/* Skip / Dismiss */}
      <button
        onClick={onDismiss}
        style={{
          background: finished ? 'var(--primary)' : 'var(--surface2)',
          color: finished ? '#000' : 'var(--text-sub)',
          border: finished ? 'none' : '1.5px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: '14px 32px',
          fontWeight: '700',
          fontSize: '0.9rem',
          display: 'flex', alignItems: 'center', gap: '8px',
          minHeight: '48px',
        }}
      >
        {finished ? (
          <>Next set</>
        ) : (
          <><SkipForward size={16} /> Skip rest</>
        )}
      </button>
    </div>
  );
}
