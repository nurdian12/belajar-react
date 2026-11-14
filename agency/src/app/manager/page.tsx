import Link from 'next/link';
import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { agentsWithState } from '@/lib/queries';
import { Badge, Empty, PageHeader, ago } from '@/components/ui';

export default async function ManagerPage() {
  const ctx = await getCtx(); const s = await getStore(); const st = await agentsWithState(ctx.orgId); const mgr = st.find((x) => x.agent.is_manager)!;
  const [projects, assigns, tasks, logs] = await Promise.all([s.list('projects', ctx.orgId, {}, { desc: true, limit: 6 }), s.list('agent_assignments', ctx.orgId, {}, { desc: true, limit: 12 }), s.list('tasks', ctx.orgId), s.list('activity_logs', ctx.orgId, {}, { desc: true, limit: 60 })]);
  const A = new Map(st.map((x) => [x.agent.id, x.agent])); const T = new Map(tasks.map((t) => [t.id, t]));
  return <div><PageHeader title="AI Manager" sub="Maya mengubah instruksi CEO menjadi workflow, memilih agent berdasarkan skill, meninjau kualitas, dan melapor." />
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="card p-5"><div className="flex items-center gap-3"><span className="text-4xl">{mgr.agent.avatar}</span><div><div className="font-semibold">{mgr.agent.name}</div><div className="text-sm text-slate-500">{mgr.agent.job_title}</div></div></div><div className="mt-3"><Badge v={mgr.status} /></div><p className="mt-3 text-sm text-slate-600">{mgr.agent.personality}</p>
        <Link href={`/employees/${mgr.agent.id}`} className="btn btn-ghost mt-4">Chat & system prompt</Link></section>
      <section className="card p-5 lg:col-span-2"><h2 className="mb-3 font-semibold">Keputusan penugasan terbaru</h2>{assigns.length === 0 ? <Empty>Belum ada penugasan.</Empty> : <ul className="divide-y divide-slate-100 text-sm">{assigns.map((a) => <li key={a.id} className="py-2"><span className="font-medium">{T.get(a.task_id)?.title}</span><div className="text-xs text-slate-500">→ {A.get(a.agent_id)?.name} — {a.reason} · {ago(a.created_at)}</div></li>)}</ul>}</section>
      <section className="card p-5 lg:col-span-2"><h2 className="mb-3 font-semibold">Rencana terbaru</h2>{projects.length === 0 ? <Empty>Belum ada.</Empty> : <ul className="space-y-3">{projects.map((p) => <li key={p.id}><div className="flex items-center gap-2"><Link href={`/projects/${p.id}`} className="flex-1 truncate text-sm font-medium hover:text-brand">{p.title}</Link><Badge v={p.status} /></div><p className="text-xs text-slate-500">{(p.plan as any)?.summary}</p></li>)}</ul>}</section>
      <section className="card p-5"><h2 className="mb-3 font-semibold">Log manager</h2><ul className="max-h-72 space-y-1.5 overflow-y-auto text-xs">{logs.filter((l) => l.agent_id === mgr.agent.id).slice(0, 15).map((l) => <li key={l.id}>{l.message} <span className="text-slate-400">· {ago(l.created_at)}</span></li>)}</ul></section></div></div>;
}
