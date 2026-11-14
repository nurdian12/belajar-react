import { getStore } from './db/store';
export async function log(orgId: string, e: { agent_id?: string | null; project_id?: string | null; task_id?: string | null; level?: 'info' | 'warn' | 'error'; event: string; message: string; meta?: Record<string, unknown> }) {
  const s = await getStore();
  await s.insert('activity_logs', orgId, { agent_id: e.agent_id ?? null, project_id: e.project_id ?? null, task_id: e.task_id ?? null, level: e.level ?? 'info', event: e.event, message: e.message, meta: e.meta ?? {} }).catch(() => undefined);
}
