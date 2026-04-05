import { useState } from 'react';
import { getSessions } from '../utils/storage';
import { SmilePlus, ThumbsUp, Flame, Skull, ChevronDown, ChevronUp, ClipboardList } from 'lucide-react';

const RATINGS = {
  too_easy: { Icon: SmilePlus, label: 'Too Easy', color: '#60a5fa' },
  good:     { Icon: ThumbsUp,  label: 'Good',     color: '#4ade80' },
  hard:     { Icon: Flame,     label: 'Hard',     color: '#fbbf24' },
  failed:   { Icon: Skull,     label: 'Failed',   color: '#f87171' },
};

const DAY_LABELS = ['Day 1 · Push', 'Day 2 · Pull', 'Day 3 · Legs', 'Day 4 · Push'];

export default function History() {
  const sessions = getSessions().filter(s => s.completed).reverse();

  if (sessions.length === 0) {
    return (
      <div className="page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
        <ClipboardList size={48} color="var(--text-sub)" />
        <h2>No sessions yet</h2>
        <p style={{ color: 'var(--text-sub)', textAlign: 'center' }}>Complete your first workout to see your history here.</p>
      </div>
    );
  }

  return (
    <div className="page gap-4">
      <h1>History</h1>
      <p style={{ color: 'var(--text-sub)', marginTop: '-8px' }}>{sessions.length} sessions completed</p>

      <div className="gap-3">
        {sessions.map(session => (
          <SessionCard key={session.id} session={session} />
        ))}
      </div>
    </div>
  );
}

function SessionCard({ session }) {
  const [expanded, setExpanded] = useState(false);

  const ratingIcons = session.exercises
    .filter(e => e.rating && RATINGS[e.rating])
    .slice(0, 5)
    .map((e, i) => {
      const r = RATINGS[e.rating];
      const Icon = r.Icon;
      return <Icon key={i} size={16} color={r.color} />;
    });

  return (
    <div className="card" style={{ padding: '0', overflow: 'hidden' }}>
      <button
        onClick={() => setExpanded(e => !e)}
        style={{
          width: '100%', padding: '16px', background: 'none',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          textAlign: 'left', minHeight: '48px',
        }}
      >
        <div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
            <span style={{ fontWeight: '700' }}>Week {session.week}</span>
            <span className="tag tag-green" style={{ fontSize: '0.7rem' }}>
              {DAY_LABELS[session.dayIndex] || 'Unknown'}
            </span>
          </div>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)' }}>
            {new Date(session.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '4px' }}>{ratingIcons}</div>
          {expanded ? <ChevronUp size={18} color="var(--text-sub)" /> : <ChevronDown size={18} color="var(--text-sub)" />}
        </div>
      </button>

      {expanded && (
        <div style={{ borderTop: '1.5px solid var(--border)', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {session.exercises.map(ex => {
            const r = ex.rating ? RATINGS[ex.rating] : null;
            const Icon = r?.Icon;
            return (
              <div key={ex.exerciseId} style={{
                padding: '12px 14px',
                background: 'var(--surface2)',
                borderRadius: 'var(--radius-sm)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
              }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: '600', fontSize: '0.85rem', marginBottom: '6px' }}>{ex.name}</p>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    {ex.sets.map((s, i) => (
                      <span key={i} className="tag" style={{ fontSize: '0.72rem' }}>
                        {s.weight}kg × {s.reps}
                      </span>
                    ))}
                    {ex.sets.length === 0 && (
                      <span style={{ color: 'var(--text-sub)', fontSize: '0.8rem' }}>No sets logged</span>
                    )}
                  </div>
                </div>
                {Icon && (
                  <div style={{ textAlign: 'center', marginLeft: '12px', flexShrink: 0 }}>
                    <Icon size={22} color={r.color} />
                    <p style={{ fontSize: '0.65rem', color: r.color, fontWeight: '600', marginTop: '4px' }}>
                      {r.label}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
