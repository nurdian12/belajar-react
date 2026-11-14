'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { getCtx, supabaseServer } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { submitInstruction, retryFailed } from '@/lib/agents/manager';
import { decideApproval, publishContent } from '@/lib/approvals';
import { enqueue } from '@/lib/queue';
import { tryTake } from '@/lib/ai/rate-limit';

const nz = (v: FormDataEntryValue | null) => (v == null || v === '' ? null : String(v));
const S = (v: FormDataEntryValue | null) => String(v ?? '').trim();

export async function sendInstruction(fd: FormData) {
  const ctx = await getCtx();
  const text = z.string().min(5, 'Instruksi terlalu pendek').max(4000).parse(S(fd.get('instruction')));
  if (!tryTake(`instr:${ctx.orgId}`, 20)) throw new Error('Terlalu banyak instruksi, coba sebentar lagi.');
  const p = await submitInstruction(ctx.orgId, ctx.userId, text, { clientId: nz(fd.get('client_id')) });
  redirect(`/projects/${p.id}`);
}
export async function approvalDecision(fd: FormData) {
  const ctx = await getCtx();
  await decideApproval(ctx.orgId, ctx.userId, S(fd.get('id')), S(fd.get('decision')) === 'approved' ? 'approved' : 'rejected', nz(fd.get('note')) ?? undefined);
  revalidatePath('/', 'layout');
}
export async function publishAction(fd: FormData) {
  const ctx = await getCtx();
  try { await publishContent(ctx.orgId, S(fd.get('id')), { manual: S(fd.get('manual')) === '1' }); } catch (e) { redirect(`/approvals?error=${encodeURIComponent((e as Error).message)}`); }
  revalidatePath('/', 'layout');
}
export async function retryProject(fd: FormData) {
  const ctx = await getCtx(); await retryFailed(ctx.orgId, S(fd.get('id'))); revalidatePath('/', 'layout');
}

const ClientSchema = z.object({ name: z.string().min(1), industry: z.string().default(''), website: z.string().default(''), contact_email: z.string().default(''), products: z.string().default(''), target_audience: z.string().default(''), competitors: z.string().default(''), marketing_history: z.string().default(''), notes: z.string().default('') });
export async function saveClient(fd: FormData) {
  const ctx = await getCtx(); const s = await getStore();
  const data = ClientSchema.parse(Object.fromEntries([...fd.entries()].filter(([k]) => k !== 'id')));
  const id = nz(fd.get('id'));
  const c = id ? await s.update('clients', ctx.orgId, id, data) : await s.insert('clients', ctx.orgId, data);
  revalidatePath('/clients'); redirect(`/clients/${c.id}`);
}
export async function saveBrand(fd: FormData) {
  const ctx = await getCtx(); const s = await getStore(); const clientId = S(fd.get('client_id'));
  if (!(await s.get('clients', ctx.orgId, clientId))) throw new Error('Client not found');
  const d = { name: S(fd.get('name')) || 'Brand', guidelines: S(fd.get('guidelines')), tone_of_voice: S(fd.get('tone_of_voice')), colors: S(fd.get('colors')), keywords: S(fd.get('keywords')) };
  const ex = (await s.list('brands', ctx.orgId, { client_id: clientId }))[0];
  if (ex) await s.update('brands', ctx.orgId, ex.id, d); else await s.insert('brands', ctx.orgId, { client_id: clientId, ...d });
  revalidatePath(`/clients/${clientId}`);
}
export async function addClientDocument(fd: FormData) {
  const ctx = await getCtx(); const s = await getStore(); const clientId = S(fd.get('client_id'));
  if (!(await s.get('clients', ctx.orgId, clientId))) throw new Error('Client not found');
  const file = fd.get('file') as File | null; let content = S(fd.get('content'));
  if (file && file.size > 0) { if (file.size > 1_000_000) throw new Error('File maksimal 1MB (teks).'); content = await file.text(); }
  await s.insert('client_documents', ctx.orgId, { client_id: clientId, title: S(fd.get('title')) || file?.name || 'Dokumen', content: content.slice(0, 50_000) });
  revalidatePath(`/clients/${clientId}`);
}

