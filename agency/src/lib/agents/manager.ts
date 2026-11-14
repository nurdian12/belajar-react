import { z } from 'zod';
import { getStore } from '../db/store';
import type { AiAgent, Project, Task } from '../db/types';
import type { ToolDef } from '../ai/types';
import { callLLM } from '../ai';
import { assertBudget, clientContext, recordUsage } from './runner';
import { enqueue } from '../queue';
import { remember } from '../memory';
import { requestApproval } from '../approvals';
import { log } from '../log';

const PlanSchema = z.object({
  summary: z.string().default(''),
  tasks: z.array(z.object({
    key: z.string().min(1), title: z.string().min(3), description: z.string().min(3), agent_key: z.string(),
    depends_on: z.array(z.string()).default([]), deliverable_type: z.string().optional(), reason: z.string().optional(),
  })).min(1),
});
const ReviewSchema = z.object({ approved: z.boolean(), executive_summary: z.string().default(''), task_feedback: z.array(z.object({ task_key: z.string(), feedback: z.string() })).default([]) });
const RevisionSchema = z.object({ redo: z.array(z.object({ task_key: z.string(), feedback: z.string() })).default([]) });

const PLAN_TOOL: ToolDef = { name: 'submit_plan', description: 'Submit the task breakdown workflow.', input_schema: { type: 'object', required: ['summary', 'tasks'], properties: {
  summary: { type: 'string' },
  tasks: { type: 'array', items: { type: 'object', required: ['key', 'title', 'description', 'agent_key', 'depends_on'], properties: {
    key: { type: 'string', description: 'unique short id' }, title: { type: 'string' }, description: { type: 'string', description: 'detailed brief incl. expected deliverable' },
    agent_key: { type: 'string' }, depends_on: { type: 'array', items: { type: 'string' }, description: 'keys of tasks whose output is needed' }, deliverable_type: { type: 'string' }, reason: { type: 'string', description: 'why this agent' } } } } } } };
const REVIEW_TOOL: ToolDef = { name: 'submit_review', description: 'Submit quality review of all deliverables.', input_schema: { type: 'object', required: ['approved', 'executive_summary'], properties: {
  approved: { type: 'boolean' }, executive_summary: { type: 'string', description: 'CEO-facing executive summary (Markdown) with key outcomes, decisions needed, caveats' },
  task_feedback: { type: 'array', items: { type: 'object', required: ['task_key', 'feedback'], properties: { task_key: { type: 'string' }, feedback: { type: 'string' } } } } } } };
const REVISION_TOOL: ToolDef = { name: 'submit_revision_plan', description: 'Decide which tasks must be redone given CEO feedback.', input_schema: { type: 'object', required: ['redo'], properties: { redo: { type: 'array', items: { type: 'object', required: ['task_key', 'feedback'], properties: { task_key: { type: 'string' }, feedback: { type: 'string' } } } } } } };

async function manager(orgId: string) { return (await (await getStore()).list('ai_agents', orgId, { is_manager: true }))[0] as AiAgent; }
async function callManager(orgId: string, mgr: AiAgent, text: string, tool: ToolDef, taskId: string | null = null) {
  await assertBudget(orgId);
  const r = await callLLM({ system: mgr.system_prompt, messages: [{ role: 'user', content: [{ type: 'text', text }] }], tools: [tool], forceTool: tool.name, maxTokens: 4096, temperature: 0.3 }, { orgId });
  await recordUsage(orgId, { agentId: mgr.id, taskId, r });
  const call = r.toolCalls.find((c) => c.name === tool.name);
  if (!call) throw new Error(`Manager did not return structured output (${tool.name})`);
  return call.input;
}
const roster = async (orgId: string) => (await (await getStore()).list('ai_agents', orgId)).filter((a) => !a.is_manager && a.status !== 'offline');

/** Create a project from a CEO instruction and queue the planning job (async, not tied to the HTTP request). */
export async function submitInstruction(orgId: string, userId: string | null, instruction: string, opts: { clientId?: string | null; campaignId?: string | null; title?: string } = {}) {
  const s = await getStore();
  const mgr = await manager(orgId);
  const p = await s.insert('projects', orgId, { client_id: opts.clientId ?? null, campaign_id: opts.campaignId ?? null, title: opts.title ?? instruction.slice(0, 80), instruction, status: 'planning', plan: null, final_report: null, revision_count: 0, created_by: userId, ceo_feedback: null });
  await s.insert('agent_messages_internal', orgId, { project_id: p.id, task_id: null, from_agent_id: mgr.id, to_agent_id: mgr.id, kind: 'note', content: `CEO instruction received: ${instruction}` });
  await log(orgId, { agent_id: mgr.id, project_id: p.id, event: 'project.created', message: `CEO instruction: ${instruction.slice(0, 200)}` });
  await enqueue(orgId, 'plan_project', { projectId: p.id });
  return p;
}

