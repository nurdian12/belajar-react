import { getStore } from '../db/store';
import type { AiAgent, Client, Project, Task } from '../db/types';
import type { Block, Msg } from '../ai/types';
import { callLLM } from '../ai';
import { executeTool, toolsFor, type ToolCtx } from './tools';
import { retrieveMemories, remember } from '../memory';
import { log } from '../log';

const MAX_STEPS = 6;
const trunc = (s: string, n: number) => (s.length > n ? s.slice(0, n) + '\n…[dipotong]' : s);

export async function clientContext(orgId: string, clientId: string | null): Promise<string> {
  if (!clientId) return '';
  const s = await getStore();
  const c = await s.get('clients', orgId, clientId) as Client | null;
  if (!c) return '';
  const brands = await s.list('brands', orgId, { client_id: clientId });
  const docs = await s.list('client_documents', orgId, { client_id: clientId });
  return [`CLIENT: ${c.name} (${c.industry}) ${c.website}`, c.products && `Products/services: ${c.products}`, c.target_audience && `Target audience: ${c.target_audience}`, c.competitors && `Competitors: ${c.competitors}`, c.marketing_history && `Marketing history: ${c.marketing_history}`,
    ...brands.map((b) => `Brand ${b.name}: guidelines=${b.guidelines}; tone=${b.tone_of_voice}; colors=${b.colors}; keywords=${b.keywords}`),
    ...docs.slice(0, 5).map((d) => `Doc "${d.title}": ${trunc(d.content, 800)}`)].filter(Boolean).join('\n');
}

export async function recordUsage(orgId: string, a: { agentId: string | null; taskId: string | null; r: { provider: string; model: string; usage: { input: number; output: number }; costUsd: number; simulated: boolean } }) {
  const s = await getStore();
  await s.insert('ai_usage', orgId, { agent_id: a.agentId, task_id: a.taskId, provider: a.r.provider, model: a.r.model, tokens_in: a.r.usage.input, tokens_out: a.r.usage.output, cost_usd: a.r.costUsd, simulated: a.r.simulated });
  if (a.agentId) {
    const ag = await s.get('ai_agents', orgId, a.agentId);
    if (ag) await s.update('ai_agents', orgId, ag.id, { metrics: { ...ag.metrics, tokens: ag.metrics.tokens + a.r.usage.input + a.r.usage.output, cost_usd: ag.metrics.cost_usd + a.r.costUsd } });
  }
}
export async function assertBudget(orgId: string) {
  const s = await getStore();
  const org = await s.get('organizations', orgId, orgId);
  const cap = Number((org?.settings as any)?.monthly_ai_budget_usd ?? 0);
  if (!cap) return;
  const month = new Date().toISOString().slice(0, 7);
  const spent = (await s.list('ai_usage', orgId)).filter((u) => u.created_at.startsWith(month)).reduce((a, u) => a + u.cost_usd, 0);
  if (spent >= cap) throw new Error(`Monthly AI budget exceeded ($${spent.toFixed(2)} / $${cap}). Raise it in Settings.`);
}

/** The tool-calling loop shared by task execution. Each agent uses ITS OWN system prompt and tool set. */
export async function agentLoop(orgId: string, agent: AiAgent, first: string, tctx: Omit<ToolCtx, 'agent' | 'orgId'>, opts: { onlyTools?: string[]; maxSteps?: number } = {}): Promise<string> {
  const tools = toolsFor(agent, opts.onlyTools);
  const messages: Msg[] = [{ role: 'user', content: [{ type: 'text', text: first }] }];
  let finalText = '';
  for (let step = 0; step < (opts.maxSteps ?? MAX_STEPS); step++) {
    await assertBudget(orgId);
    const last = step === (opts.maxSteps ?? MAX_STEPS) - 1;
    const r = await callLLM({ system: agent.system_prompt, messages, tools: last ? undefined : tools, maxTokens: 4096, temperature: 0.7 }, { orgId });
    await recordUsage(orgId, { agentId: agent.id, taskId: tctx.task?.id ?? null, r });
    if (r.text) finalText = r.text;
    if (!r.toolCalls.length || last) break;
    messages.push({ role: 'assistant', content: [...(r.text ? [{ type: 'text', text: r.text } as Block] : []), ...r.toolCalls.map((t) => ({ type: 'tool_use', id: t.id, name: t.name, input: t.input } as Block))] });
    const results: Block[] = [];
    for (const t of r.toolCalls) {
      let out: string, err = false;
      try { out = await executeTool(t.name, t.input, { ...tctx, agent, orgId }); } catch (e) { out = `Error: ${(e as Error).message}`; err = true; }
      await log(orgId, { agent_id: agent.id, project_id: tctx.project?.id, task_id: tctx.task?.id, level: err ? 'warn' : 'info', event: 'tool.call', message: `${agent.name} → ${t.name}`, meta: { input: t.input, output: out.slice(0, 500) } });
      results.push({ type: 'tool_result', tool_use_id: t.id, content: trunc(out, 6000), is_error: err || out.startsWith('Error:') });
    }
    messages.push({ role: 'user', content: results });
  }
  return finalText;
}

