import { z } from 'zod';
import { getStore } from '../db/store';
import type { AiAgent, Project, Task } from '../db/types';
import type { ToolDef } from '../ai/types';
import { retrieveMemories, remember } from '../memory';
import { requestApproval } from '../approvals';
import { saveAsset } from '../storage';
import { log } from '../log';

export interface ToolCtx { orgId: string; agent: AiAgent; task: Task | null; project: Project | null; depth: number }
const obj = (properties: Record<string, unknown>, required: string[] = []) => ({ type: 'object', properties, required });
const str = (description: string) => ({ type: 'string', description });

export const TOOL_DEFS: Record<string, ToolDef> = {
  search_memory: { name: 'search_memory', description: 'Search your memory, shared company knowledge and (if in a client project) this client\'s knowledge.', input_schema: obj({ query: str('what to look for') }, ['query']) },
  save_memory: { name: 'save_memory', description: 'Persist a durable lesson or fact for future work.', input_schema: obj({ content: str('the fact/lesson'), kind: { type: 'string', enum: ['lesson', 'project', 'client'] }, tags: { type: 'array', items: { type: 'string' } } }, ['content', 'kind']) },
  delegate_task: { name: 'delegate_task', description: 'Ask another AI employee (by agent_key) to do a sub-task now and return the result. Use sparingly.', input_schema: obj({ agent_key: str('target agent key, e.g. copywriter, designer, analyst'), title: str('short title'), instructions: str('precise instructions + needed context') }, ['agent_key', 'title', 'instructions']) },
  send_message: { name: 'send_message', description: 'Send an internal note/handoff to another employee (no reply awaited).', input_schema: obj({ to_agent_key: str('target agent key'), message: str('message') , kind: { type: 'string', enum: ['request_help', 'handoff', 'note'] } }, ['to_agent_key', 'message']) },
  create_content_item: { name: 'create_content_item', description: 'Save a finished piece of content as a DRAFT (nothing is published).', input_schema: obj({ platform: { type: 'string', enum: ['instagram', 'tiktok', 'facebook', 'youtube', 'linkedin', 'website'] }, type: str('post, carousel, reel_script, video_script, caption, hook, ad_copy, blog, email, creative_brief, idea'), title: str('title'), body: str('full content'), hashtags: { type: 'array', items: { type: 'string' } } }, ['platform', 'type', 'title', 'body']) },
  schedule_content: { name: 'schedule_content', description: 'Add a (draft) entry to the content calendar. Does not publish.', input_schema: obj({ platform: str('platform'), title: str('title'), scheduled_for: str('ISO 8601 date-time'), content_item_id: str('optional content item id') }, ['platform', 'title', 'scheduled_for']) },
  request_approval: { name: 'request_approval', description: 'Request CEO approval for an external-impact action. You cannot execute the action yourself.', input_schema: obj({ action: { type: 'string', enum: ['publish_content', 'send_email', 'send_prospect_message', 'run_ads', 'use_ad_budget', 'change_public_info'] }, title: str('title'), description: str('exactly what would happen, with details/budget') }, ['action', 'title', 'description']) },
  generate_image: { name: 'generate_image', description: 'Generate an image via the configured image provider. Fails if none configured.', input_schema: obj({ prompt: str('detailed image prompt'), size: { type: 'string', enum: ['1024x1024', '1024x1536', '1536x1024'] } }, ['prompt']) },
  generate_video: { name: 'generate_video', description: 'Generate a video via a configured video provider. Fails if none configured.', input_schema: obj({ prompt: str('video prompt') }, ['prompt']) },
  calculate_budget_split: { name: 'calculate_budget_split', description: 'Split a budget by weights; returns exact amounts.', input_schema: obj({ total_budget: { type: 'number' }, allocations: { type: 'array', items: obj({ name: str('bucket'), weight: { type: 'number' } }, ['name', 'weight']) } }, ['total_budget', 'allocations']) },
  calculate_roi: { name: 'calculate_roi', description: 'Compute ROI %, ROAS and profit from revenue and cost.', input_schema: obj({ revenue: { type: 'number' }, cost: { type: 'number' } }, ['revenue', 'cost']) },
  calculate_kpis: { name: 'calculate_kpis', description: 'Compute CTR, CPC, CVR, CPA, CPM, ROAS from raw numbers.', input_schema: obj({ impressions: { type: 'number' }, clicks: { type: 'number' }, conversions: { type: 'number' }, spend: { type: 'number' }, revenue: { type: 'number' } }) },
};
export const toolsFor = (agent: AiAgent, only?: string[]): ToolDef[] => agent.tools.filter((t) => TOOL_DEFS[t] && (!only || only.includes(t))).map((t) => TOOL_DEFS[t]);