export async function planProject(orgId: string, projectId: string) {
  const s = await getStore();
  const project = await s.get('projects', orgId, projectId) as Project;
  const mgr = await manager(orgId); const team = await roster(orgId);
  await s.update('ai_agents', orgId, mgr.id, { status: 'working', progress: 20, last_activity_at: new Date().toISOString() });
  try {
    const skills = await s.list('agent_skills', orgId);
    const prompt = [`CEO INSTRUCTION: ${project.instruction}`, await clientContext(orgId, project.client_id),
      `TEAM (use exactly these agent_key values):\n${team.map((a) => `- ${a.key}: ${a.name}, ${a.job_title}. Skills: ${skills.filter((k) => k.agent_id === a.id).map((k) => k.skill).join(', ')}`).join('\n')}`,
      'Create the workflow now with submit_plan.'].filter(Boolean).join('\n\n');
    const raw = PlanSchema.parse(await callManager(orgId, mgr, prompt, PLAN_TOOL));
    const byKey = new Map(team.map((a) => [a.key, a]));
    const seen = new Set<string>(); const tasks = raw.tasks.filter((t) => {
      if (!byKey.has(t.agent_key) || seen.has(t.key)) { void log(orgId, { project_id: projectId, level: 'warn', event: 'plan.dropped', message: `Dropped task ${t.key} (unknown agent or duplicate key)` }); return false; }
      seen.add(t.key); return true;
    });
    if (!tasks.length) throw new Error('Plan contained no valid tasks');
    // sanitize dependencies: unknown keys removed; cycles broken (Kahn)
    const deps = new Map(tasks.map((t) => [t.key, t.depends_on.filter((d) => seen.has(d) && d !== t.key)]));
    const done = new Set<string>(); let progress = true;
    while (progress) { progress = false; for (const [k, d] of deps) if (!done.has(k) && d.every((x) => done.has(x))) { done.add(k); progress = true; } }
    for (const [k] of deps) if (!done.has(k)) { deps.set(k, []); await log(orgId, { project_id: projectId, level: 'warn', event: 'plan.cycle', message: `Cycle detected at ${k}; dependencies cleared` }); }

    const rows = new Map<string, Task>();
    for (const t of tasks) {
      const row = await s.insert('tasks', orgId, { project_id: projectId, agent_id: byKey.get(t.agent_key)!.id, parent_task_id: null, key: t.key, title: t.title, description: t.description, status: deps.get(t.key)!.length ? 'blocked' : 'pending', output: null, error: null, attempts: 0, max_attempts: 3, feedback: null, deliverable_type: t.deliverable_type ?? t.agent_key, started_at: null, completed_at: null });
      rows.set(t.key, row);
      await s.insert('agent_assignments', orgId, { task_id: row.id, agent_id: row.agent_id, assigned_by_agent_id: mgr.id, reason: t.reason ?? `Skill match: ${byKey.get(t.agent_key)!.job_title}` });
      await s.insert('agent_messages_internal', orgId, { project_id: projectId, task_id: row.id, from_agent_id: mgr.id, to_agent_id: row.agent_id, kind: 'delegation', content: `${t.title}\n${t.description}` });
    }
    for (const t of tasks) for (const d of deps.get(t.key)!) await s.insert('task_dependencies', orgId, { task_id: rows.get(t.key)!.id, depends_on_task_id: rows.get(d)!.id });
    await s.update('projects', orgId, projectId, { status: 'in_progress', plan: { summary: raw.summary, tasks: tasks.map((t) => ({ ...t, depends_on: deps.get(t.key) })), auto_revisions: 0 } });
    await log(orgId, { agent_id: mgr.id, project_id: projectId, event: 'project.planned', message: `Manager created ${tasks.length} tasks: ${raw.summary.slice(0, 200)}` });
    await advanceProject(orgId, projectId);
  } finally { await s.update('ai_agents', orgId, mgr.id, { status: 'available', progress: 0 }); }
}

