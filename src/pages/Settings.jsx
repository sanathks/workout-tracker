import { useState, useRef } from 'react';
import {
  getSettings, saveSettings, logout,
  getCurrentWeek, setCurrentWeek,
  getCurrentDayIndex, setCurrentDayIndex,
  exportData, importData,
  pushToCloud, getLastSyncTime,
} from '../utils/storage';
import { forceSync, getSyncStatus, getPendingCount } from '../utils/syncQueue';
import {
  Lock, Bot, Cloud, RefreshCw, Download, Upload,
  Calendar, Save, LogOut,
} from 'lucide-react';

export default function Settings({ onLogout }) {
  const [settings, setSettings] = useState(getSettings());
  const [week, setWeek]         = useState(getCurrentWeek());
  const [dayIdx, setDayIdx]     = useState(getCurrentDayIndex());
  const [saved, setSaved]       = useState(false);
  const [syncing, setSyncing]   = useState(false);
  const [syncMsg, setSyncMsg]   = useState('');
  const [importMsg, setImportMsg] = useState('');
  const fileInputRef = useRef();

  const lastSync = getLastSyncTime();

  const handleSave = () => {
    saveSettings(settings);
    setCurrentWeek(parseInt(week));
    setCurrentDayIndex(parseInt(dayIdx));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleManualSync = async () => {
    setSyncing(true);
    setSyncMsg('');
    try {
      await pushToCloud();
      await forceSync();
      setSyncMsg('Synced to GitHub successfully');
    } catch {
      setSyncMsg('Sync failed — will retry automatically when online');
    } finally {
      setSyncing(false);
      setTimeout(() => setSyncMsg(''), 4000);
    }
  };

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const ok = importData(ev.target.result);
      setImportMsg(ok ? 'Data imported successfully' : 'Invalid file — import failed');
      setTimeout(() => setImportMsg(''), 4000);
    };
    reader.readAsText(file);
  };

  return (
    <div className="page gap-4">
      <h1>Settings</h1>

      {/* Security */}
      <div className="card gap-3">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={18} color="var(--text-sub)" />
          <h3>Security</h3>
        </div>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-sub)', display: 'block', marginBottom: '6px' }}>PIN (4 digits)</label>
          <input
            type="password"
            maxLength={4}
            value={settings.pin}
            onChange={e => setSettings(s => ({ ...s, pin: e.target.value }))}
            style={{ width: '100%', padding: '12px' }}
            placeholder="4 digits"
          />
        </div>
      </div>

      {/* AI Recommendations */}
      <div className="card gap-3">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Bot size={18} color="var(--text-sub)" />
          <h3>AI Recommendations</h3>
        </div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>
          Claude API key enables AI-powered weight recommendations after each session. Without it, smart rule-based logic is used.
        </p>
        <div>
          <label style={{ fontSize: '0.8rem', color: 'var(--text-sub)', display: 'block', marginBottom: '6px' }}>Claude API Key</label>
          <input
            type="password"
            value={settings.apiKey}
            onChange={e => setSettings(s => ({ ...s, apiKey: e.target.value }))}
            style={{ width: '100%', padding: '12px', fontSize: '0.85rem' }}
            placeholder="sk-ant-..."
          />
        </div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.75rem' }}>Get your key at console.anthropic.com</p>
      </div>

      {/* Cloud Sync */}
      <div className="card gap-3">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Cloud size={18} color="var(--text-sub)" />
          <h3>GitHub Sync</h3>
        </div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>
          Data auto-saves to your GitHub repo after every workout. Use this to manually force a sync.
        </p>
        {lastSync && (
          <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
            Last sync: {new Date(lastSync).toLocaleString()}
          </p>
        )}
        <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
          Status: {getSyncStatus()} · {getPendingCount()} pending
        </p>
        <button
          className="btn-ghost"
          onClick={handleManualSync}
          disabled={syncing}
          style={{ opacity: syncing ? 0.6 : 1, display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <RefreshCw size={16} className={syncing ? 'spin' : ''} />
          {syncing ? 'Syncing...' : 'Force Sync to GitHub'}
        </button>
        {syncMsg && <p style={{ fontSize: '0.85rem', fontWeight: '600', color: syncMsg.includes('success') ? 'var(--primary)' : 'var(--warning)' }}>{syncMsg}</p>}
      </div>

      {/* Export / Import */}
      <div className="card gap-3">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} color="var(--text-sub)" />
          <h3>Export & Import</h3>
        </div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>
          Export your workout JSON to share with Claude for weekly analysis. Import recommendations Claude gives back.
        </p>

        <button className="btn-ghost" onClick={exportData} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={16} /> Export Workout Data (.json)
        </button>

        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleImport}
            style={{ display: 'none' }}
          />
          <button
            className="btn-ghost"
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Upload size={16} /> Import Data / Recommendations
          </button>
        </div>
        {importMsg && <p style={{ fontSize: '0.85rem', fontWeight: '600', color: importMsg.includes('success') ? 'var(--primary)' : 'var(--danger)' }}>{importMsg}</p>}
      </div>

      {/* Program Position */}
      <div className="card gap-3">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Calendar size={18} color="var(--text-sub)" />
          <h3>Program Position</h3>
        </div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>Correct your current week or day if needed.</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-sub)', display: 'block', marginBottom: '6px' }}>WEEK</label>
            <select
              value={week}
              onChange={e => setWeek(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '1rem' }}
            >
              {[1,2,3,4,5,6,7,8].map(w => <option key={w} value={w}>Week {w}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '0.8rem', color: 'var(--text-sub)', display: 'block', marginBottom: '6px' }}>NEXT DAY</label>
            <select
              value={dayIdx}
              onChange={e => setDayIdx(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: 'var(--radius-sm)', color: 'var(--text)', fontSize: '1rem' }}
            >
              <option value={0}>Day 1 – Push</option>
              <option value={1}>Day 2 – Pull</option>
              <option value={2}>Day 3 – Legs</option>
              <option value={3}>Day 4 – Push 2</option>
            </select>
          </div>
        </div>
      </div>

      <button className="btn-primary" onClick={handleSave} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <Save size={18} /> {saved ? 'Saved!' : 'Save Settings'}
      </button>

      <button
        className="btn-ghost"
        onClick={() => { logout(); onLogout(); }}
        style={{ color: 'var(--danger)', borderColor: 'var(--danger)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%' }}
      >
        <LogOut size={16} /> Log Out
      </button>
    </div>
  );
}
