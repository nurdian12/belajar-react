import Link from 'next/link';
import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { AutoRefresh } from '@/components/auto-refresh';
import { Badge, Empty, PageHeader, Progress, ago } from '@/components/ui';

export default async function Projects() {
  const ctx = await getCtx(); const s = await getStore();
  const [ps, ts, cs] = await Promise.all([s.list('projects', ctx.orgId, {}, { desc: true }), s.list('tasks', ctx.orgId), s.list('clients', ctx.orgId)]);
  return <div><AutoRefresh ms={4000} /><PageHeader title="Projects" sub="Setiap instruksi CEO menjadi proyek dengan workflow tugas antar-agent." />
    {ps.length === 0 ? <Empty>Belum ada proyek. Mulai dari CEO Command Center.</Empty> : <div className="grid gap-3">{ps.map((p) => { const t = ts.filter((x) => x.project_id === p.id && !x.parent_task_id); const pct = t.length ? Math.round(t.filter((x) => x.status === 'completed').length / t.length * 100) : 0;
      return <Link key={p.id} href={`/projects/${p.id}`} className="card block p-4 hover:shadow-md"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="truncate font-medium">{p.title}</div><div className="text-xs text-slate-500">{cs.find((c) => c.id === p.client_id)?.name ?? 'Internal'} · {t.length} tugas · {ago(p.created_at)}</div></div><Badge v={p.status} /></div><div className="mt-3"><Progress value={pct} /></div></Link>; })}</div>}</div>;
}