// Serialise per-project advancement so concurrent task completions can't double-enqueue.
const locks = new Map<string, Promise<unknown>>();
export function advanceProject(orgId: string, projectId: string): Promise<void> {
  const prev = locks.get(projectId) ?? Promise.resolve();
  const next = prev.catch(() => undefined).then(() => doAdvance(orgId, projectId));
  locks.set(projectId, next); return next.finally(() => { if (locks.get(projectId) === next) locks.delete(projectId); });
}
async function doAdvance(orgId: string, projectId: string) {
  const s = await getStore();
  const project = await s.get('projects', orgId, projectId); if (!project || !['in_progress', 'revision'].includes(project.status)) return;
  const tasks = (await s.list('tasks', orgId, { project_id: projectId })).filter((t) => !t.parent_task_id);
  const deps = await s.list('task_dependencies', orgId);
  const byId = new Map(tasks.map((t) => [t.id, t]));
  for (const t of tasks) {
    if (!['pending', 'blocked'].includes(t.status)) continue;
    const mine = deps.filter((d) => d.task_id === t.id);
    if (mine.every((d) => byId.get(d.depends_on_task_id)?.status === 'completed')) {
      await s.update('tasks', orgId, t.id, { status: 'ready' });
      await enqueue(orgId, 'run_task', { taskId: t.id });
    }
  }
  if (tasks.length && tasks.every((t) => t.status === 'completed')) {
    await s.update('projects', orgId, projectId, { status: 'review' });
    await enqueue(orgId, 'review_project', { projectId });
  }
}

/** Reset tasks (and everything downstream of them) so they are re-executed with feedback. */
export async function resetTasks(orgId: string, projectId: string, feedback: Record<string, string>) {
  const s = await getStore();
  const tasks = (await s.list('tasks', orgId, { project_id: projectId })).filter((t) => !t.parent_task_id);
  const deps = await s.list('task_dependencies', orgId);
  const reset = new Set(Object.keys(feedback));
  let grew = true; while (grew) { grew = false; for (const d of deps) if (reset.has(d.depends_on_task_id) && !reset.has(d.task_id)) { reset.add(d.task_id); grew = true; } }
  for (const t of tasks) if (reset.has(t.id)) await s.update('tasks', orgId, t.id, { status: 'pending', attempts: 0, error: null, feedback: feedback[t.id] ?? t.feedback ?? 'Upstream work was revised; update accordingly.', completed_at: null });
}

export async function reviewProject(orgId: string, projectId: string) {
  const s = await getStore();
  const project = await s.get('projects', orgId, projectId) as Project;
  if (project.status !== 'review') return;
  const mgr = await manager(orgId);
  const tasks = (await s.list('tasks', orgId, { project_id: projectId })).filter((t) => !t.parent_task_id);
  const agents = new Map((await s.list('ai_agents', orgId)).map((a) => [a.id, a]));
  const body = tasks.map((t) => `## [${t.key}] ${t.title} — ${agents.get(t.agent_id)?.name}\n${(t.output ?? '').slice(0, 3500)}`).join('\n\n');
  const prompt = `CEO INSTRUCTION: ${project.instruction}\n\n${await clientContext(orgId, project.client_id)}\n\nDELIVERABLES TO REVIEW:\n${body}\n\nReview quality strictly and call submit_review. Set approved=false only if specific tasks must be redone, and list task_feedback with their task_key.`;
  const rv = ReviewSchema.parse(await callManager(orgId, mgr, prompt, REVIEW_TOOL));
  const plan = (project.plan ?? {}) as { auto_revisions?: number } & Record<string, unknown>;
  const valid = rv.task_feedback.filter((f) => tasks.some((t) => t.key === f.task_key));
  if (!rv.approved && valid.length && (plan.auto_revisions ?? 0) < 1) {
    const fb: Record<string, string> = {}; for (const f of valid) fb[tasks.find((t) => t.key === f.task_key)!.id] = f.feedback;
    await resetTasks(orgId, projectId, fb);
    await s.update('projects', orgId, projectId, { status: 'in_progress', plan: { ...plan, auto_revisions: (plan.auto_revisions ?? 0) + 1 } });
    for (const f of valid) await s.insert('agent_messages_internal', orgId, { project_id: projectId, task_id: tasks.find((t) => t.key === f.task_key)!.id, from_agent_id: mgr.id, to_agent_id: tasks.find((t) => t.key === f.task_key)!.agent_id, kind: 'review', content: `Revisi diminta: ${f.feedback}` });
    await log(orgId, { agent_id: mgr.id, project_id: projectId, event: 'review.revise', message: `Quality review requested revisions on ${valid.length} task(s)` });
    return advanceProject(orgId, projectId);
  }
  const report = [`# Laporan Akhir: ${project.title}`, `## Ringkasan Eksekutif\n${rv.executive_summary || '_(tidak ada ringkasan)_'}`, ...(rv.approved ? [] : [`> ⚠️ Review kualitas menyisakan catatan: ${rv.task_feedback.map((f) => `${f.task_key}: ${f.feedback}`).join('; ')}`]),
    `## Hasil per Divisi`, ...tasks.map((t) => `### ${t.title}\n_Oleh ${agents.get(t.agent_id)?.name} — ${agents.get(t.agent_id)?.job_title}_\n\n${t.output ?? ''}`)].join('\n\n');
  await s.update('projects', orgId, projectId, { status: 'awaiting_ceo', final_report: report });
  await requestApproval(orgId, { action: 'project_delivery', title: `Hasil proyek: ${project.title}`, description: rv.executive_summary.slice(0, 500), agentId: mgr.id, projectId, refTable: 'projects', refId: projectId });
  await log(orgId, { agent_id: mgr.id, project_id: projectId, event: 'project.delivered', message: 'Final report sent to CEO for approval' });
}

