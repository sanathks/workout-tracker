import { useState, useEffect } from 'react';
import { isLoggedIn, pullFromCloud, pullRecommendationsFromCloud } from './utils/storage';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import WorkoutSession from './pages/WorkoutSession';
import History from './pages/History';
import Settings from './pages/Settings';
import SyncStatus from './components/SyncStatus';

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isLoggedIn());
  const [screen, setScreen]     = useState('dashboard');
  const [tab, setTab]           = useState('dashboard');
  const [syncing, setSyncing]   = useState(false);
  const [workoutDayIndex, setWorkoutDayIndex] = useState(null);
  const [resumeSessionId, setResumeSessionId] = useState(null);

  // On login: pull latest data from GitHub (works across all devices)
  // If offline, this silently fails and we use local data
  useEffect(() => {
    if (!loggedIn) return;
    setSyncing(true);
    Promise.all([pullFromCloud(), pullRecommendationsFromCloud()])
      .finally(() => setSyncing(false));
  }, [loggedIn]);

  const handleLogin = () => {
    setLoggedIn(true);
  };

  if (!loggedIn) {
    return <Login onLogin={handleLogin} />;
  }

  const navigate = (s) => {
    setScreen(s);
    if (['dashboard', 'history', 'settings'].includes(s)) setTab(s);
  };

  return (
    <div style={{ minHeight: '100vh' }}>

      {/* Persistent sync status bar */}
      <SyncStatus />

      {/* Loading indicator (initial cloud pull) */}
      {syncing && (
        <div style={{
          position: 'fixed', top: 28, left: 0, right: 0, zIndex: 199,
          background: 'rgba(251,191,36,0.15)',
          borderBottom: '1px solid #fbbf24',
          padding: '4px 16px',
          fontSize: '0.7rem', color: '#fbbf24', fontWeight: '600',
          textAlign: 'center',
        }}>
          Loading latest data from cloud...
        </div>
      )}

      {screen === 'dashboard' && (
        <Dashboard
          onStartWorkout={(dayIdx) => { setWorkoutDayIndex(dayIdx); setResumeSessionId(null); setScreen('workout'); }}
          onResumeSession={(sessionId) => { setResumeSessionId(sessionId); setWorkoutDayIndex(null); setScreen('workout'); }}
          onNavigate={navigate}
        />
      )}
      {screen === 'workout' && (
        <WorkoutSession
          key={resumeSessionId || workoutDayIndex || 'new'}
          dayIndex={workoutDayIndex}
          resumeSessionId={resumeSessionId}
          onComplete={() => { setWorkoutDayIndex(null); setResumeSessionId(null); navigate('dashboard'); }}
        />
      )}
      {screen === 'history'  && <History />}
      {screen === 'settings' && (
        <Settings onLogout={() => { setLoggedIn(false); setScreen('dashboard'); }} />
      )}

      {/* Bottom Nav (hidden during active workout) */}
      {screen !== 'workout' && (
        <nav className="nav-bar">
          <button
            className={`nav-item ${tab === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigate('dashboard')}
          >
            <span>🏠</span>
            <span>Home</span>
          </button>

          {/* Centre FAB — start workout (uses suggested next day) */}
          <button
            onClick={() => { setWorkoutDayIndex(null); setScreen('workout'); }}
            style={{
              background: 'var(--primary)', color: '#000',
              width: '60px', height: '60px', borderRadius: '50%',
              fontSize: '1.6rem', fontWeight: '700',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginTop: '-20px',
              boxShadow: '0 4px 20px rgba(74,222,128,0.4)',
            }}
          >
            +
          </button>

          <button
            className={`nav-item ${tab === 'history' ? 'active' : ''}`}
            onClick={() => navigate('history')}
          >
            <span>📋</span>
            <span>History</span>
          </button>
        </nav>
      )}
    </div>
  );
}
