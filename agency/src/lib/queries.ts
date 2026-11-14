import { getStore } from './db/store';
import type { AiAgent, Task } from './db/types';

/** Effective status: stored status, but "waiting_approval" if the agent has pending approvals and no running task. */
export async function agentsWithState(orgId: string) {
  const s = await getStore();
  const [agents, tasks, approvals] = await Promise.all([s.list('ai_agents', orgId), s.list('tasks', orgId), s.list('approvals', orgId, { status: 'pending_approval' })]);
  const byId = new Map(tasks.map((t) => [t.id, t]));
  return agents.map((a) => {
    const cur = a.current_task_id ? byId.get(a.current_task_id) ?? null : null;
    const open = tasks.filter((t) => t.agent_id === a.id && ['ready', 'in_progress', 'blocked', 'pending'].includes(t.status) && !t.parent_task_id);
    const waiting = approvals.some((p) => p.requested_by_agent_id === a.id && p.action !== 'project_delivery') || (a.is_manager && approvals.some((p) => p.action === 'project_delivery'));
    const status: AiAgent['status'] = a.status === 'offline' ? 'offline' : a.status === 'working' ? 'working' : waiting ? 'waiting_approval' : 'available';
    return { agent: a, status, current: cur as Task | null, openTasks: open.length };
  });
}
export const fmtUsd = (n: number) => `$${n.toFixed(n < 1 ? 4 : 2)}`;
