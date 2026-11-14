import { getStore } from './db/store';
import type { Job } from './db/types';

export type JobType = 'plan_project' | 'run_task' | 'review_project' | 'revise_project';
type Handler = (job: Job) => Promise<void>;
const handlers = new Map<string, Handler>();
export const registerHandler = (t: JobType, h: Handler) => handlers.set(t, h);

export async function enqueue(orgId: string, type: JobType, payload: Record<string, unknown>, delayMs = 0) {
  const s = await getStore();
  const j = await s.insert('jobs', orgId, { type, payload, status: 'pending', attempts: 0, max_attempts: 3, run_at: new Date(Date.now() + delayMs).toISOString(), last_error: null, locked_at: null });
  kick();
  return j;
}

const g = globalThis as unknown as { __workerRunning?: number; __loop?: NodeJS.Timeout };
const CONCURRENCY = 3;

async function processOne(): Promise<boolean> {
  const { loadHandlers } = await import('./agents/register');
  loadHandlers();
  const s = await getStore();
  const job = await s.claimJob();
  if (!job) return false;
  const h = handlers.get(job.type);
  try {
    if (!h) throw new Error(`No handler for ${job.type}`);
    await h(job);
    await s.update('jobs', job.org_id, job.id, { status: 'done', last_error: null });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    const retry = job.attempts < job.max_attempts;
    // exponential backoff retry
    await s.update('jobs', job.org_id, job.id, { status: retry ? 'pending' : 'failed', last_error: msg, run_at: new Date(Date.now() + 2000 * 2 ** job.attempts).toISOString() });
    if (!retry && h) { const { onJobFailed } = await import('./agents/register'); await onJobFailed(job, msg).catch(() => undefined); }
  }
  return true;
}

/** Drain the queue with bounded concurrency. Safe to call from API routes (serverless cron) or in-process. */
export async function drain(maxJobs = 50): Promise<number> {
  g.__workerRunning ??= 0; let done = 0;
  const lane = async () => { while (done < maxJobs) { const did = await processOne(); if (!did) break; done++; } };
  await Promise.all(Array.from({ length: CONCURRENCY }, lane));
  return done;
}
export function kick() {
  if (g.__loop) return;
  // In-process poller (long-running Node server / dev). On serverless, call /api/worker/tick from a cron.
  g.__loop = setInterval(() => { if ((g.__workerRunning ?? 0) > 0) return; g.__workerRunning = 1; drain().catch(() => undefined).finally(() => { g.__workerRunning = 0; }); }, 1500);
  g.__loop.unref?.();
}
