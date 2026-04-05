/**
 * syncQueue.js
 *
 * Reliable sync queue with retry, exponential backoff, and persistence.
 * Queued operations survive page refreshes and app restarts.
 *
 * Flow:
 *   1. Every data change writes to localStorage immediately (instant)
 *   2. A sync job is queued in the persistent queue
 *   3. The queue processor attempts to push to GitHub via /api/data
 *   4. On failure: retry with exponential backoff (1s, 2s, 4s, 8s... max 60s)
 *   5. On coming back online: flush the queue automatically
 */

const QUEUE_KEY = 'wt_sync_queue';
const MAX_RETRIES = 20;
const BASE_DELAY = 1000;
const MAX_DELAY = 60000;

let processing = false;
let listeners = [];

// ─── Queue persistence ─────────────────────────────────────────────────────────
function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch {
    return [];
  }
}

function setQueue(queue) {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// ─── Status listeners (for UI updates) ─────────────────────────────────────────
export function onSyncStatusChange(fn) {
  listeners.push(fn);
  return () => { listeners = listeners.filter(l => l !== fn); };
}

function notify(status) {
  listeners.forEach(fn => fn(status));
}

/**
 * Get current sync status
 * @returns {'idle'|'syncing'|'pending'|'error'|'offline'}
 */
export function getSyncStatus() {
  if (!navigator.onLine) return 'offline';
  const queue = getQueue();
  if (queue.length === 0) return 'idle';
  if (processing) return 'syncing';
  return 'pending';
}

export function getPendingCount() {
  return getQueue().length;
}

// ─── Enqueue a sync job ─────────────────────────────────────────────────────────
export function enqueueSync(type, payload) {
  const queue = getQueue();

  // Deduplicate: if there's already a pending job for the same type,
  // replace it with the latest payload (we always push full snapshots)
  const idx = queue.findIndex(j => j.type === type);
  const job = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    retries: 0,
    createdAt: new Date().toISOString(),
  };

  if (idx >= 0) {
    queue[idx] = job;
  } else {
    queue.push(job);
  }

  setQueue(queue);
  notify(getSyncStatus());

  // Try to process immediately
  processQueue();
}

// ─── Process the queue ──────────────────────────────────────────────────────────
async function processQueue() {
  if (processing) return;
  if (!navigator.onLine) return;

  const queue = getQueue();
  if (queue.length === 0) return;

  processing = true;
  notify('syncing');

  // Process jobs one at a time
  while (true) {
    const currentQueue = getQueue();
    if (currentQueue.length === 0) break;

    const job = currentQueue[0];

    try {
      await pushJob(job);

      // Success — remove from queue
      const updated = getQueue().filter(j => j.id !== job.id);
      setQueue(updated);
      notify(updated.length === 0 ? 'idle' : 'syncing');

      // Update last sync time
      localStorage.setItem('wt_last_sync', new Date().toISOString());

    } catch (err) {
      console.warn(`Sync failed for job ${job.id}:`, err.message);

      // Update retry count
      const q = getQueue();
      const jobIdx = q.findIndex(j => j.id === job.id);
      if (jobIdx >= 0) {
        q[jobIdx].retries = (q[jobIdx].retries || 0) + 1;
        q[jobIdx].lastError = err.message;
        q[jobIdx].lastAttempt = new Date().toISOString();

        if (q[jobIdx].retries >= MAX_RETRIES) {
          // Give up on this job after max retries
          console.error(`Dropping sync job ${job.id} after ${MAX_RETRIES} retries`);
          q.splice(jobIdx, 1);
        }
        setQueue(q);
      }

      // Backoff and retry later
      const delay = Math.min(BASE_DELAY * Math.pow(2, job.retries || 0), MAX_DELAY);
      notify('pending');
      processing = false;
      setTimeout(processQueue, delay);
      return;
    }
  }

  processing = false;
  notify('idle');
}

// ─── Execute a single sync job ──────────────────────────────────────────────────
async function pushJob(job) {
  const endpoint = job.type === 'recommendations'
    ? '/api/data?type=recommendations'
    : '/api/data?type=data';

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(job.payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`HTTP ${res.status}: ${text}`);
  }

  return res.json();
}

// ─── Auto-flush when coming back online ─────────────────────────────────────────
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    console.log('Back online — flushing sync queue');
    notify(getSyncStatus());
    processQueue();
  });

  window.addEventListener('offline', () => {
    notify('offline');
  });

  // Process any leftover jobs from previous session on startup
  setTimeout(processQueue, 2000);
}

// ─── Manual force sync ──────────────────────────────────────────────────────────
export async function forceSync() {
  if (!navigator.onLine) throw new Error('Offline');
  await processQueue();
  return getSyncStatus() === 'idle';
}
