import { useState, useEffect } from 'react';
import { onSyncStatusChange, getSyncStatus, getPendingCount } from '../utils/syncQueue';

const STATUS_CONFIG = {
  idle:    { icon: '✅', text: 'Synced',              color: 'var(--primary)',  bg: 'rgba(74,222,128,0.1)' },
  syncing: { icon: '🔄', text: 'Syncing...',          color: '#fbbf24',        bg: 'rgba(251,191,36,0.1)' },
  pending: { icon: '⏳', text: 'Sync pending',        color: '#fbbf24',        bg: 'rgba(251,191,36,0.1)' },
  error:   { icon: '⚠️', text: 'Sync failed — retry', color: '#f87171',        bg: 'rgba(248,113,113,0.1)' },
  offline: { icon: '📴', text: 'Offline',             color: 'var(--text-sub)', bg: 'rgba(136,136,136,0.1)' },
};

export default function SyncStatus({ style }) {
  const [status, setStatus] = useState(getSyncStatus());
  const [pending, setPending] = useState(getPendingCount());
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const unsub = onSyncStatusChange((s) => {
      setStatus(s);
      setPending(getPendingCount());
      // Show briefly when syncing/synced
      setVisible(true);
    });

    // Also listen for online/offline
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

  // Auto-hide after 3s for idle/synced status
  useEffect(() => {
    if (status === 'idle' && visible) {
      const t = setTimeout(() => setVisible(false), 3000);
      return () => clearTimeout(t);
    }
    if (status !== 'idle') setVisible(true);
  }, [status, visible]);

  // Always show offline or pending/error; briefly show synced
  if (!visible && status === 'idle') return null;

  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.idle;

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      background: cfg.bg,
      borderBottom: `1px solid ${cfg.color}`,
      padding: '6px 16px',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
      fontSize: '0.75rem', color: cfg.color, fontWeight: '600',
      transition: 'all 0.3s ease',
      ...style,
    }}>
      <span>{cfg.icon}</span>
      <span>{cfg.text}{pending > 0 && status !== 'idle' ? ` (${pending} pending)` : ''}</span>
    </div>
  );
}
