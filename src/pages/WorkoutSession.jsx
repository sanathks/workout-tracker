import { useState, useEffect } from 'react';
import { workoutDays, weekConfig } from '../data/workoutPlan';
import {
  getCurrentWeek, getCurrentDayIndex,
  createSession, saveSession, advanceToNextDay,
  getRecommendedWeight, getSettings, pushToCloud,
} from '../utils/storage';
import { generateRecommendations } from '../utils/aiRecommendations';

const RATINGS = [
  { key: 'too_easy', label: 'Too Easy', emoji: '😊', color: '#60a5fa', desc: 'Could do more weight' },
  { key: 'good',     label: 'Good',     emoji: '👍', color: '#4ade80', desc: 'Right weight' },
  { key: 'hard',     label: 'Hard',     emoji: '😤', color: '#fbbf24', desc: 'Barely made it' },
  { key: 'failed',   label: 'Failed',   emoji: '💀', color: '#f87171', desc: 'Missed some reps' },
];

export default function WorkoutSession({ onComplete }) {
  const week = getCurrentWeek();
  const dayIndex = getCurrentDayIndex();
  const today = workoutDays[dayIndex];
  const wkCfg = weekConfig[week - 1];

  const [session, setSession] = useState(() => createSession(week, dayIndex, today));
  const [activeEx, setActiveEx] = useState(0);
  const [phase, setPhase] = useState('logging'); // 'logging' | 'summary'
  const [analyzing, setAnalyzing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [synced, setSynced] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [weightInputs, setWeightInputs] = useState({});

  const currentExercise = today.exercises[activeEx];
  const sessionEx = session.exercises[activeEx];

  // Persist session on each change
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
  };

  const removeLastSet = () => {
    const newSets = sessionEx.sets.slice(0, -1);
    updateExercise({ sets: newSets });
  };

  const setRating = (key) => {
    updateExercise({ rating: key });
  };

  const nextExercise = () => {
    if (activeEx < today.exercises.length - 1) {
      setActiveEx(prev => prev + 1);
    } else {
      finishWorkout();
    }
  };

  const finishWorkout = async () => {
    const completed = { ...session, completed: true };
    setSession(completed);
    saveSession(completed);
    setPhase('summary');

    // Step 1: Push to GitHub immediately so Netlify redeploys with latest data
    setSyncing(true);
    try {
      await pushToCloud();
      setSynced(true);
    } catch {
      setSynced(false);
    } finally {
      setSyncing(false);
    }

    // Step 2: Generate AI recommendations
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
    return <Summary session={session} recommendations={recommendations} analyzing={analyzing} syncing={syncing} synced={synced} onDone={handleDone} week={week} />;
  }

  const setsLogged = sessionEx?.sets?.length || 0;
  const targetSets = wkCfg.sets;
  const allSetsLogged = setsLogged >= targetSets;

  return (
    <div className="page gap-4">
      {/* Header */}
      <div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>{today.emoji} {today.name}</p>
        <h2 style={{ marginTop: '4px' }}>Week {week} · {wkCfg.sets}×{wkCfg.reps} · {wkCfg.rest}</h2>
      </div>

      {/* Exercise tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
        {today.exercises.map((ex, i) => {
          const exSession = session.exercises[i];
          const done = exSession?.rating != null;
          const partial = exSession?.sets?.length > 0;
          return (
            <button
              key={ex.id}
              onClick={() => setActiveEx(i)}
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
              }}
            >
              {done ? '✓' : ''}{ex.code}
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
          {setsLogged > 0 && (
            <button onClick={removeLastSet} style={{ background: 'none', color: 'var(--danger)', fontSize: '0.8rem', padding: '4px' }}>undo</button>
          )}
        </div>

        {/* Log Set Form */}
        {!allSetsLogged ? (
          <LogSetForm
            defaultWeight={getDefaultWeight(currentExercise.id)}
            setNum={setsLogged + 1}
            onLog={(w, r) => {
              setWeightInputs(prev => ({ ...prev, [currentExercise.id]: w }));
              logSet(w, r);
            }}
          />
        ) : (
          /* Rating */
          !sessionEx?.rating ? (
            <div>
              <p style={{ fontSize: '0.9rem', fontWeight: '600', marginBottom: '12px' }}>How was that?</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {RATINGS.map(r => (
                  <button
                    key={r.key}
                    onClick={() => setRating(r.key)}
                    style={{
                      padding: '16px',
                      borderRadius: 'var(--radius)',
                      background: 'var(--surface2)',
                      border: `2px solid var(--border)`,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'flex-start',
                      gap: '4px',
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>{r.emoji}</span>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: r.color }}>{r.label}</span>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>{r.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <div style={{
                display: 'flex', alignItems: 'center', gap: '10px',
                padding: '14px', background: 'var(--surface2)', borderRadius: 'var(--radius-sm)',
                marginBottom: '16px',
              }}>
                <span style={{ fontSize: '1.5rem' }}>{RATINGS.find(r => r.key === sessionEx.rating)?.emoji}</span>
                <div>
                  <p style={{ fontWeight: '600' }}>{RATINGS.find(r => r.key === sessionEx.rating)?.label}</p>
                  <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>Exercise logged ✓</p>
                </div>
              </div>
              <button className="btn-primary" onClick={nextExercise}>
                {activeEx < today.exercises.length - 1 ? `Next: ${today.exercises[activeEx + 1].name} →` : 'Finish Workout 🏁'}
              </button>
            </div>
          )
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
        style={{ marginTop: '4px' }}
      >
        ✓ Log Set
      </button>
    </div>
  );
}

function Summary({ session, recommendations, analyzing, syncing, synced, onDone, week }) {
  const nextWeek = Math.min(week + 1, 8);

  return (
    <div className="page gap-4">
      <div style={{ textAlign: 'center', padding: '20px 0' }}>
        <div style={{ fontSize: '3rem', marginBottom: '8px' }}>🏁</div>
        <h1>Workout Done!</h1>
        <p style={{ color: 'var(--text-sub)', marginTop: '4px' }}>{session.dayName}</p>
      </div>

      {/* GitHub Sync Status Banner */}
      <div style={{
        padding: '12px 16px',
        borderRadius: 'var(--radius-sm)',
        background: syncing ? 'rgba(251,191,36,0.1)' : synced ? 'rgba(74,222,128,0.1)' : 'rgba(248,113,113,0.1)',
        border: `1.5px solid ${syncing ? '#fbbf24' : synced ? 'var(--primary)' : '#f87171'}`,
        display: 'flex',
        alignItems: 'center',
        gap: '10px',
        fontSize: '0.85rem',
        fontWeight: '500',
      }}>
        <span style={{ fontSize: '1.2rem' }}>{syncing ? '🔄' : synced ? '✅' : '⚠️'}</span>
        <div>
          <p style={{ color: syncing ? '#fbbf24' : synced ? 'var(--primary)' : '#f87171' }}>
            {syncing ? 'Saving to GitHub...' : synced ? 'Saved to GitHub — Netlify is redeploying' : 'Saved locally (offline — will sync when connected)'}
          </p>
          {synced && <p style={{ color: 'var(--text-sub)', fontSize: '0.75rem', marginTop: '2px' }}>Your data is now in your repo ✓</p>}
        </div>
      </div>

      {/* Exercises summary */}
      <div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>YOUR SETS</p>
        <div className="gap-2">
          {session.exercises.map(ex => (
            <div key={ex.exerciseId} className="card" style={{ padding: '14px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{ex.name}</p>
                <span style={{ fontSize: '0.85rem' }}>
                  {RATINGS.find(r => r.key === ex.rating)?.emoji || '—'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                {ex.sets.map((s, i) => (
                  <span key={i} className="tag">
                    {s.weight}kg × {s.reps}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI Recommendations */}
      <div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>
          NEXT SESSION TARGETS {nextWeek === 8 ? '(DELOAD WEEK)' : `— WEEK ${nextWeek}`}
        </p>
        {analyzing ? (
          <div className="card" style={{ textAlign: 'center', padding: '30px' }}>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>🤖 Analyzing your session...</p>
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
                      {rec.source === 'ai' && <span style={{ fontSize: '0.65rem', color: 'var(--text-sub)' }}>AI</span>}
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

      <button className="btn-primary" onClick={onDone} style={{ marginTop: '8px' }}>
        Back to Dashboard
      </button>
    </div>
  );
}
