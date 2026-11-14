import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { agentsWithState, fmtUsd } from '@/lib/queries';
import { AgentChat } from '@/components/chat';
import { Badge, Empty, PageHeader, Progress, ago } from '@/components/ui';
import { updateAgent } from '@/app/actions';

export default async function Employee({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCtx(); const s = await getStore(); const { id } = await params;
  const a = await s.get('ai_agents', ctx.orgId, id); if (!a) notFound();
  const st = (await agentsWithState(ctx.orgId)).find((x) => x.agent.id === id)!;
  const [skills, tasks, memories, convs] = await Promise.all([s.list('agent_skills', ctx.orgId, { agent_id: id }), s.list('tasks', ctx.orgId, { agent_id: id }, { desc: true, limit: 15 }), s.list('agent_memories', ctx.orgId, {}, { desc: true }), s.list('agent_conversations', ctx.orgId, { agent_id: id }, { desc: true })]);
  const mine = memories.filter((m) => m.agent_id === id).slice(0, 12);
  const msgs = convs[0] ? await s.list('agent_messages', ctx.orgId, { conversation_id: convs[0].id }) : [];
  const m = a.metrics;
  return <div><PageHeader title={`${a.avatar} ${a.name}`} sub={`${a.job_title} · ${a.department}`}><Badge v={st.status} /></PageHeader>
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="card space-y-4 p-5"><h2 className="font-semibold">Profil</h2><p className="text-sm text-slate-600">{a.personality}</p>
        <div><div className="label">Skills</div><div className="flex flex-wrap gap-1.5">{skills.map((k) => <span key={k.id} className="rounded-full bg-brand-soft px-2.5 py-0.5 text-xs text-brand-dark">{k.skill}</span>)}</div></div>
        <div><div className="label">Tools</div><div className="flex flex-wrap gap-1.5">{a.tools.map((t) => <code key={t} className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px]">{t}</code>)}</div></div>
        <div><div className="label">Performa</div><dl className="grid grid-cols-2 gap-2 text-sm"><div>Selesai<b className="block text-lg">{m.tasks_completed}</b></div><div>Gagal<b className="block text-lg">{m.tasks_failed}</b></div><div>Rata-rata<b className="block text-lg">{m.avg_seconds}s</b></div><div>Biaya AI<b className="block text-lg">{fmtUsd(m.cost_usd)}</b></div></dl><div className="mt-1 text-xs text-slate-400">{m.tokens.toLocaleString()} token · aktivitas {ago(a.last_activity_at)}</div></div>
        {st.current && <div><div className="label">Tugas saat ini</div><div className="text-sm">{st.current.title}</div><div className="mt-1"><Progress value={a.progress} /></div></div>}
      </section>
      <section className="card p-5 lg:col-span-2"><h2 className="mb-3 font-semibold">Chat langsung</h2><AgentChat agentId={a.id} name={a.name.split(' ')[0]} conversationId={convs[0]?.id ?? null} initial={msgs.map((x) => ({ role: x.role, content: x.content }))} /></section>
      <section className="card p-5 lg:col-span-2"><h2 className="mb-3 font-semibold">Riwayat tugas</h2>{tasks.length === 0 ? <Empty>Belum ada tugas.</Empty> : <ul className="divide-y divide-slate-100">{tasks.map((t) => <li key={t.id} className="flex items-center gap-3 py-2 text-sm"><Link href={`/projects/${t.project_id}`} className="flex-1 truncate hover:text-brand">{t.title}</Link><span className="text-xs text-slate-400">{ago(t.completed_at ?? t.created_at)}</span><Badge v={t.status} /></li>)}</ul>}</section>
      <section className="card p-5"><h2 className="mb-3 font-semibold">Memori</h2>{mine.length === 0 ? <Empty>Kosong.</Empty> : <ul className="space-y-2 text-xs">{mine.map((x) => <li key={x.id} className="rounded bg-slate-50 p-2"><span className="mr-1 rounded bg-white px-1 text-[10px] uppercase text-slate-500 ring-1 ring-slate-200">{x.kind}</span>{x.content.slice(0, 160)}</li>)}</ul>}</section>
      <section className="card p-5 lg:col-span-3"><h2 className="mb-3 font-semibold">System instructions</h2>
        <form action={updateAgent} className="space-y-3"><input type="hidden" name="id" value={a.id} />
          <div><label className="label">Personality</label><input className="input" name="personality" defaultValue={a.personality} /></div>
          <div><label className="label">System prompt (khusus agent ini)</label><textarea name="system_prompt" rows={12} className="input font-mono text-xs" defaultValue={a.system_prompt} /></div>
          <div className="flex items-center gap-4"><label className="flex items-center gap-2 text-sm"><input type="checkbox" name="offline" defaultChecked={a.status === 'offline'} /> Set offline (tidak menerima tugas/chat)</label><button className="btn">Simpan</button></div></form></section>
    </div></div>;
}
