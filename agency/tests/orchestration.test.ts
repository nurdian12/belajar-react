process.env.DEV_DB_FILE = ':memory:';
delete process.env.ANTHROPIC_API_KEY; delete process.env.OPENAI_API_KEY; delete process.env.NEXT_PUBLIC_SUPABASE_URL;
import test from 'node:test';
import assert from 'node:assert/strict';
import { getStore } from '../src/lib/db/store';
import { ensureOrgSeeded } from '../src/lib/seed';
import { submitInstruction, retryFailed } from '../src/lib/agents/manager';
import { drain } from '../src/lib/queue';
import { decideApproval, requestApproval, publishContent } from '../src/lib/approvals';
import { retrieveMemories, remember } from '../src/lib/memory';

const A = '00000000-0000-4000-8000-0000000000aa', B = '00000000-0000-4000-8000-0000000000bb';
async function settle() { for (let i = 0; i < 20; i++) { const n = await drain(); if (!n) { await new Promise((r) => setTimeout(r, 300)); if (!(await drain())) return; } } }

test('seeds 12 distinct AI employees with own prompts', async () => {
  await ensureOrgSeeded(A, 'A'); const s = await getStore();
  const agents = await s.list('ai_agents', A);
  assert.equal(agents.length, 12);
  assert.equal(new Set(agents.map((a) => a.system_prompt)).size, 12);
  assert.equal(agents.filter((a) => a.is_manager).length, 1);
});

test('CEO instruction → plan → dependency-ordered execution → review → CEO approval', async () => {
  const s = await getStore();
  const p = await submitInstruction(A, null, 'Buatkan strategi marketing untuk brand skincare selama 30 hari');
  await settle();
  const proj = (await s.get('projects', A, p.id))!;
  assert.equal(proj.status, 'awaiting_ceo', JSON.stringify(proj.plan));
  const tasks = await s.list('tasks', A, { project_id: p.id });
  const top = tasks.filter((t) => !t.parent_task_id);
  assert.ok(top.length >= 3);
  assert.ok(top.every((t) => t.status === 'completed' && t.output));
  const deps = await s.list('task_dependencies', A);
  assert.ok(deps.length > 0);
  for (const d of deps) { // dependants must have started after their dependencies completed
    const t = top.find((x) => x.id === d.task_id)!, up = top.find((x) => x.id === d.depends_on_task_id)!;
    assert.ok(Date.parse(t.started_at!) >= Date.parse(up.completed_at!), 'dependency order violated');
  }
  assert.ok((await s.list('agent_messages_internal', A)).length > top.length);
  assert.ok((await s.list('ai_usage', A)).length > 0);
  const ap = (await s.list('approvals', A, { action: 'project_delivery' }))[0];
  assert.equal(ap.status, 'pending_approval');
  await decideApproval(A, null, ap.id, 'approved');
  assert.equal((await s.get('projects', A, p.id))!.status, 'completed');
});

test('CEO revision re-runs tasks with feedback', async () => {
  const s = await getStore();
  const p = await submitInstruction(A, null, 'Riset 10 kompetitor brand fashion'); await settle();
  const ap = (await s.list('approvals', A, { project_id: p.id }))[0];
  await decideApproval(A, null, ap.id, 'rejected', 'Kurang detail, tambah matriks');
  await settle();
  const t = (await s.list('tasks', A, { project_id: p.id }))[0];
  assert.match(t.feedback ?? '', /Kurang detail/);
  assert.equal((await s.get('projects', A, p.id))!.status, 'awaiting_ceo');
});

test('tenant isolation: org B sees nothing of org A', async () => {
  await ensureOrgSeeded(B, 'B'); const s = await getStore();
  assert.equal((await s.list('projects', B)).length, 0);
  const a = (await s.list('projects', A))[0];
  assert.equal(await s.get('projects', B, a.id), null);
  await assert.rejects(() => s.update('projects', B, a.id, { title: 'hack' }));
});

test('client memory isolation', async () => {
  const s = await getStore(); const agent = (await s.list('ai_agents', A, { key: 'copywriter' }))[0];
  const c1 = await s.insert('clients', A, { name: 'C1', industry: '', website: '', contact_email: '', marketing_history: '', competitors: '', products: '', target_audience: '', notes: '' });
  const c2 = await s.insert('clients', A, { name: 'C2', industry: '', website: '', contact_email: '', marketing_history: '', competitors: '', products: '', target_audience: '', notes: '' });
  await remember(A, { agentId: agent.id, clientId: c1.id, kind: 'client', content: 'RAHASIA klien satu: tone voice sangat formal', importance: 5 });
  const hit1 = await retrieveMemories(A, { agentId: agent.id, clientId: c1.id, query: 'tone voice formal rahasia' });
  const hit2 = await retrieveMemories(A, { agentId: agent.id, clientId: c2.id, query: 'tone voice formal rahasia' });
  assert.ok(hit1.some((m) => m.content.includes('RAHASIA')));
  assert.ok(!hit2.some((m) => m.content.includes('RAHASIA')));
});

test('external actions are never claimed as done without integration', async () => {
  const s = await getStore();
  const c = await s.insert('content_items', A, { client_id: null, campaign_id: null, project_id: null, task_id: null, agent_id: null, platform: 'instagram', type: 'post', title: 't', body: 'b', hashtags: [], asset_url: null, status: 'draft', is_ai_generated: true, published_via: null, published_at: null });
  await assert.rejects(() => publishContent(A, c.id), /Approved/);
  const ap = await requestApproval(A, { action: 'publish_content', title: 't', description: 'd', refTable: 'content_items', refId: c.id });
  await decideApproval(A, null, ap.id, 'approved');
  await assert.rejects(() => publishContent(A, c.id), /belum dikonfigurasi/);
  assert.equal((await s.get('content_items', A, c.id))!.status, 'approved');
});