/** Execute one task end-to-end: context assembly → agent loop → persist → memory → metrics. */
export async function runAgentTask(orgId: string, taskId: string, depth = 0): Promise<string> {
  const s = await getStore();
  let task = await s.get('tasks', orgId, taskId) as Task | null;
  if (!task) throw new Error('Task not found');
  const agent = await s.get('ai_agents', orgId, task.agent_id) as AiAgent;
  const project = await s.get('projects', orgId, task.project_id) as Project;
  const started = Date.now();
  task = await s.update('tasks', orgId, task.id, { status: 'in_progress', attempts: task.attempts + 1, started_at: new Date().toISOString(), error: null });
  if (depth === 0) await s.update('ai_agents', orgId, agent.id, { status: 'working', current_task_id: task.id, progress: 10, last_activity_at: new Date().toISOString() });
  await log(orgId, { agent_id: agent.id, project_id: project.id, task_id: task.id, event: 'task.started', message: `${agent.name} started "${task.title}" (attempt ${task.attempts})` });
  try {
    const deps = await s.list('task_dependencies', orgId, { task_id: task.id });
    const upstream: string[] = [];
    for (const d of deps) {
      const up = await s.get('tasks', orgId, d.depends_on_task_id); const upAgent = up && await s.get('ai_agents', orgId, up.agent_id);
      if (up?.output) upstream.push(`### ${up.title} (by ${upAgent?.name})\n${trunc(up.output, 5000)}`);
    }
    const mems = await retrieveMemories(orgId, { agentId: agent.id, clientId: project.client_id, projectId: project.id, query: `${task.title} ${task.description}`, k: 6 });
    const parts = [
      `TASK: ${task.title}`, `DESCRIPTION: ${task.description}`, `OVERALL CEO INSTRUCTION: ${project.instruction}`,
      await clientContext(orgId, project.client_id), mems.length && `RELEVANT MEMORY:\n${mems.map((m) => `- [${m.kind}] ${m.content}`).join('\n')}`,
      upstream.length && `UPSTREAM RESULTS FROM TEAMMATES (build on these, stay consistent):\n${upstream.join('\n\n')}`,
      task.feedback && `REVISION FEEDBACK (must address): ${task.feedback}`,
      'Deliver the complete result now as Markdown. Use your tools where they help (memory, content drafts, calculations, approvals).',
    ].filter(Boolean).join('\n\n');
    if (depth === 0) await s.update('ai_agents', orgId, agent.id, { progress: 35 });
    const output = await agentLoop(orgId, agent, parts, { task, project, depth });
    if (!output.trim()) throw new Error('Agent returned empty output');
    await s.update('tasks', orgId, task.id, { status: 'completed', output, completed_at: new Date().toISOString(), error: null });
    await remember(orgId, { agentId: agent.id, clientId: project.client_id, projectId: project.id, kind: 'task_history', content: `Task "${task.title}" selesai. Ringkasan: ${output.replace(/\s+/g, ' ').slice(0, 500)}`, tags: [agent.key], importance: 2 });
    const fresh = await s.get('ai_agents', orgId, agent.id) as AiAgent;
    const m = fresh.metrics; const n = m.tasks_completed + 1;
    await s.update('ai_agents', orgId, agent.id, { metrics: { ...m, tasks_completed: n, avg_seconds: Math.round((m.avg_seconds * m.tasks_completed + (Date.now() - started) / 1000) / n) }, ...(depth === 0 ? { status: 'available', current_task_id: null, progress: 100, last_activity_at: new Date().toISOString() } : {}) });
    await log(orgId, { agent_id: agent.id, project_id: project.id, task_id: task.id, event: 'task.completed', message: `${agent.name} completed "${task.title}" in ${Math.round((Date.now() - started) / 1000)}s` });
    if (project.campaign_id && depth === 0) await upsertDeliverable(orgId, project, task, output);
    return output;
  } catch (e) {
    const msg = (e as Error).message;
    await s.update('tasks', orgId, task.id, { status: depth === 0 ? 'ready' : 'failed', error: msg });
    if (depth === 0) await s.update('ai_agents', orgId, agent.id, { status: 'available', current_task_id: null, progress: 0 });
    await log(orgId, { agent_id: agent.id, project_id: project.id, task_id: task.id, level: 'error', event: 'task.error', message: `${agent.name}: ${msg}` });
    throw e;
  }
}

async function upsertDeliverable(orgId: string, project: Project, task: Task, output: string) {
  const s = await getStore();
  const ex = (await s.list('campaign_deliverables', orgId, { campaign_id: project.campaign_id!, task_id: task.id }))[0];
  if (ex) await s.update('campaign_deliverables', orgId, ex.id, { content: output, status: 'draft' });
  else await s.insert('campaign_deliverables', orgId, { campaign_id: project.campaign_id!, task_id: task.id, type: task.deliverable_type ?? '', title: task.title, content: output, status: 'draft' });
}
