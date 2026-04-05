import { useState } from 'react';
import { workoutDays, weekConfig } from '../data/workoutPlan';
import { getCurrentWeek, getCurrentDayIndex, getSessions, getRecommendedWeight } from '../utils/storage';

export default function Dashboard({ onStartWorkout, onNavigate }) {
  const week = getCurrentWeek();
  const dayIndex = getCurrentDayIndex();
  const today = workoutDays[dayIndex];
  const wkCfg = weekConfig[week - 1];
  const sessions = getSessions();
  const completedSessions = sessions.filter(s => s.completed).length;

  const progressPct = Math.round((completedSessions / 32) * 100); // 4 days × 8 weeks

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
          {32 - completedSessions} sessions remaining
        </p>
      </div>

      {/* Today's Workout */}
      <div>
        <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>TODAY'S WORKOUT</p>
        <div className="card" style={{ borderColor: 'rgba(74,222,128,0.3)' }}>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '16px' }}>
            <span style={{ fontSize: '2rem' }}>{today.emoji}</span>
            <div>
              <h2 style={{ lineHeight: 1.2, marginBottom: '6px' }}>{today.name}</h2>
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                <span className="tag tag-green">Week {week}</span>
                <span className="tag">{wkCfg.sets} sets × {wkCfg.reps} reps</span>
                <span className="tag">{wkCfg.rest} rest</span>
              </div>
            </div>
          </div>

          {/* Exercise list preview */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '20px' }}>
            {today.exercises.map((ex, i) => {
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

          <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '16px', textAlign: 'center' }}>
            Target RPE: <strong style={{ color: 'var(--text)' }}>{wkCfg.rpe}</strong> · Tempo: <strong style={{ color: 'var(--text)' }}>{wkCfg.tempo}</strong>
          </p>

          <button className="btn-primary" onClick={onStartWorkout}>
            Start Workout →
          </button>
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