const CampaignSchema = z.object({ name: z.string().min(2), brand: z.string().default(''), client_id: z.string().nullable().default(null), objective: z.string().min(3), target_audience: z.string().default(''), budget: z.coerce.number().min(0).default(0), platforms: z.array(z.string()).default([]), start_date: z.string().nullable().default(null), end_date: z.string().nullable().default(null) });
export async function createCampaign(input: z.input<typeof CampaignSchema>) {
  const ctx = await getCtx(); const s = await getStore();
  const v = CampaignSchema.parse(input);
  const c = await s.insert('campaigns', ctx.orgId, { ...v, status: 'planning', project_id: null, kpis: {} });
  const instruction = `Buat campaign marketing "${v.name}" untuk brand ${v.brand || '(brand klien)'}.\nObjective: ${v.objective}\nTarget audience: ${v.target_audience || 'tentukan dari riset'}\nBudget: ${v.budget ? 'Rp' + v.budget.toLocaleString('id-ID') : 'belum ditentukan'}\nPlatform: ${v.platforms.join(', ') || 'rekomendasikan'}\nPeriode: ${v.start_date ?? '?'} s/d ${v.end_date ?? '?'}\nDeliverables wajib: strategi, analisis pasar, copywriting, ide konten, brief desain/visual, script video, kalender posting, strategi iklan, KPI & sistem evaluasi.`;
  const p = await submitInstruction(ctx.orgId, ctx.userId, instruction, { clientId: v.client_id, campaignId: c.id, title: `Campaign: ${v.name}` });
  await s.update('campaigns', ctx.orgId, c.id, { project_id: p.id });
  revalidatePath('/campaigns'); return { id: c.id };
}

const TYPES: Record<string, string> = { ideas: 'content', carousel: 'content', calendar: 'social', caption: 'copywriter', hashtags: 'copywriter', hooks: 'copywriter', video_script: 'video', creative_brief: 'designer', image: 'designer' };
export async function generateContent(fd: FormData) {
  const ctx = await getCtx(); const s = await getStore();
  const v = z.object({ platform: z.string(), kind: z.string(), topic: z.string().min(3), count: z.coerce.number().int().min(1).max(30).default(5), tone: z.string().default('') }).parse(Object.fromEntries(fd.entries()));
  const agent = (await s.list('ai_agents', ctx.orgId, { key: TYPES[v.kind] ?? 'content' }))[0];
  const clientId = nz(fd.get('client_id'));
  const instruction = `Content Factory — buat ${v.count} ${v.kind.replace('_', ' ')} untuk ${v.platform}. Topik/brief: ${v.topic}. ${v.tone ? 'Tone: ' + v.tone + '.' : ''} Simpan SETIAP item dengan tool create_content_item (platform=${v.platform}).`;
  const p = await s.insert('projects', ctx.orgId, { client_id: clientId, campaign_id: null, title: `Content: ${v.kind} ${v.platform}`, instruction, status: 'in_progress', plan: { summary: 'Single-agent content job (Content Factory)', tasks: [] }, final_report: null, revision_count: 0, created_by: ctx.userId, ceo_feedback: null });
  const t = await s.insert('tasks', ctx.orgId, { project_id: p.id, agent_id: agent.id, parent_task_id: null, key: 'content', title: `${v.kind.replace('_', ' ')} — ${v.topic.slice(0, 60)}`, description: instruction, status: 'ready', output: null, error: null, attempts: 0, max_attempts: 3, feedback: null, deliverable_type: 'content_factory', started_at: null, completed_at: null });
  await s.insert('agent_assignments', ctx.orgId, { task_id: t.id, agent_id: agent.id, assigned_by_agent_id: null, reason: 'Content Factory routing' });
  await enqueue(ctx.orgId, 'run_task', { taskId: t.id });
  redirect(`/projects/${p.id}`);
}
export async function requestContentApproval(fd: FormData) {
  const ctx = await getCtx(); const s = await getStore(); const id = S(fd.get('id'));
  const c = await s.get('content_items', ctx.orgId, id); if (!c) throw new Error('not found');
  const { requestApproval } = await import('@/lib/approvals');
  await requestApproval(ctx.orgId, { action: 'publish_content', title: `Publish: ${c.title}`, description: `${c.platform} · ${c.type}\n\n${c.body.slice(0, 400)}`, agentId: c.agent_id, projectId: c.project_id, refTable: 'content_items', refId: id });
  revalidatePath('/content');
}

