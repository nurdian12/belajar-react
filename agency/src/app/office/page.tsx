import Link from 'next/link';
import { getCtx } from '@/lib/auth';
import { agentsWithState } from '@/lib/queries';
import { AutoRefresh } from '@/components/auto-refresh';
import { Badge, PageHeader, Progress, ago } from '@/components/ui';

export default async function Office() {
  const ctx = await getCtx(); const st = await agentsWithState(ctx.orgId);
  const depts = [...new Set(st.map((x) => x.agent.department))];
  return <div><AutoRefresh ms={2500} />
    <PageHeader title="AI Office Room" sub="Seluruh karyawan AI, status kerja, dan aktivitas terkini (live)." />
    {depts.map((d) => <section key={d} className="mb-7"><h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">{d}</h2>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{st.filter((x) => x.agent.department === d).map(({ agent: a, status, current }) =>
        <Link key={a.id} href={`/employees/${a.id}`} className="card group p-4 transition hover:-translate-y-0.5 hover:shadow-md">
          <div className="flex items-start gap-3"><div className="grid h-12 w-12 place-items-center rounded-xl bg-brand-soft text-2xl">{a.avatar}</div>
            <div className="min-w-0 flex-1"><div className="truncate font-semibold group-hover:text-brand">{a.name}</div><div className="truncate text-xs text-slate-500">{a.job_title}</div></div><Badge v={status} /></div>
          <div className="mt-3 min-h-[2.5rem] text-xs text-slate-500">{current ? <><span className="font-medium text-slate-700">Sedang:</span> {current.title}</> : <span className="text-slate-400">Tidak ada tugas aktif</span>}</div>
          <div className="mt-2"><Progress value={status === 'working' ? a.progress : 0} /></div>
          <div className="mt-2 flex justify-between text-[11px] text-slate-400"><span>{status === 'working' ? `${a.progress}%` : `${a.metrics.tasks_completed} tugas selesai`}</span><span>Aktivitas: {ago(a.last_activity_at)}</span></div>
        </Link>)}</div></section>)}
  </div>;
}
