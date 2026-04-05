import { useState } from 'react';
import { Dumbbell, Delete } from 'lucide-react';
import { login, getSettings } from '../utils/storage';

export default function Login({ onLogin }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

  const handleDigit = (d) => {
    if (pin.length >= 4) return;
    const next = pin + d;
    setPin(next);
    setError('');
    if (next.length === 4) {
      const settings = getSettings();
      if (next === settings.pin) {
        login();
        onLogin();
      } else {
        setShake(true);
        setTimeout(() => { setPin(''); setShake(false); setError('Wrong PIN'); }, 600);
      }
    }
  };

  const handleDelete = () => setPin(p => p.slice(0, -1));

  const digits = ['1','2','3','4','5','6','7','8','9','','0','del'];

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
      paddingTop: 'calc(24px + var(--safe-top))',
      paddingBottom: 'calc(24px + var(--safe-bottom))',
      gap: '32px',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
          <Dumbbell size={48} strokeWidth={2} color="var(--primary)" />
        </div>
        <h1 style={{ marginBottom: '4px' }}>Sanath's Gym</h1>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>Enter your PIN to continue</p>
      </div>

      <div style={{ display: 'flex', gap: '16px', animation: shake ? 'shake 0.4s' : '' }}>
        {[0,1,2,3].map(i => (
          <div key={i} style={{
            width: '14px', height: '14px',
            borderRadius: '50%',
            background: pin.length > i ? 'var(--primary)' : 'var(--border)',
            transition: 'background 0.15s, transform 0.15s',
            transform: pin.length > i ? 'scale(1.2)' : 'scale(1)',
          }} />
        ))}
      </div>

      {error && <p style={{ color: 'var(--danger)', fontSize: '0.85rem', marginTop: '-16px' }}>{error}</p>}

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '10px',
        width: '100%',
        maxWidth: '280px',
      }}>
        {digits.map((d, i) => (
          <button
            key={i}
            onClick={() => d === 'del' ? handleDelete() : d ? handleDigit(d) : null}
            style={{
              aspectRatio: '1.2',
              minHeight: '60px',
              borderRadius: 'var(--radius)',
              background: d === 'del' ? 'transparent' : 'var(--surface)',
              border: d === 'del' ? 'none' : '1.5px solid var(--border)',
              color: 'var(--text)',
              fontSize: '1.5rem',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: !d ? 0 : 1,
              pointerEvents: !d ? 'none' : 'auto',
            }}
          >
            {d === 'del' ? <Delete size={22} color="var(--text-sub)" /> : d}
          </button>
        ))}
      </div>
    </div>
  );
}
