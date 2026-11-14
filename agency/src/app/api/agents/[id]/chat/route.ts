import { NextResponse } from 'next/server';
import { z } from 'zod';
import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { agentLoop } from '@/lib/agents/runner';
import { retrieveMemories } from '@/lib/memory';
import { tryTake } from '@/lib/ai/rate-limit';

export const maxDuration = 120;
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCtx().catch(() => null); if (!ctx) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!tryTake(`chat:${ctx.orgId}`, 30)) return NextResponse.json({ error: 'Rate limit: terlalu banyak pesan.' }, { status: 429 });
  const body = z.object({ message: z.string().min(1).max(4000), conversationId: z.string().nullish() }).safeParse(await req.json().catch(() => ({})));
  if (!body.success) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
  const s = await getStore(); const agent = await s.get('ai_agents', ctx.orgId, (await params).id);
  if (!agent) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (agent.status === 'offline') return NextResponse.json({ error: `${agent.name} sedang offline.` }, { status: 409 });
  let conv = body.data.conversationId ? await s.get('agent_conversations', ctx.orgId, body.data.conversationId) : null;
  if (conv && conv.agent_id !== agent.id) conv = null;
  conv ??= await s.insert('agent_conversations', ctx.orgId, { agent_id: agent.id, user_id: ctx.userId, title: body.data.message.slice(0, 60) });
  const history = (await s.list('agent_messages', ctx.orgId, { conversation_id: conv.id })).slice(-10);
  await s.insert('agent_messages', ctx.orgId, { conversation_id: conv.id, role: 'user', content: body.data.message, tokens_in: 0, tokens_out: 0 });
  const mems = await retrieveMemories(ctx.orgId, { agentId: agent.id, query: body.data.message, k: 5 });
  const prompt = [mems.length && `RELEVANT MEMORY:\n${mems.map((m) => `- [${m.kind}] ${m.content}`).join('\n')}`, history.length && `CONVERSATION SO FAR:\n${history.map((m) => `${m.role === 'user' ? 'CEO' : agent.name}: ${m.content}`).join('\n')}`, `CEO: ${body.data.message}`, 'Reply conversationally as yourself (concise). This is a direct chat, not a task: do not claim to have done external actions.'].filter(Boolean).join('\n\n');
  try {
    const reply = await agentLoop(ctx.orgId, agent, prompt, { task: null, project: null, depth: 0 }, { onlyTools: ['search_memory', 'save_memory'], maxSteps: 3 });
    await s.insert('agent_messages', ctx.orgId, { conversation_id: conv.id, role: 'assistant', content: reply, tokens_in: 0, tokens_out: 0 });
    await s.update('ai_agents', ctx.orgId, agent.id, { last_activity_at: new Date().toISOString() });
    return NextResponse.json({ reply, conversationId: conv.id });
  } catch (e) { return NextResponse.json({ error: (e as Error).message }, { status: 502 }); }
}
