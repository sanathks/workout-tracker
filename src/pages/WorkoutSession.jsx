import { useState, useEffect } from 'react';
import { workoutDays, weekConfig } from '../data/workoutPlan';
import {
  getCurrentWeek, getCurrentDayIndex,
  createSession, saveSession, advanceToNextDay,
  getRecommendedWeight, getSettings, getSessions,
} from '../utils/storage';
import { getSyncStatus } from '../utils/syncQueue';
import { generateRecommendations } from '../utils/aiRecommendations';
import { unlockAudio } from '../utils/sound';
import RestTimer from '../components/RestTimer';
import {
  SmilePlus, ThumbsUp, Flame, Skull,
  Check, CheckCircle, ChevronRight, Trophy,
  CloudUpload, RefreshCw, Clock, WifiOff, AlertTriangle, Undo2,
  Loader, Bot, ArrowLeft,
} from 'lucide-react';

const RATINGS = [
  { key: 'too_easy', label: 'Too Easy', Icon: SmilePlus, color: '#60a5fa', desc: 'Could do more weight' },
  { key: 'good',     label: 'Good',     Icon: ThumbsUp,  color: '#4ade80', desc: 'Right weight' },
  { key: 'hard',     label: 'Hard',     Icon: Flame,     color: '#fbbf24', desc: 'Barely made it' },
  { key: 'failed',   label: 'Failed',   Icon: Skull,     color: '#f87171', desc: 'Missed some reps' },
];

// Parse "60–90s" or "90–180s" → default rest seconds (use lower bound)
function parseRestSeconds(restStr) {
  const match = restStr.match(/(\d+)/);
  return match ? parseInt(match[1]) : 90;
}

