import { registerHandler } from '../queue';
import { getStore } from '../db/store';
import type { Job } from '../db/types';
import { advanceProject, planProject, reviewProject, reviseProject } from './manager';
import { runAgentTask } from './runner';
import { log } from '../log';

let loaded = false;
export function loadHandlers() {
  if (loaded) return; loaded = true;
  registerHandler('plan_project', async (j) => planProject(j.org_id, String(j.payload.projectId)));
  registerHandler('review_project', async (j) => reviewProject(j.org_id, String(j.payload.projectId)));
  registerHandler('revise_project', async (j) => reviseProject(j.org_id, String(j.payload.projectId), String(j.payload.feedback ?? '')));
  registerHandler('run_task', async (j) => {
    const s = await getStore(); const id = String(j.payload.taskId);
    const t = await s.get('tasks', j.org_id, id);
    if (!t || t.status === 'completed' || t.status === 'cancelled' || (t.status === 'in_progress' && j.attempts === 1)) return; // duplicate job guard
    const out = await runAgentTask(j.org_id, id);
    const fresh = (await s.get('tasks', j.org_id, id))!;
    if (fresh.deliverable_type === 'content_factory' && !(await s.list('content_items', j.org_id, { task_id: id })).length) {
      const p = await s.get('projects', j.org_id, fresh.project_id);
      await s.insert('content_items', j.org_id, { client_id: p?.client_id ?? null, campaign_id: null, project_id: fresh.project_id, task_id: id, agent_id: fresh.agent_id, platform: 'instagram', type: 'draft', title: fresh.title.slice(0, 100), body: out, hashtags: [], asset_url: null, status: 'draft', is_ai_generated: true, published_via: null, published_at: null });
    }
    await advanceProject(j.org_id, fresh.project_id);
  });
}

/** Called when a job exhausted all retries: surface it as failed task/project so the CEO can retry. */
export async function onJobFailed(job: Job, msg: string) {
  const s = await getStore();
  if (job.type === 'run_task') {
    const t = await s.get('tasks', job.org_id, String(job.payload.taskId));
    if (t) { await s.update('tasks', job.org_id, t.id, { status: 'failed', error: msg }); await s.update('projects', job.org_id, t.project_id, { status: 'failed' }); const a = await s.get('ai_agents', job.org_id, t.agent_id); if (a) await s.update('ai_agents', job.org_id, a.id, { metrics: { ...a.metrics, tasks_failed: a.metrics.tasks_failed + 1 } }); }
  } else if (job.payload.projectId) await s.update('projects', job.org_id, String(job.payload.projectId), { status: 'failed' });
  await log(job.org_id, { project_id: (job.payload.projectId as string) ?? null, task_id: (job.payload.taskId as string) ?? null, level: 'error', event: 'job.failed', message: `${job.type} failed after ${job.attempts} attempts: ${msg}` });
}
