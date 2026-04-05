import { useState } from 'react';
import { workoutDays, weekConfig } from '../data/workoutPlan';
import { getCurrentWeek, getCurrentDayIndex, getSessions, getRecommendedWeight, deleteSession } from '../utils/storage';
import {
  Dumbbell, ArrowDownToLine, Footprints, Flame,
  ChevronDown, ChevronUp, Settings, Trash2, Play, RotateCcw,
} from 'lucide-react';

const DAY_ICONS = {
  'dumbbell': Dumbbell,
  'arrow-down-to-line': ArrowDownToLine,
  'footprints': Footprints,
  'flame': Flame,
};

export default function Dashboard({ onStartWorkout, onResumeSession, onNavigate }) {
  const week = getCurrentWeek();
  const nextDayIndex = getCurrentDayIndex();
  const wkCfg = weekConfig[week - 1];
  const sessions = getSessions();
  const completedSessions = sessions.filter(s => s.completed).length;
  const progressPct = Math.round((completedSessions / 32) * 100);

  const [expandedDay, setExpandedDay] = useState(nextDayIndex);
  const [, forceUpdate] = useState(0);
  const refresh = () => forceUpdate(n => n + 1);

  const handleDelete = (id, e) => {
    e.stopPropagation();
    if (confirm('Delete this session?')) {
      deleteSession(id);
      refresh();
    }
  };

  return (
    <div className="page gap-4">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem', marginBottom: '4px' }}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h1>Hey, Sanath</h1>
        </div>
        <button
          onClick={() => onNavigate('settings')}
          style={{ background: 'var(--surface2)', border: '1.5px solid var(--border)', borderRadius: '50%', width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          <Settings size={18} color="var(--text-sub)" />
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
            const DayIcon = DAY_ICONS[day.icon] || Dumbbell;

            return (
              <div key={day.day} className="card" style={{
                borderColor: isNext ? 'rgba(74,222,128,0.3)' : 'var(--border)',
                padding: 0,
                overflow: 'hidden',
              }}>
                <button
                  onClick={() => setExpandedDay(isExpanded ? null : idx)}
                  style={{
                    width: '100%', padding: '16px 20px', background: 'none',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    textAlign: 'left', minHeight: '48px', color: 'var(--text)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: isNext ? 'rgba(74,222,128,0.15)' : 'var(--surface2)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      <DayIcon size={20} color={isNext ? 'var(--primary)' : 'var(--text-sub)'} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.95rem' }}>{day.name}</h3>
                      <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginTop: '2px' }}>
                        {day.exercises.length} exercises
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    {isNext && <span className="tag tag-green" style={{ fontSize: '0.7rem' }}>Next up</span>}
                    {isExpanded ? <ChevronUp size={18} color="var(--text-sub)" /> : <ChevronDown size={18} color="var(--text-sub)" />}
                  </div>
                </button>

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

                    <button className="btn-primary" onClick={() => onStartWorkout(idx)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <Play size={18} /> Start {day.name.split(' — ')[0]}
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* In-progress sessions */}
      {(() => {
        const inProgress = sessions.filter(s => !s.completed);
        if (inProgress.length === 0) return null;
        return (
          <div>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>IN PROGRESS</p>
            <div className="gap-2">
              {inProgress.reverse().map(s => {
                const doneCount = s.exercises.filter(e => e.rating).length;
                const totalCount = s.exercises.length;
                return (
                  <button
                    key={s.id}
                    className="card"
                    onClick={() => onResumeSession(s.id)}
                    style={{ padding: '14px 16px', width: '100%', textAlign: 'left', borderColor: 'rgba(251,191,36,0.3)', cursor: 'pointer' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{s.dayName}</p>
                        <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>
                          Week {s.week} · {doneCount}/{totalCount} exercises
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button
                          onClick={(e) => handleDelete(s.id, e)}
                          style={{ background: 'none', color: 'var(--danger)', padding: '6px', opacity: 0.7 }}
                        >
                          <Trash2 size={16} />
                        </button>
                        <span style={{ fontSize: '0.75rem', color: 'var(--warning)', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <RotateCcw size={14} /> Resume
                        </span>
                      </div>
                    </div>
                    <div style={{ marginTop: '10px', background: 'var(--surface2)', borderRadius: '100px', height: '4px', overflow: 'hidden' }}>
                      <div style={{ width: `${(doneCount / totalCount) * 100}%`, height: '100%', background: 'var(--warning)', borderRadius: '100px' }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Recent completed sessions */}
      {(() => {
        const completed = sessions.filter(s => s.completed);
        if (completed.length === 0) return null;
        return (
          <div>
            <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem', marginBottom: '12px', fontWeight: '600', letterSpacing: '0.05em' }}>RECENT SESSIONS</p>
            <div className="gap-2">
              {completed.slice(-3).reverse().map(s => (
                <div key={s.id} className="card" style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ fontWeight: '600', fontSize: '0.9rem' }}>{s.dayName}</p>
                      <p style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>Week {s.week}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ textAlign: 'right' }}>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                          {new Date(s.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </p>
                        <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: '600' }}>
                          Done
                        </span>
                      </div>
                      <button
                        onClick={(e) => handleDelete(s.id, e)}
                        style={{ background: 'none', color: 'var(--danger)', padding: '6px', opacity: 0.4 }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}