export default function WorkoutSession({ dayIndex: selectedDayIndex, resumeSessionId, onComplete }) {
  const week = getCurrentWeek();

  const [session, setSession] = useState(() => {
    if (resumeSessionId) {
      const existing = getSessions().find(s => s.id === resumeSessionId);
      if (existing) return existing;
    }
    const dayIdx = selectedDayIndex != null ? selectedDayIndex : getCurrentDayIndex();
    return createSession(week, dayIdx, workoutDays[dayIdx]);
  });

  const dayIndex = session.dayIndex;
  const today = workoutDays[dayIndex];
  const wkCfg = weekConfig[week - 1];
  const restSeconds = parseRestSeconds(wkCfg.rest);

  const [activeEx, setActiveEx] = useState(() => {
    if (resumeSessionId) {
      const idx = session.exercises.findIndex(ex => !ex.rating);
      return idx >= 0 ? idx : 0;
    }
    return 0;
  });
  const [phase, setPhase] = useState('logging'); // 'logging' | 'resting' | 'summary'
  const [analyzing, setAnalyzing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [weightInputs, setWeightInputs] = useState({});

  const currentExercise = today.exercises[activeEx];
  const sessionEx = session.exercises[activeEx];

  // Unlock audio on first interaction
  useEffect(() => {
    const handler = () => { unlockAudio(); window.removeEventListener('touchstart', handler); };
    window.addEventListener('touchstart', handler, { once: true });
    return () => window.removeEventListener('touchstart', handler);
  }, []);

  useEffect(() => { saveSession(session); }, [session]);

  const updateExercise = (updates) => {
    setSession(prev => {
      const exercises = [...prev.exercises];
      exercises[activeEx] = { ...exercises[activeEx], ...updates };
      return { ...prev, exercises };
    });
  };

  const logSet = (weight, reps) => {
    const newSet = { weight: parseFloat(weight) || 0, reps: parseInt(reps) || 0 };
    const newSets = [...(sessionEx.sets || []), newSet];
    updateExercise({ sets: newSets });

    // Start rest timer if there are more sets to go
    const targetSets = wkCfg.sets;
    if (newSets.length < targetSets) {
      setPhase('resting');
    }
  };

  const removeLastSet = () => {
    const newSets = sessionEx.sets.slice(0, -1);
    updateExercise({ sets: newSets });
    if (phase === 'resting') setPhase('logging');
  };

  const setRating = (key) => {
    updateExercise({ rating: key });
  };

  const nextExercise = () => {
    if (activeEx < today.exercises.length - 1) {
      setActiveEx(prev => prev + 1);
      setPhase('logging');
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = async () => {
    const completed = { ...session, completed: true };
    setSession(completed);
    saveSession(completed);
    setPhase('summary');
    setSynced(true);

    setAnalyzing(true);
    const { apiKey } = getSettings();
    const recs = await generateRecommendations(completed, apiKey);
    setRecommendations(recs);
    setAnalyzing(false);
  };

  const handleDone = () => {
    advanceToNextDay();
    onComplete();
  };

  const getDefaultWeight = (exId) => {
    return weightInputs[exId] || getRecommendedWeight(exId) || '';
  };

  if (phase === 'summary') {
    return <Summary session={session} recommendations={recommendations} analyzing={analyzing} synced={synced} onDone={handleDone} week={week} />;
  }

  const setsLogged = sessionEx?.sets?.length || 0;
  const targetSets = wkCfg.sets;
  const allSetsLogged = setsLogged >= targetSets;

  return (
    <div className="page gap-4">
      {/* Header */}
      <div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>{today.name}</p>
        <h2 style={{ marginTop: '4px' }}>Week {week} · {wkCfg.sets}×{wkCfg.reps} · {wkCfg.rest}</h2>
      </div>

      {/* Exercise tabs */}
      <div className="scroll-h">
        {today.exercises.map((ex, i) => {
          const exSession = session.exercises[i];
          const done = exSession?.rating != null;
          return (
            <button
              key={ex.id}
              onClick={() => { setActiveEx(i); setPhase('logging'); }}
              style={{
                flexShrink: 0,
                padding: '8px 14px',
                borderRadius: '100px',
                background: i === activeEx ? 'var(--primary)' : done ? 'rgba(74,222,128,0.15)' : 'var(--surface)',
                color: i === activeEx ? '#000' : done ? 'var(--primary)' : 'var(--text-sub)',
                fontSize: '0.8rem',
                fontWeight: '700',
                border: '1.5px solid',
                borderColor: i === activeEx ? 'var(--primary)' : done ? 'var(--primary)' : 'var(--border)',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}
            >
              {done && <Check size={14} strokeWidth={3} />}{ex.code}
            </button>
          );
        })}
      </div>

      {/* Current Exercise */}
      <div className="card" style={{ borderColor: 'rgba(74,222,128,0.2)' }}>
        <div style={{ marginBottom: '16px' }}>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.75rem', marginBottom: '4px' }}>{currentExercise.code}</p>
          <h2>{currentExercise.name}</h2>
          {currentExercise.note && <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginTop: '2px' }}>{currentExercise.note}</p>}
        </div>

        {/* Sets logged */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>Sets:</span>
          {Array.from({ length: targetSets }).map((_, i) => {
            const set = sessionEx?.sets?.[i];
            return (
              <div key={i} style={{
                padding: '6px 12px',
                borderRadius: '8px',
                background: set ? 'rgba(74,222,128,0.15)' : 'var(--surface2)',
                border: `1.5px solid ${set ? 'var(--primary)' : 'var(--border)'}`,
                fontSize: '0.85rem',
                fontWeight: '600',
                color: set ? 'var(--primary)' : 'var(--text-sub)',
              }}>
                {set ? `${set.weight}kg × ${set.reps}` : `Set ${i + 1}`}
              </div>
            );
          })}
          {setsLogged > 0 && phase !== 'resting' && (
            <button onClick={removeLastSet} style={{ background: 'none', color: 'var(--danger)', fontSize: '0.8rem', padding: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Undo2 size={14} /> undo
            </button>
          )}
        </div>

        {/* Rest Timer */}
        {phase === 'resting' && (
          <RestTimer
            restSeconds={restSeconds}
            onDismiss={() => setPhase('logging')}
          />
        )}

        {/* Log Set Form */}
        {phase === 'logging' && !allSetsLogged && (
          <LogSetForm
            defaultWeight={getDefaultWeight(currentExercise.id)}
            setNum={setsLogged + 1}
            onLog={(w, r) => {
              setWeightInputs(prev => ({ ...prev, [currentExercise.id]: w }));
              logSet(w, r);
            }}
          />
        )}

        {/* Rating */}
        {phase === 'logging' && allSetsLogged && !sessionEx?.rating && (
          <div>
            <p style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px' }}>How was that?</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              {RATINGS.map(r => {
                const Icon = r.Icon;
                return (
                  <button
                    key={r.key}
                    onClick={() => setRating(r.key)}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--surface2)',
                      border: '2px solid var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '6px',
                    }}
                  >
                    <Icon size={24} color={r.color} />
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: r.color }}>{r.label}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{r.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Rated — next exercise button */}
        {phase === 'logging' && allSetsLogged && sessionEx?.rating && (
          <div>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
              marginBottom: '16px',
            }}>
              {(() => { const r = RATINGS.find(r => r.key === sessionEx.rating); const Icon = r?.Icon; return Icon ? <Icon size={24} color={r.color} /> : null; })()}
              <div>
                <p style={{ fontWeight: '600' }}>{RATINGS.find(r => r.key === sessionEx.rating)?.label}</p>
                <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>Exercise logged</p>
              </div>
              <CheckCircle size={20} color="var(--primary)" style={{ marginLeft: 'auto' }} />
            </div>
            <button className="btn-primary" onClick={nextExercise} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              {activeEx < today.exercises.length - 1 ? (
                <>Next: {today.exercises[activeEx + 1].name} <ChevronRight size={18} /></>
              ) : (
                <>Finish Workout <Trophy size={18} /></>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Progress indicator */}
      <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', textAlign: 'center' }}>
        Exercise {activeEx + 1} of {today.exercises.length}
      </p>
    </div>
  );
}

function LogSetForm({ defaultWeight, setNum, onLog }) {
  const [weight, setWeight] = useState(defaultWeight || '');
  const [reps, setReps] = useState('8');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>Set {setNum}</p>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-sub)', display: 'block', marginBottom: '6px' }}>WEIGHT (kg)</label>
          <input
            type="number"
            inputMode="decimal"
            value={weight}
            onChange={e => setWeight(e.target.value)}
            placeholder="e.g. 20"
            style={{ width: '100%', padding: '14px', fontSize: '1.2rem', fontWeight: '700', textAlign: 'center' }}
          />
        </div>
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-sub)', display: 'block', marginBottom: '6px' }}>REPS DONE</label>
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={e => setReps(e.target.value)}
            placeholder="8"
            style={{ width: '100%', padding: '14px', fontSize: '1.2rem', fontWeight: '700', textAlign: 'center' }}
          />
        </div>
      </div>
      <button
        className="btn-primary"
        onClick={() => { if (weight) onLog(weight, reps); }}
        style={{ marginTop: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
      >
        <Check size={18} strokeWidth={3} /> Log Set
      </button>
    </div>
  );
}

function SyncBanner() {
  const status = getSyncStatus();
  const config = {
    idle:    { Icon: CloudUpload,    text: 'Saved & synced to GitHub', color: 'var(--primary)', bg: 'rgba(74,222,128,0.1)' },
    syncing: { Icon: RefreshCw,      text: 'Syncing to GitHub...', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    pending: { Icon: Clock,          text: 'Saved locally — will sync when online', color: '#fbbf24', bg: 'rgba(251,191,36,0.1)' },
    offline: { Icon: WifiOff,        text: 'Saved locally — you\'re offline', color: 'var(--text-sub)', bg: 'rgba(136,136,136,0.1)' },
    error:   { Icon: AlertTriangle,  text: 'Saved locally — sync will retry', color: '#f87171', bg: 'rgba(248,113,113,0.1)' },
  };
  const c = config[status] || config.idle;
  const Icon = c.Icon;
  return (
    <div style={{
      padding: '12px 16px', borderRadius: 'var(--radius-sm)',
      background: c.bg, border: `1.5px solid ${c.color}`,
      display: 'flex', alignItems: 'center', gap: '10px',
      fontSize: '0.85rem', fontWeight: '500',
    }}>
      <Icon size={20} color={c.color} />
      <div>
        <p style={{ color: c.color }}>{c.text}</p>
        {status === 'idle' && <p style={{ color: 'var(--text-sub)', fontSize: '0.75rem', marginTop: '2px' }}>Your data is in your repo</p>}
        {status === 'offline' && <p style={{ color: 'var(--text-sub)', fontSize: '0.75rem', marginTop: '2px' }}>Will auto-sync when reconnected</p>}
      </div>
    </div>
  );
}

function Summary({ session, recommendations, analyzing, synced, onDone, week }) {
  const nextWeek = Math.min(week + 1, 8);

  return (
    <div className="page gap-4">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'center' }}>
          <Trophy size={48} color="var(--primary)" />
        </div>
        <h1>Workout Done!</h1>
        <p style={{ color: 'var(--text-sub)', marginTop: '4px' }}>{session.dayName}</p>
      </div>

      <SyncBanner />

      {/* Exercises summary */}
      <div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>YOUR SETS</p>
        <div className="gap-2">
          {session.exercises.map(ex => {
            const r = RATINGS.find(r => r.key === ex.rating);
            const Icon = r?.Icon;
            return (
              <div key={ex.exerciseId} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{ex.name}</p>
                  {Icon && <Icon size={18} color={r.color} />}
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {ex.sets.map((s, i) => (
                    <span key={i} className="tag">
                      {s.weight}kg × {s.reps}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* AI Recommendations */}
      <div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>
          NEXT SESSION TARGETS {nextWeek === 8 ? '(DELOAD WEEK)' : `— WEEK ${nextWeek}`}
        </p>
        {analyzing ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
            <Loader size={24} color="var(--text-sub)" className="spin" />
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>Analyzing your session...</p>
          </div>
        ) : recommendations ? (
          <div className="gap-2">
            {session.exercises.map(ex => {
              const rec = recommendations[ex.exerciseId];
              if (!rec) return null;
              return (
                <div key={ex.exerciseId} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: '600', fontSize: '0.9rem', marginBottom: '4px' }}>{ex.name}</p>
                      <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>{rec.reason}</p>
                    </div>
                    <div style={{ textAlign: 'right', marginLeft: '12px' }}>
                      <p style={{ color: 'var(--primary)', fontWeight: '800', fontSize: '1.2rem' }}>{rec.weight}kg</p>
                      {rec.source === 'ai' && <span style={{ fontSize: '0.65rem', color: 'var(--text-sub)' }}><Bot size={12} style={{ display: 'inline', verticalAlign: 'middle' }} /> AI</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '20px' }}>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>
              Add your Claude API key in Settings for AI-powered recommendations.
            </p>
          </div>
        )}
      </div>

      <button className="btn-primary" onClick={onDone} style={{ marginTop: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
        <ArrowLeft size={18} /> Back to Dashboard
      </button>
    </div>
  );
}
