/**
 * storage.js
 *
 * Two-layer storage:
 *   1. localStorage  — instant reads/writes, works offline
 *   2. GitHub (via /api/data Netlify function) — persistent cloud backup
 *
 * On app load  → pull from GitHub → merge into localStorage
 * On every save → write localStorage immediately + push to GitHub async
 */

const KEYS = {
  AUTH:            'wt_auth',
  SETTINGS:        'wt_settings',
  SESSIONS:        'wt_sessions',
  RECOMMENDATIONS: 'wt_recommendations',
  CURRENT_WEEK:    'wt_current_week',
  CURRENT_DAY_IDX: 'wt_current_day_index',
  LAST_SYNC:       'wt_last_sync',
};

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const isLoggedIn = () => localStorage.getItem(KEYS.AUTH) === 'true';
export const login      = () => localStorage.setItem(KEYS.AUTH, 'true');
export const logout     = () => localStorage.removeItem(KEYS.AUTH);

// ─── Settings ─────────────────────────────────────────────────────────────────
export const getSettings  = () =>
  JSON.parse(localStorage.getItem(KEYS.SETTINGS) || 'null') || { pin: '1234', apiKey: '' };
export const saveSettings = (s) =>
  localStorage.setItem(KEYS.SETTINGS, JSON.stringify(s));

// ─── Program progress ─────────────────────────────────────────────────────────
export const getCurrentWeek     = () => parseInt(localStorage.getItem(KEYS.CURRENT_WEEK)    || '1');
export const getCurrentDayIndex = () => parseInt(localStorage.getItem(KEYS.CURRENT_DAY_IDX) || '0');
export const setCurrentWeek     = (w) => localStorage.setItem(KEYS.CURRENT_WEEK,    String(w));
export const setCurrentDayIndex = (i) => localStorage.setItem(KEYS.CURRENT_DAY_IDX, String(i));

export const advanceToNextDay = () => {
  const idx  = getCurrentDayIndex();
  const week = getCurrentWeek();
  const next = (idx + 1) % 4;
  setCurrentDayIndex(next);
  if (next === 0) setCurrentWeek(Math.min(week + 1, 8));
};

// ─── Sessions ─────────────────────────────────────────────────────────────────
export const getSessions = () =>
  JSON.parse(localStorage.getItem(KEYS.SESSIONS) || '[]');

export const saveSession = (session) => {
  const sessions = getSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) sessions[idx] = session; else sessions.push(session);
  localStorage.setItem(KEYS.SESSIONS, JSON.stringify(sessions));
  pushToCloud().catch(console.warn); // async, non-blocking
};

export const createSession = (week, dayIndex, dayData) => ({
  id: `${Date.now()}`,
  date: new Date().toISOString(),
  week,
  dayIndex,
  dayName: dayData.name,
  exercises: dayData.exercises.map(ex => ({
    exerciseId: ex.id,
    name: ex.name,
    note: ex.note,
    sets: [],
    rating: null,
    recommendation: null,
  })),
  completed: false,
});

// ─── Recommendations ──────────────────────────────────────────────────────────
export const getRecommendations = () =>
  JSON.parse(localStorage.getItem(KEYS.RECOMMENDATIONS) || '{}');

export const saveRecommendation = (exerciseId, rec) => {
  const all = getRecommendations();
  all[exerciseId] = rec;
  localStorage.setItem(KEYS.RECOMMENDATIONS, JSON.stringify(all));
};

export const getLastWeightForExercise = (exerciseId) => {
  const sessions = getSessions();
  for (let i = sessions.length - 1; i >= 0; i--) {
    const ex = sessions[i].exercises?.find(e => e.exerciseId === exerciseId);
    if (ex?.sets?.length > 0) return ex.sets[ex.sets.length - 1].weight || null;
  }
  return null;
};

export const getRecommendedWeight = (exerciseId) => {
  const recs = getRecommendations();
  return recs[exerciseId]?.weight ?? getLastWeightForExercise(exerciseId);
};

// ─── Cloud sync: full snapshot ─────────────────────────────────────────────────
function buildSnapshot() {
  return {
    sessions:        getSessions(),
    recommendations: getRecommendations(),
    currentWeek:     getCurrentWeek(),
    currentDayIndex: getCurrentDayIndex(),
    lastUpdated:     new Date().toISOString(),
  };
}

function applySnapshot(snapshot) {
  if (!snapshot || typeof snapshot !== 'object') return;
  if (Array.isArray(snapshot.sessions))
    localStorage.setItem(KEYS.SESSIONS, JSON.stringify(snapshot.sessions));
  if (snapshot.recommendations && typeof snapshot.recommendations === 'object')
    localStorage.setItem(KEYS.RECOMMENDATIONS, JSON.stringify(snapshot.recommendations));
  if (snapshot.currentWeek)     setCurrentWeek(snapshot.currentWeek);
  if (snapshot.currentDayIndex != null) setCurrentDayIndex(snapshot.currentDayIndex);
}

// ─── Push to GitHub (via Netlify function) ────────────────────────────────────
export const pushToCloud = async () => {
  try {
    const res = await fetch('/api/data?type=data', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(buildSnapshot()),
    });
    if (res.ok) localStorage.setItem(KEYS.LAST_SYNC, new Date().toISOString());
  } catch (err) {
    console.warn('Cloud push failed (offline?):', err.message);
  }
};

// ─── Pull from GitHub on app load ─────────────────────────────────────────────
export const pullFromCloud = async () => {
  try {
    const res = await fetch('/api/data?type=data');
    if (!res.ok) return false;
    const snapshot = await res.json();
    if (!snapshot?.lastUpdated) return false;
    // Use cloud if it has more sessions than local
    const localCount = getSessions().length;
    const cloudCount = (snapshot.sessions || []).length;
    if (cloudCount >= localCount) applySnapshot(snapshot);
    return true;
  } catch (err) {
    console.warn('Cloud pull failed (offline?):', err.message);
    return false;
  }
};

// ─── Pull AI recommendations pushed by Cowork task ───────────────────────────
export const pullRecommendationsFromCloud = async () => {
  try {
    const res = await fetch('/api/data?type=recommendations');
    if (!res.ok) return false;
    const recs = await res.json();
    if (recs && Object.keys(recs).length > 0)
      localStorage.setItem(KEYS.RECOMMENDATIONS, JSON.stringify(recs));
    return true;
  } catch (err) {
    console.warn('Recommendations pull failed:', err.message);
    return false;
  }
};

export const getLastSyncTime = () => localStorage.getItem(KEYS.LAST_SYNC);

// ─── Export / Import ─────────────────────────────────────────────────────────
export const exportData = () => {
  const blob = new Blob([JSON.stringify(buildSnapshot(), null, 2)], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `sanath-workout-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
};

export const importData = (jsonString) => {
  try {
    const snapshot = JSON.parse(jsonString);
    applySnapshot(snapshot);
    pushToCloud().catch(console.warn);
    return true;
  } catch {
    return false;
  }
};
