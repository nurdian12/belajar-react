import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { AutoRefresh } from '@/components/auto-refresh';
import { Badge, Empty, Markdown, PageHeader, Stat } from '@/components/ui';

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCtx(); const s = await getStore(); const { id } = await params;
  const c = await s.get('campaigns', ctx.orgId, id); if (!c) notFound();
  const [project, deliv, cal, items, tasks, agents, events] = await Promise.all([c.project_id ? s.get('projects', ctx.orgId, c.project_id) : null, s.list('campaign_deliverables', ctx.orgId, { campaign_id: id }), s.list('content_calendar', ctx.orgId, { campaign_id: id }, { orderBy: 'scheduled_for' }), s.list('content_items', ctx.orgId, { campaign_id: id }), c.project_id ? s.list('tasks', ctx.orgId, { project_id: c.project_id }) : [], s.list('ai_agents', ctx.orgId), s.list('analytics_events', ctx.orgId, { campaign_id: id })]);
  const A = new Map(agents.map((a) => [a.id, a])); const top = tasks.filter((t) => !t.parent_task_id);
  const sum = (m: string, src: string) => events.filter((e) => e.metric === m && e.source === src).reduce((a, e) => a + e.value, 0);
  const live = project && ['planning', 'in_progress', 'review', 'revision'].includes(project.status);
  return <div>{live && <AutoRefresh ms={3000} />}
    <PageHeader title={c.name} sub={`${c.brand || 'Brand'} · ${c.platforms.join(', ')}`}>{project && <Badge v={project.status} />}{project && <Link className="btn btn-ghost" href={`/projects/${project.id}`}>Lihat workflow</Link>}</PageHeader>
    <div className="mb-5 grid gap-3 sm:grid-cols-4"><Stat label="Budget" value={`Rp${c.budget.toLocaleString('id-ID')}`} /><Stat label="Periode" value={<span className="text-base">{c.start_date ?? '?'} → {c.end_date ?? '?'}</span>} /><Stat label="Deliverables" value={`${deliv.length}/${top.length}`} /><Stat label="Konten draft" value={items.length} /></div>
    <div className="card mb-5 grid gap-4 p-5 text-sm sm:grid-cols-2"><div><div className="label">Objective</div>{c.objective}</div><div><div className="label">Target audience</div>{c.target_audience || '—'}</div></div>
    <h2 className="mb-2 font-semibold">Deliverables per agent</h2>
    {deliv.length === 0 ? <Empty>Tim AI sedang bekerja…</Empty> : <div className="space-y-3">{deliv.map((d) => { const t = tasks.find((x) => x.id === d.task_id); return <details key={d.id} className="card p-4"><summary className="flex cursor-pointer items-center gap-3"><span className="text-xl">{A.get(t?.agent_id ?? '')?.avatar}</span><span className="flex-1 text-sm font-medium">{d.title}</span><Badge v={d.status} /></summary><div className="mt-3 border-t border-slate-100 pt-3"><Markdown text={d.content ?? ''} /></div></details>; })}</div>}
    <h2 className="mb-2 mt-6 font-semibold">Content calendar</h2>
    {cal.length === 0 ? <Empty>Belum ada jadwal (diisi Social Media Manager).</Empty> : <div className="card divide-y divide-slate-100">{cal.map((e) => <div key={e.id} className="flex items-center gap-3 px-4 py-2 text-sm"><span className="w-28 text-xs text-slate-500">{new Date(e.scheduled_for).toLocaleDateString('id-ID')}</span><span className="rounded bg-slate-100 px-2 text-xs">{e.platform}</span><span className="flex-1 truncate">{e.title}</span><Badge v={e.status} /></div>)}</div>}
    <h2 className="mb-2 mt-6 font-semibold">Performance tracking</h2>
    <div className="card p-4 text-sm"><div className="grid gap-2 sm:grid-cols-3">{['impressions', 'clicks', 'conversions'].map((m) => <div key={m}><div className="label">{m}</div><b>{sum(m, 'real').toLocaleString()}</b> <span className="text-xs text-slate-400">real</span>{sum(m, 'simulated') > 0 && <span className="ml-2 text-xs text-fuchsia-600">+{sum(m, 'simulated').toLocaleString()} simulasi</span>}</div>)}</div><p className="mt-2 text-xs text-slate-400">Metrik real diinput manual di Analytics (belum ada integrasi platform iklan).</p></div></div>;
}
