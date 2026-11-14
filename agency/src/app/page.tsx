import Link from 'next/link';
import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { agentsWithState } from '@/lib/queries';
import { AutoRefresh } from '@/components/auto-refresh';
import { Badge, Empty, PageHeader, Progress, Stat, ago } from '@/components/ui';
import { sendInstruction } from './actions';

const EXAMPLES = ['Buatkan strategi marketing untuk brand skincare selama 30 hari.', 'Riset 10 kompetitor brand fashion.', 'Buat 30 ide konten Instagram untuk bisnis kuliner.', 'Buat kampanye pemasaran produk baru.'];
export default async function CommandCenter() {
  const ctx = await getCtx(); const s = await getStore();
  const [projects, tasks, approvals, clients, st] = await Promise.all([s.list('projects', ctx.orgId, {}, { desc: true }), s.list('tasks', ctx.orgId, {}, { desc: true }), s.list('approvals', ctx.orgId, { status: 'pending_approval' }), s.list('clients', ctx.orgId), agentsWithState(ctx.orgId)]);
  const active = projects.filter((p) => ['planning', 'in_progress', 'review', 'revision'].includes(p.status));
  const done = tasks.filter((t) => t.status === 'completed' && !t.parent_task_id);
  const reports = projects.filter((p) => p.final_report);
  const busy = active.length > 0;
  return <div>
    {busy && <AutoRefresh />}
    <PageHeader title="CEO Command Center" sub="Berikan instruksi — AI Manager memecahnya menjadi workflow dan membagikannya ke karyawan AI." />
    <form action={sendInstruction} className="card mb-6 p-5">
      <label className="label">Instruksi CEO</label>
      <textarea name="instruction" required minLength={5} rows={3} className="input" placeholder={EXAMPLES[0]} />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select name="client_id" className="input !w-auto"><option value="">Tanpa klien (internal)</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
        <button className="btn">Kirim ke AI Manager →</button>
        <span className="text-xs text-slate-400">Contoh: {EXAMPLES.slice(1, 3).join(' · ')}</span>
      </div>
    </form>
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-5">
      <Stat label="Proyek aktif" value={active.length} /><Stat label="Tugas selesai" value={done.length} /><Stat label="Menunggu approval" value={approvals.length} />
      <Stat label="Agent bekerja" value={st.filter((x) => x.status === 'working').length + '/' + st.length} /><Stat label="Laporan AI" value={reports.length} />
    </div>
    <div className="grid gap-6 lg:grid-cols-3">
      <section className="card p-5 lg:col-span-2"><h2 className="mb-3 font-semibold">Instruksi masuk & proyek aktif</h2>
        {projects.length === 0 ? <Empty>Belum ada instruksi. Ketik perintah pertama Anda di atas.</Empty> :
          <ul className="divide-y divide-slate-100">{projects.slice(0, 8).map((p) => {
            const pt = tasks.filter((t) => t.project_id === p.id && !t.parent_task_id); const pct = pt.length ? Math.round((pt.filter((t) => t.status === 'completed').length / pt.length) * 100) : 0;
            return <li key={p.id} className="py-3"><Link href={`/projects/${p.id}`} className="group block"><div className="flex items-center justify-between gap-3"><span className="truncate text-sm font-medium group-hover:text-brand">{p.title}</span><Badge v={p.status} /></div>
              <div className="mt-2 flex items-center gap-3"><div className="flex-1"><Progress value={p.status === 'completed' || p.status === 'awaiting_ceo' ? 100 : pct} /></div><span className="text-xs text-slate-400">{pt.length} tugas · {ago(p.created_at)}</span></div></Link></li>; })}</ul>}
      </section>
      <section className="card p-5"><h2 className="mb-3 font-semibold">Pending approvals</h2>
        {approvals.length === 0 ? <Empty>Tidak ada yang menunggu.</Empty> : <ul className="space-y-2">{approvals.slice(0, 5).map((a) => <li key={a.id}><Link href="/approvals" className="block rounded-lg bg-amber-50 p-3 text-sm hover:bg-amber-100"><div className="font-medium">{a.title}</div><div className="text-xs text-amber-700">{a.action.replace(/_/g, ' ')}</div></Link></li>)}</ul>}
      </section>
      <section className="card p-5 lg:col-span-2"><h2 className="mb-3 font-semibold">Beban kerja agent</h2>
        <div className="grid gap-x-6 gap-y-2.5 sm:grid-cols-2">{st.map(({ agent, status, openTasks }) => <div key={agent.id} className="flex items-center gap-3 text-sm"><span className="text-lg">{agent.avatar}</span><div className="min-w-0 flex-1"><div className="flex justify-between"><span className="truncate">{agent.name}</span><span className="text-xs text-slate-400">{openTasks} tugas</span></div><Progress value={Math.min(100, openTasks * 25)} /></div><Badge v={status} /></div>)}</div>
      </section>
      <section className="card p-5"><h2 className="mb-3 font-semibold">Laporan AI terbaru</h2>
        {reports.length === 0 ? <Empty>Belum ada laporan.</Empty> : <ul className="space-y-2 text-sm">{reports.slice(0, 5).map((p) => <li key={p.id}><Link className="text-brand hover:underline" href={`/projects/${p.id}`}>{p.title}</Link><div className="text-xs text-slate-400">{ago(p.updated_at)}</div></li>)}</ul>}
      </section>
      <section className="card p-5 lg:col-span-3"><h2 className="mb-3 font-semibold">Tugas selesai terbaru</h2>
        {done.length === 0 ? <Empty>Belum ada tugas selesai.</Empty> : <ul className="grid gap-2 sm:grid-cols-2">{done.slice(0, 6).map((t) => { const a = st.find((x) => x.agent.id === t.agent_id)?.agent; return <li key={t.id} className="flex items-center gap-2 text-sm"><span>{a?.avatar}</span><span className="truncate">{t.title}</span><span className="ml-auto shrink-0 text-xs text-slate-400">{ago(t.completed_at)}</span></li>; })}</ul>}
      </section>
    </div>
  </div>;
}
