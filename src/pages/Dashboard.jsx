import { useState } from 'react';
import { workoutDays, weekConfig } from '../data/workoutPlan';
import { getCurrentWeek, getCurrentDayIndex, getSessions, getRecommendedWeight } from '../utils/storage';

export default function Dashboard({ onStartWorkout, onNavigate }) {
  const week = getCurrentWeek();
  const nextDayIndex = getCurrentDayIndex();
  const wkCfg = weekConfig[week - 1];
  const sessions = getSessions();
  const completedSessions = sessions.filter(s => s.completed).length;
  const progressPct = Math.round((completedSessions / 32) * 100);

  const [expandedDay, setExpandedDay] = useState(nextDayIndex);

  return (
    <div className="page gap-4">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginBottom: '4px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h1>Hey, Sanath 👋</h1>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: '50%', width: '40px', height: '40px', fontSize: '1.1rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          ⚙️
        </button>
      </div>

      {/* Week Progress */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '2px' }}>PROGRAM PROGRESS</p>
            <h2>Week {week} of 8</h2>
          </div>
          <div style={{ textAlign: 'right' }}>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '2px' }}>SESSIONS</p>
            <h2 style={{ color: 'var(--primary)' }}>{completedSessions}</h2>
          </div>
        </div>
        <div style={{ background: 'var(--surface2)', borderRadius: '100px', height: '8px', overflow: 'hidden' }}>
          <div style={{ width: `${progressPct}%`, height: '100%', background: 'var(--primary)', borderRadius: '100px', transition: 'width 0.5s' }} />
        </div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginTop: '8px' }}>
          {wkCfg.sets} sets × {wkCfg.reps} reps · {wkCfg.rest} rest · RPE {wkCfg.rpe}
        </p>
      </div>

      {/* Workout Day Picker */}
      <div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>
          CHOOSE WORKOUT
        </p>

        <div className="gap-3">
          {workoutDays.map((day, idx) => {
            const isNext = idx === nextDayIndex;
            const isExpanded = idx === expandedDay;

            return (
              <div key={day.day} className="card" style={{
                borderColor: isNext ? 'rgba(74,222,128,0.3)' : 'var(--border)',
                padding: 0,
                overflow: 'hidden',
              }}>
                {/* Day header — always visible, tappable */}
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : idx)}
                  style={{
                    width: '100%', padding: '16px 20px', background: 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    textAlign: 'left',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <span style={{ fontSize: '1.6rem' }}>{day.emoji}</span>
                    <div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1rem' }}>{day.name}</h3>
                      </div>
                      <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginTop: '2px' }}>
                        {day.exercises.length} exercises
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {isNext && <span className="tag tag-green" style={{ fontSize: '0.7rem' }}>Next up</span>}
                    <span style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </button>

                {/* Expanded: exercise list + start button */}
                {isExpanded && (
                  <div style={{ borderTop: '1.5px solid var(--border)', padding: '16px 20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                      {day.exercises.map((ex) => {
                        const rec = getRecommendedWeight(ex.id);
                        return (
                          <div key={ex.id} style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '10px 14px',
                            background: 'var(--surface2)',
                            borderRadius: 'var(--radius-sm)',
                          }}>
                            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <span style={{ color: 'var(--text-sub)', fontWeight: '700', fontSize: '0.8rem', minWidth: '24px' }}>{ex.code}</span>
                              <div>
                                <p style={{ fontSize: '0.9rem', fontWeight: '500' }}>{ex.name}</p>
                                {ex.note && <p style={{ color: 'var(--text-sub)', fontSize: '0.75rem' }}>{ex.note}</p>}
                              </div>
                            </div>
                            {rec && (
                              <span style={{ color: 'var(--primary)', fontSize: '0.85rem', fontWeight: '700', whiteSpace: 'nowrap' }}>
                                {rec}kg
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <button className="btn-primary" onClick={() => onStartWorkout(idx)}>
                      Start {day.name.split(' — ')[0]} →
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent sessions */}
      {sessions.length > 0 && (
        <div>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>RECENT SESSIONS</p>
          <div className="gap-2">
            {sessions.slice(-3).reverse().map(s => (
              <div key={s.id} className="card" style={{ padding: '14px 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{s.dayName}</p>
                    <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>Week {s.week}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                      {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </p>
                    <span style={{ fontSize: '0.75rem', color: s.completed ? 'var(--primary)' : 'var(--warning)', fontWeight: '600' }}>
                      {s.completed ? '✓ Done' : '● In Progress'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