/** CEO verdict on delivery: approve or request revision (Manager decides which tasks to redo). */
export async function ceoDecision(orgId: string, projectId: string, decision: 'approve' | 'revise', feedback?: string) {
  const s = await getStore();
  const project = await s.get('projects', orgId, projectId) as Project;
  if (decision === 'approve') {
    await s.update('projects', orgId, projectId, { status: 'completed' });
    if (project.campaign_id) {
      await s.update('campaigns', orgId, project.campaign_id, { status: 'active' }).catch(() => undefined);
      for (const d of await s.list('campaign_deliverables', orgId, { campaign_id: project.campaign_id })) await s.update('campaign_deliverables', orgId, d.id, { status: 'approved' });
    }
    return log(orgId, { project_id: projectId, event: 'project.approved', message: 'CEO approved project deliverables' });
  }
  await s.update('projects', orgId, projectId, { status: 'revision', ceo_feedback: feedback ?? '', revision_count: project.revision_count + 1 });
  await enqueue(orgId, 'revise_project', { projectId, feedback: feedback ?? '' });
}

export async function reviseProject(orgId: string, projectId: string, feedback: string) {
  const s = await getStore();
  const mgr = await manager(orgId);
  const tasks = (await s.list('tasks', orgId, { project_id: projectId })).filter((t) => !t.parent_task_id);
  const prompt = `The CEO reviewed the deliverables and requested changes.\nCEO FEEDBACK: ${feedback}\n\nTASKS:\n${tasks.map((t) => `- [${t.key}] ${t.title}`).join('\n')}\n\nChoose which tasks must be redone (dependants are re-run automatically) with precise feedback each, via submit_revision_plan.`;
  const plan = RevisionSchema.parse(await callManager(orgId, mgr, prompt, REVISION_TOOL));
  const fb: Record<string, string> = {};
  for (const r of plan.redo) { const t = tasks.find((x) => x.key === r.task_key); if (t) fb[t.id] = `CEO feedback: ${feedback}. ${r.feedback}`; }
  if (!Object.keys(fb).length) for (const t of tasks) fb[t.id] = `CEO feedback: ${feedback}`;
  await resetTasks(orgId, projectId, fb);
  await s.update('projects', orgId, projectId, { status: 'in_progress' });
  for (const t of tasks) if (fb[t.id]) await remember(orgId, { agentId: t.agent_id, clientId: (await s.get('projects', orgId, projectId))?.client_id ?? null, kind: 'lesson', content: `Feedback CEO atas "${t.title}": ${feedback}`, importance: 4, tags: ['ceo-feedback'] });
  await log(orgId, { agent_id: mgr.id, project_id: projectId, event: 'project.revision', message: `Revising ${Object.keys(fb).length} task(s) per CEO feedback` });
  await advanceProject(orgId, projectId);
}

/** Retry failed tasks of a project (manual button). */
export async function retryFailed(orgId: string, projectId: string) {
  const s = await getStore();
  const failed = (await s.list('tasks', orgId, { project_id: projectId, status: 'failed' })).filter((t) => !t.parent_task_id);
  await resetTasks(orgId, projectId, Object.fromEntries(failed.map((t) => [t.id, t.feedback ?? ''])));
  for (const t of failed) await s.update('tasks', orgId, t.id, { feedback: t.feedback });
  await s.update('projects', orgId, projectId, { status: 'in_progress' });
  await advanceProject(orgId, projectId);
}