const num = (v: unknown) => (typeof v === 'number' && isFinite(v) ? v : 0);
const r2 = (n: number) => Math.round(n * 100) / 100;

export async function executeTool(name: string, input: Record<string, any>, c: ToolCtx): Promise<string> {
  const s = await getStore();
  if (!c.agent.tools.includes(name)) throw new Error(`Tool ${name} is not assigned to ${c.agent.name}`);
  switch (name) {
    case 'search_memory': {
      const ms = await retrieveMemories(c.orgId, { agentId: c.agent.id, clientId: c.project?.client_id, projectId: c.project?.id, query: String(input.query ?? ''), k: 8 });
      return ms.length ? ms.map((m) => `- [${m.kind}] ${m.content}`).join('\n') : 'No relevant memories found.';
    }
    case 'save_memory': {
      const z1 = z.object({ content: z.string().min(3), kind: z.enum(['lesson', 'project', 'client']), tags: z.array(z.string()).optional() }).parse(input);
      if (z1.kind === 'client' && !c.project?.client_id) return 'Error: no client attached to this project.';
      await remember(c.orgId, { agentId: c.agent.id, clientId: z1.kind === 'client' ? c.project?.client_id : c.project?.client_id ?? null, projectId: z1.kind === 'project' ? c.project?.id : null, kind: z1.kind, content: z1.content, tags: z1.tags });
      return 'Saved.';
    }
    case 'delegate_task': {
      if (c.depth >= 2) return 'Error: delegation depth limit reached; do the work yourself.';
      const target = (await s.list('ai_agents', c.orgId, { key: String(input.agent_key) }))[0];
      if (!target || target.is_manager) return `Error: unknown or non-delegable agent_key "${input.agent_key}".`;
      if (target.id === c.agent.id) return 'Error: cannot delegate to yourself.';
      if (!c.project || !c.task) return 'Error: delegation is only available inside a project task.';
      const child = await s.insert('tasks', c.orgId, { project_id: c.project.id, agent_id: target.id, parent_task_id: c.task.id, key: `sub-${Date.now()}`, title: String(input.title), description: String(input.instructions), status: 'ready', output: null, error: null, attempts: 0, max_attempts: 2, feedback: null, deliverable_type: 'delegated', started_at: null, completed_at: null });
      await s.insert('agent_assignments', c.orgId, { task_id: child.id, agent_id: target.id, assigned_by_agent_id: c.agent.id, reason: `Delegated by ${c.agent.name}` });
      await s.insert('agent_messages_internal', c.orgId, { project_id: c.project.id, task_id: child.id, from_agent_id: c.agent.id, to_agent_id: target.id, kind: 'delegation', content: `${input.title}: ${input.instructions}` });
      await log(c.orgId, { agent_id: c.agent.id, project_id: c.project.id, task_id: c.task.id, event: 'task.delegated', message: `${c.agent.name} → ${target.name}: ${input.title}` });
      const { runAgentTask } = await import('./runner');
      try {
        const out = await runAgentTask(c.orgId, child.id, c.depth + 1);
        await s.insert('agent_messages_internal', c.orgId, { project_id: c.project.id, task_id: child.id, from_agent_id: target.id, to_agent_id: c.agent.id, kind: 'handoff', content: out.slice(0, 1500) });
        return `Hasil dari ${target.name} (${target.job_title}):\n${out}`;
      } catch (e) { return `Error: delegated task failed: ${(e as Error).message}`; }
    }
    case 'send_message': {
      const target = (await s.list('ai_agents', c.orgId, { key: String(input.to_agent_key) }))[0];
      if (!target) return `Error: unknown agent "${input.to_agent_key}".`;
      await s.insert('agent_messages_internal', c.orgId, { project_id: c.project?.id ?? null, task_id: c.task?.id ?? null, from_agent_id: c.agent.id, to_agent_id: target.id, kind: (['request_help', 'handoff', 'note'].includes(input.kind) ? input.kind : 'note') as 'note', content: String(input.message) });
      return `Message delivered to ${target.name}.`;
    }
    case 'create_content_item': {
      const v = z.object({ platform: z.string(), type: z.string(), title: z.string(), body: z.string(), hashtags: z.array(z.string()).optional() }).parse(input);
      const item = await s.insert('content_items', c.orgId, { client_id: c.project?.client_id ?? null, campaign_id: c.project?.campaign_id ?? null, project_id: c.project?.id ?? null, task_id: c.task?.id ?? null, agent_id: c.agent.id, platform: v.platform, type: v.type, title: v.title, body: v.body, hashtags: v.hashtags ?? [], asset_url: null, status: 'draft', is_ai_generated: true, published_via: null, published_at: null });
      return `Content saved as DRAFT (id ${item.id}). Not published.`;
    }
    case 'schedule_content': {
      const v = z.object({ platform: z.string(), title: z.string(), scheduled_for: z.string(), content_item_id: z.string().optional() }).parse(input);
      const d = new Date(v.scheduled_for); if (isNaN(+d)) return 'Error: invalid scheduled_for date.';
      await s.insert('content_calendar', c.orgId, { content_item_id: v.content_item_id ?? null, campaign_id: c.project?.campaign_id ?? null, client_id: c.project?.client_id ?? null, platform: v.platform, title: v.title, scheduled_for: d.toISOString(), status: 'draft' });
      return 'Calendar entry added as draft (not published).';
    }
    case 'request_approval': {
      const ap = await requestApproval(c.orgId, { action: input.action, title: String(input.title), description: String(input.description), agentId: c.agent.id, projectId: c.project?.id });
      return ap.status === 'pending_approval' ? `Approval request #${ap.id.slice(0, 8)} is PENDING CEO decision. The action has NOT been executed.` : `Policy auto-approved, but execution still requires a configured integration; the action has NOT been executed.`;
    }
    case 'generate_image': {
      if (!process.env.OPENAI_API_KEY) return 'Error: image provider not configured (set OPENAI_API_KEY). No image was generated.';
      const res = await fetch('https://api.openai.com/v1/images/generations', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: JSON.stringify({ model: process.env.OPENAI_IMAGE_MODEL || 'gpt-image-1', prompt: String(input.prompt).slice(0, 3000), size: input.size || '1024x1024' }) });
      if (!res.ok) return `Error: image API ${res.status}: ${(await res.text()).slice(0, 200)}`;
      const j: any = await res.json(); const b64 = j.data?.[0]?.b64_json;
      if (!b64) return 'Error: image API returned no image.';
      const url = await saveAsset(c.orgId, `${Date.now()}-${c.agent.key}.png`, Buffer.from(b64, 'base64'));
      await s.insert('content_items', c.orgId, { client_id: c.project?.client_id ?? null, campaign_id: c.project?.campaign_id ?? null, project_id: c.project?.id ?? null, task_id: c.task?.id ?? null, agent_id: c.agent.id, platform: 'instagram', type: 'image_asset', title: String(input.prompt).slice(0, 80), body: String(input.prompt), hashtags: [], asset_url: url, status: 'draft', is_ai_generated: true, published_via: null, published_at: null });
      return `Image generated and stored as draft asset: ${url}`;
    }
    case 'generate_video': return 'Error: no video generation provider is configured. No video was generated; deliver the script/brief only.';
    case 'calculate_budget_split': {
      const v = z.object({ total_budget: z.number(), allocations: z.array(z.object({ name: z.string(), weight: z.number() })) }).parse(input);
      const w = v.allocations.reduce((a, b) => a + b.weight, 0) || 1;
      return JSON.stringify(v.allocations.map((a) => ({ name: a.name, percent: r2((a.weight / w) * 100), amount: r2((a.weight / w) * v.total_budget) })));
    }
    case 'calculate_roi': { const rev = num(input.revenue), cost = num(input.cost); return JSON.stringify({ profit: r2(rev - cost), roi_percent: cost ? r2(((rev - cost) / cost) * 100) : null, roas: cost ? r2(rev / cost) : null }); }
    case 'calculate_kpis': {
      const i = num(input.impressions), k = num(input.clicks), cv = num(input.conversions), sp = num(input.spend), rv = num(input.revenue);
      return JSON.stringify({ ctr_percent: i ? r2((k / i) * 100) : null, cpc: k ? r2(sp / k) : null, cvr_percent: k ? r2((cv / k) * 100) : null, cpa: cv ? r2(sp / cv) : null, cpm: i ? r2((sp / i) * 1000) : null, roas: sp ? r2(rv / sp) : null });
    }
    default: return `Error: tool ${name} has no executor.`;
  }
}