export async function saveSettings(fd: FormData) {
  const ctx = await getCtx(); const s = await getStore(); const org = (await s.get('organizations', ctx.orgId, ctx.orgId))!;
  const policy: Record<string, boolean> = {}; for (const k of Object.keys(org.approval_policy)) policy[k] = fd.get(`p_${k}`) === 'on';
  policy.project_delivery = true;
  await s.update('organizations', ctx.orgId, ctx.orgId, { name: S(fd.get('name')) || org.name, approval_policy: policy, settings: { ...org.settings, monthly_ai_budget_usd: Number(fd.get('budget')) || 0 } });
  revalidatePath('/', 'layout');
}
export async function updateAgent(fd: FormData) {
  const ctx = await getCtx(); const s = await getStore(); const id = S(fd.get('id'));
  const a = await s.get('ai_agents', ctx.orgId, id); if (!a) throw new Error('not found');
  const prompt = S(fd.get('system_prompt')); const key = `[[AGENT:${a.key}]]`;
  await s.update('ai_agents', ctx.orgId, id, { system_prompt: prompt.startsWith(key) ? prompt : `${key}\n${prompt}`, personality: S(fd.get('personality')) || a.personality, status: fd.get('offline') === 'on' ? 'offline' : a.status === 'offline' ? 'available' : a.status });
  revalidatePath(`/employees/${id}`);
}
export async function recordMetric(fd: FormData) {
  const ctx = await getCtx(); const s = await getStore();
  await s.insert('analytics_events', ctx.orgId, { campaign_id: nz(fd.get('campaign_id')), client_id: null, agent_id: null, metric: S(fd.get('metric')), value: Number(fd.get('value')) || 0, source: 'real', occurred_at: new Date().toISOString() });
  revalidatePath('/analytics');
}
export async function seedSimulated() {
  const ctx = await getCtx(); const s = await getStore();
  const camps = await s.list('campaigns', ctx.orgId); const metrics = ['impressions', 'clicks', 'leads', 'conversions', 'spend', 'revenue'];
  for (let d = 13; d >= 0; d--) for (const m of metrics) {
    const base = { impressions: 8000, clicks: 400, leads: 30, conversions: 8, spend: 150, revenue: 600 }[m]!;
    await s.insert('analytics_events', ctx.orgId, { campaign_id: camps[0]?.id ?? null, client_id: null, agent_id: null, metric: m, value: Math.round(base * (0.7 + Math.random() * 0.6)), source: 'simulated', occurred_at: new Date(Date.now() - d * 86_400_000).toISOString() });
  }
  revalidatePath('/analytics');
}
export async function clearSimulated() {
  const ctx = await getCtx(); const s = await getStore();
  for (const e of await s.list('analytics_events', ctx.orgId, { source: 'simulated' })) await s.remove('analytics_events', ctx.orgId, e.id);
  revalidatePath('/analytics');
}

export async function login(fd: FormData) {
  const sb = await supabaseServer(); const mode = S(fd.get('mode'));
  const creds = { email: S(fd.get('email')), password: S(fd.get('password')) };
  const { error } = mode === 'signup' ? await sb.auth.signUp(creds) : await sb.auth.signInWithPassword(creds);
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect('/');
}
export async function logout() { const sb = await supabaseServer(); await sb.auth.signOut(); redirect('/login'); }
