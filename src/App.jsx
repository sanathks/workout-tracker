import { useState, useEffect } from 'react';
import { isLoggedIn, pullFromCloud, pullRecommendationsFromCloud } from './utils/storage';
import { Home, ClipboardList } from 'lucide-react';
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
      <SyncStatus />

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

      {screen !== 'workout' && (
        <nav className="nav-bar">
          <button
            className={`nav-item ${tab === 'dashboard' ? 'active' : ''}`}
            onClick={() => navigate('dashboard')}
          >
            <Home size={22} />
            <span>Home</span>
          </button>

          <button
            className={`nav-item ${tab === 'history' ? 'active' : ''}`}
            onClick={() => navigate('history')}
          >
            <ClipboardList size={22} />
            <span>History</span>
          </button>
        </nav>
      )}
    </div>
  );
}
