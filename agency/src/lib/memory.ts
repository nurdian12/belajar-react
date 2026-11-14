import { getStore } from './db/store';
import type { AgentMemory, MemoryKind } from './db/types';

const STOP = new Set('the a an and or of to in for on with is are yang dan di ke untuk dengan dari ini itu atau pada buat buatkan'.split(' '));
const tok = (s: string) => s.toLowerCase().split(/[^\p{L}\p{N}]+/u).filter((w) => w.length > 2 && !STOP.has(w));

/** Lightweight lexical retrieval (TF-overlap + importance + recency). Swap for pgvector embeddings without changing callers. */
export async function retrieveMemories(orgId: string, q: { agentId: string; clientId?: string | null; projectId?: string | null; query: string; k?: number; maxChars?: number }): Promise<AgentMemory[]> {
  const s = await getStore();
  const all = await s.list('agent_memories', orgId);
  const qt = new Set(tok(q.query));
  const scored = all
    .filter((m) => (m.agent_id === null || m.agent_id === q.agentId)                       // own or company-shared
      && (m.client_id === null || m.client_id === (q.clientId ?? null))                      // CLIENT ISOLATION
      && (m.project_id === null || m.project_id === (q.projectId ?? null)))
    .map((m) => {
      const mt = tok(m.content + ' ' + (m.tags ?? []).join(' '));
      const overlap = mt.filter((w) => qt.has(w)).length / Math.sqrt(mt.length + 1);
      const ageDays = (Date.now() - Date.parse(m.created_at)) / 86_400_000;
      const base = m.kind === 'identity' || m.kind === 'company' ? 0.3 : 0;
      return { m, score: overlap * 2 + m.importance * 0.15 + base + Math.max(0, 1 - ageDays / 90) * 0.3 };
    })
    .sort((a, b) => b.score - a.score);
  const out: AgentMemory[] = []; let chars = 0;
  for (const { m, score } of scored) {
    if (out.length >= (q.k ?? 6) || (score < 0.5 && m.kind !== 'identity')) continue;
    if (chars + m.content.length > (q.maxChars ?? 3000)) continue;
    out.push(m); chars += m.content.length;
  }
  return out;
}
export async function remember(orgId: string, m: { agentId: string | null; clientId?: string | null; projectId?: string | null; kind: MemoryKind; content: string; tags?: string[]; importance?: number }) {
  const s = await getStore();
  return s.insert('agent_memories', orgId, { agent_id: m.agentId, client_id: m.clientId ?? null, project_id: m.projectId ?? null, kind: m.kind, content: m.content.slice(0, 4000), tags: m.tags ?? [], importance: m.importance ?? 3 });
}
