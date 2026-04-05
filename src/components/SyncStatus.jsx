import { useState, useEffect } from 'react';
import { onSyncStatusChange, getSyncStatus, getPendingCount } from '../utils/syncQueue';
import { CheckCircle, RefreshCw, Clock, AlertTriangle, WifiOff } from 'lucide-react';

const STATUS_CONFIG = {
  idle:    { Icon: CheckCircle,   text: 'Synced',              color: 'var(--primary)',  bg: 'rgba(74,222,128,0.1)' },
  syncing: { Icon: RefreshCw,     text: 'Syncing...',          color: '#fbbf24',        bg: 'rgba(251,191,36,0.1)' },
  pending: { Icon: Clock,         text: 'Sync pending',        color: '#fbbf24',        bg: 'rgba(251,191,36,0.1)' },
  error:   { Icon: AlertTriangle, text: 'Sync failed — retry', color: '#f87171',        bg: 'rgba(248,113,113,0.1)' },
  offline: { Icon: WifiOff,       text: 'Offline',             color: 'var(--text-sub)', bg: 'rgba(136,136,136,0.1)' },
};

export default function SyncStatus({ style }) {
  const [status, setStatus] = useState(getSyncStatus());
  const [pending, setPending] = useState(getPendingCount());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsub = onSyncStatusChange((s) => {
      setStatus(s);
      setPending(getPendingCount());
      setVisible(true);
    });

    const handleOnline = () => setStatus(getSyncStatus());
    const handleOffline = () => setStatus('offline');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsub();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (status === 'idle' && visible) {
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
    if (status !== 'idle') setVisible(true);
  }, [status, visible]);

  if (!visible && status === 'idle') return null;

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle;
  const Icon = cfg.Icon;

  return (
    <div style={{
      position: 'fixed', bottom: 'calc(60px + var(--safe-bottom, 0px))', left: '16px', right: '16px',
      zIndex: 200,
      background: cfg.bg,
      border: `1px solid ${cfg.color}`,
      borderRadius: 'var(--radius)',
      padding: '8px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      fontSize: '0.75rem', color: cfg.color, fontWeight: '600',
      transition: 'all 0.3s ease',
      ...style,
    }}>
      <Icon size={14} />
      <span>{cfg.text}{pending > 0 && status !== 'idle' ? ` (${pending} pending)` : ''}</span>
    </div>
  );
}
