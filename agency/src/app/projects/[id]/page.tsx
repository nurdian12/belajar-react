import { notFound } from 'next/navigation';
import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { AutoRefresh } from '@/components/auto-refresh';
import { Badge, Empty, Markdown, PageHeader, ago } from '@/components/ui';
import { approvalDecision, retryProject } from '@/app/actions';

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCtx(); const s = await getStore(); const { id } = await params;
  const p = await s.get('projects', ctx.orgId, id); if (!p) notFound();
  const [tasks, deps, agents, msgs, logs, approvals, items] = await Promise.all([s.list('tasks', ctx.orgId, { project_id: id }), s.list('task_dependencies', ctx.orgId), s.list('ai_agents', ctx.orgId), s.list('agent_messages_internal', ctx.orgId, { project_id: id }), s.list('activity_logs', ctx.orgId, { project_id: id }, { desc: true, limit: 40 }), s.list('approvals', ctx.orgId, { project_id: id }), s.list('content_items', ctx.orgId, { project_id: id })]);
  const A = new Map(agents.map((a) => [a.id, a])); const top = tasks.filter((t) => !t.parent_task_id); const live = ['planning', 'in_progress', 'review', 'revision'].includes(p.status);
  const delivery = approvals.find((a) => a.action === 'project_delivery' && a.status === 'pending_approval');
  const T = new Map(tasks.map((t) => [t.id, t]));
  return <div>{live && <AutoRefresh ms={2000} />}
    <PageHeader title={p.title} sub={`Dibuat ${ago(p.created_at)} · revisi ke-${p.revision_count}`}><Badge v={p.status} />{p.status === 'failed' && <form action={retryProject}><input type="hidden" name="id" value={p.id} /><button className="btn">Coba ulang tugas gagal</button></form>}</PageHeader>
    <div className="card mb-5 p-4"><div className="label">Instruksi CEO</div><p className="whitespace-pre-wrap text-sm">{p.instruction}</p>{(p.plan as any)?.summary && <><div className="label mt-3">Rencana AI Manager</div><p className="text-sm text-slate-600">{(p.plan as any).summary}</p></>}</div>
    {delivery && <form action={approvalDecision} className="card mb-5 border-amber-300 bg-amber-50 p-4"><input type="hidden" name="id" value={delivery.id} /><div className="font-medium">Hasil siap ditinjau CEO</div><textarea name="note" rows={2} className="input mt-2" placeholder="Catatan revisi (wajib jika meminta revisi)…" />
      <div className="mt-2 flex gap-2"><button name="decision" value="approved" className="btn">✓ Setujui hasil</button><button name="decision" value="rejected" className="btn btn-danger">Minta revisi</button></div></form>}
    <h2 className="mb-2 font-semibold">Workflow ({top.length} tugas)</h2>
    {top.length === 0 ? <Empty>{p.status === 'planning' ? 'AI Manager sedang menyusun rencana…' : 'Tidak ada tugas.'}</Empty> : <div className="space-y-3">{top.map((t) => { const a = A.get(t.agent_id); const need = deps.filter((d) => d.task_id === t.id).map((d) => T.get(d.depends_on_task_id)?.key).filter(Boolean); const subs = tasks.filter((x) => x.parent_task_id === t.id);
      return <details key={t.id} className="card p-4" open={t.status === 'in_progress'}><summary className="flex cursor-pointer items-center gap-3"><span className="text-xl">{a?.avatar}</span><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{t.title}</div><div className="text-xs text-slate-500">{a?.name} · {a?.job_title}{need.length > 0 && ` · menunggu: ${need.join(', ')}`}{t.attempts > 1 && ` · percobaan ${t.attempts}`}</div></div><Badge v={t.status} /></summary>
        <div className="mt-3 border-t border-slate-100 pt-3">{t.feedback && <p className="mb-2 rounded bg-orange-50 p-2 text-xs text-orange-800">Revisi: {t.feedback}</p>}{t.error && <p className="mb-2 rounded bg-rose-50 p-2 text-xs text-rose-700">Error: {t.error}</p>}
          {subs.length > 0 && <p className="mb-2 text-xs text-slate-500">Delegasi: {subs.map((x) => `${A.get(x.agent_id)?.name} (${x.status})`).join(', ')}</p>}
          {t.output ? <Markdown text={t.output} /> : <p className="text-sm text-slate-400">Belum ada hasil.</p>}</div></details>; })}</div>}
    {p.final_report && <><h2 className="mb-2 mt-6 font-semibold">Laporan akhir untuk CEO</h2><div className="card p-5"><Markdown text={p.final_report} /></div></>}
    {items.length > 0 && <><h2 className="mb-2 mt-6 font-semibold">Konten dihasilkan ({items.length})</h2><div className="grid gap-3 sm:grid-cols-2">{items.map((c) => <div key={c.id} className="card p-4"><div className="mb-1 flex items-center gap-2"><Badge v={c.status} /><span className="text-xs text-slate-500">{c.platform} · {c.type}</span></div><div className="text-sm font-medium">{c.title}</div><p className="mt-1 line-clamp-4 whitespace-pre-wrap text-xs text-slate-600">{c.body}</p></div>)}</div></>}
    <div className="mt-6 grid gap-5 lg:grid-cols-2">
      <section className="card p-4"><h2 className="mb-2 font-semibold">Pesan antar-agent</h2>{msgs.length === 0 ? <Empty>Belum ada.</Empty> : <ul className="max-h-72 space-y-2 overflow-y-auto text-xs">{msgs.map((m) => <li key={m.id} className="rounded bg-slate-50 p-2"><b>{A.get(m.from_agent_id)?.name}</b> → <b>{A.get(m.to_agent_id)?.name}</b> <span className="text-slate-400">({m.kind})</span><div className="mt-0.5 whitespace-pre-wrap text-slate-600">{m.content.slice(0, 280)}</div></li>)}</ul>}</section>
      <section className="card p-4"><h2 className="mb-2 font-semibold">Execution log</h2><ul className="max-h-72 space-y-1.5 overflow-y-auto text-xs">{logs.map((l) => <li key={l.id} className="flex gap-2"><Badge v={l.level} /><span className="flex-1">{l.message}</span><span className="shrink-0 text-slate-400">{ago(l.created_at)}</span></li>)}</ul></section></div></div>;
}
