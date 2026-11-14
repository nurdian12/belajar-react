import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { AutoRefresh } from '@/components/auto-refresh';
import { Badge, PageHeader, ago } from '@/components/ui';

export default async function Logs({ searchParams }: { searchParams: Promise<{ level?: string; agent?: string }> }) {
  const q = await searchParams; const ctx = await getCtx(); const s = await getStore();
  const [logs, agents] = await Promise.all([s.list('activity_logs', ctx.orgId, q.level ? { level: q.level } : {}, { desc: true, limit: 300 }), s.list('ai_agents', ctx.orgId)]);
  const rows = logs.filter((l) => !q.agent || l.agent_id === q.agent).slice(0, 150);
  return <div><AutoRefresh ms={4000} /><PageHeader title="Agent Activity Logs" sub="Jejak seluruh aktivitas: tugas, tool call, delegasi, approval, error." />
    <form className="mb-4 flex gap-2"><select name="agent" defaultValue={q.agent ?? ''} className="input !w-auto"><option value="">Semua agent</option>{agents.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
      <select name="level" defaultValue={q.level ?? ''} className="input !w-auto"><option value="">Semua level</option><option>info</option><option>warn</option><option>error</option></select><button className="btn btn-ghost">Filter</button></form>
    <div className="card divide-y divide-slate-100">{rows.map((l) => <div key={l.id} className="flex items-start gap-3 px-4 py-2.5 text-sm"><Badge v={l.level} /><div className="min-w-0 flex-1"><div>{l.message}</div><div className="text-xs text-slate-400">{l.event} · {agents.find((a) => a.id === l.agent_id)?.name ?? 'sistem'}</div></div><span className="shrink-0 text-xs text-slate-400">{ago(l.created_at)}</span></div>)}{rows.length === 0 && <div className="p-6 text-center text-sm text-slate-400">Belum ada aktivitas.</div>}</div></div>;
}
