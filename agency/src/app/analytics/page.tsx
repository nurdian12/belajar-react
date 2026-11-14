import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { fmtUsd } from '@/lib/queries';
import { BarsChart, TrendChart } from '@/components/charts';
import { Empty, PageHeader, Stat } from '@/components/ui';
import { clearSimulated, recordMetric, seedSimulated } from '../actions';
import Link from 'next/link';

export default async function Analytics({ searchParams }: { searchParams: Promise<{ sim?: string }> }) {
  const { sim } = await searchParams; const withSim = sim === '1';
  const ctx = await getCtx(); const s = await getStore();
  const [agents, tasks, camps, content, events, usage, projects] = await Promise.all([s.list('ai_agents', ctx.orgId), s.list('tasks', ctx.orgId), s.list('campaigns', ctx.orgId), s.list('content_items', ctx.orgId), s.list('analytics_events', ctx.orgId), s.list('ai_usage', ctx.orgId), s.list('projects', ctx.orgId)]);
  const ev = events.filter((e) => withSim || e.source === 'real'); const simCount = events.filter((e) => e.source === 'simulated').length;
  const tot = (m: string) => ev.filter((e) => e.metric === m).reduce((a, e) => a + e.value, 0);
  const real = (m: string) => events.filter((e) => e.metric === m && e.source === 'real').reduce((a, e) => a + e.value, 0);
  const leads = tot('leads'), conv = tot('conversions'), clicks = tot('clicks');
  const days = [...new Set(ev.filter((e) => ['impressions', 'clicks', 'conversions'].includes(e.metric)).map((e) => e.occurred_at.slice(0, 10)))].sort();
  const trend = days.map((d) => ({ day: d.slice(5), impressions: ev.filter((e) => e.metric === 'impressions' && e.occurred_at.startsWith(d)).reduce((a, e) => a + e.value, 0) / 10, clicks: ev.filter((e) => e.metric === 'clicks' && e.occurred_at.startsWith(d)).reduce((a, e) => a + e.value, 0), conversions: ev.filter((e) => e.metric === 'conversions' && e.occurred_at.startsWith(d)).reduce((a, e) => a + e.value, 0) }));
  const done = tasks.filter((t) => t.status === 'completed' && !t.parent_task_id);
  const real_cost = usage.filter((u) => !u.simulated).reduce((a, u) => a + u.cost_usd, 0);
  return <div><PageHeader title="Analytics & Performance" sub="Data operasional AI bersifat REAL. Metrik pemasaran hanya real jika diinput/terhubung; data simulasi diberi label.">
    <Link className={`btn ${withSim ? '' : 'btn-ghost'}`} href={withSim ? '/analytics' : '/analytics?sim=1'}>{withSim ? 'Sembunyikan simulasi' : `Tampilkan simulasi (${simCount})`}</Link></PageHeader>
    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Operasional (real)</h2>
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="Total AI employees" value={agents.length} /><Stat label="Agent aktif" value={agents.filter((a) => a.status === 'working').length} /><Stat label="Tugas selesai" value={done.length} /><Stat label="Tugas berjalan" value={tasks.filter((t) => t.status === 'in_progress' && !t.parent_task_id).length} />
      <Stat label="Campaign" value={camps.length} /><Stat label="Konten diproduksi" value={content.length} hint={`${content.filter((c) => c.status === 'approved' || c.status === 'published').length} approved`} /><Stat label="Proyek" value={projects.length} /><Stat label="Biaya AI (real)" value={fmtUsd(real_cost)} hint={usage.some((u) => u.simulated) ? 'mock tidak dihitung' : undefined} /></div>
    <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">Marketing {withSim && <span className="text-fuchsia-600">— termasuk data SIMULASI</span>}</h2>
    <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4"><Stat label="Leads" value={leads.toLocaleString()} hint={withSim && real('leads') !== leads ? `real: ${real('leads')}` : undefined} tone={withSim ? 'sim' : undefined} /><Stat label="Conversion rate" value={clicks ? `${((conv / clicks) * 100).toFixed(1)}%` : '—'} tone={withSim ? 'sim' : undefined} /><Stat label="Klik" value={clicks.toLocaleString()} /><Stat label="ROAS" value={tot('spend') ? (tot('revenue') / tot('spend')).toFixed(2) + '×' : '—'} /></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="card p-5"><h2 className="mb-2 font-semibold">Performa pemasaran</h2>{trend.length ? <TrendChart data={trend} keys={['impressions', 'clicks', 'conversions']} /> : <Empty>Belum ada data real. Input metrik di bawah atau tampilkan data simulasi.</Empty>}<p className="mt-1 text-[11px] text-slate-400">Impressions ditampilkan ÷10.</p></section>
      <section className="card p-5"><h2 className="mb-2 font-semibold">Tugas selesai per agent</h2><BarsChart data={agents.map((a) => ({ name: a.name.split(' ')[0], tasks: a.metrics.tasks_completed }))} dataKey="tasks" /></section>
      <section className="card overflow-x-auto p-5"><h2 className="mb-2 font-semibold">Laporan per agent</h2><table className="w-full text-sm"><thead className="text-left text-xs text-slate-500"><tr><th>Agent</th><th>Selesai</th><th>Gagal</th><th>Avg</th><th>Token</th><th>Biaya</th></tr></thead><tbody>{agents.map((a) => <tr key={a.id} className="border-t border-slate-100"><td className="py-1.5">{a.avatar} {a.name}</td><td>{a.metrics.tasks_completed}</td><td>{a.metrics.tasks_failed}</td><td>{a.metrics.avg_seconds}s</td><td>{a.metrics.tokens.toLocaleString()}</td><td>{fmtUsd(a.metrics.cost_usd)}</td></tr>)}</tbody></table></section>
      <section className="card overflow-x-auto p-5"><h2 className="mb-2 font-semibold">Laporan per campaign</h2>{camps.length === 0 ? <Empty>Belum ada campaign.</Empty> : <table className="w-full text-sm"><thead className="text-left text-xs text-slate-500"><tr><th>Campaign</th><th>Tugas</th><th>Konten</th><th>Impr. (real)</th><th>Konv. (real)</th></tr></thead><tbody>{camps.map((c) => { const pt = tasks.filter((t) => t.project_id === c.project_id && !t.parent_task_id); const e = (m: string) => events.filter((x) => x.campaign_id === c.id && x.metric === m && x.source === 'real').reduce((a, x) => a + x.value, 0);
        return <tr key={c.id} className="border-t border-slate-100"><td className="py-1.5">{c.name}</td><td>{pt.filter((t) => t.status === 'completed').length}/{pt.length}</td><td>{content.filter((x) => x.campaign_id === c.id).length}</td><td>{e('impressions')}</td><td>{e('conversions')}</td></tr>; })}</tbody></table>}</section>
    </div>
    <div className="mt-6 grid gap-6 lg:grid-cols-2">
      <form action={recordMetric} className="card space-y-3 p-5"><h2 className="font-semibold">Input metrik REAL (manual)</h2><p className="text-xs text-slate-500">Belum ada integrasi platform iklan; masukkan angka nyata dari dashboard platform Anda.</p>
        <div className="grid grid-cols-3 gap-2"><select name="metric" className="input">{['impressions', 'clicks', 'leads', 'conversions', 'spend', 'revenue'].map((m) => <option key={m}>{m}</option>)}</select><input name="value" type="number" step="any" required className="input" placeholder="nilai" /><select name="campaign_id" className="input"><option value="">semua</option>{camps.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div><button className="btn">Simpan</button></form>
      <div className="card space-y-3 p-5"><h2 className="font-semibold">Data simulasi</h2><p className="text-xs text-slate-500">Untuk demo UI saja. Selalu diberi label “simulated” dan tidak dicampur dengan data real kecuali Anda mengaktifkannya.</p><div className="flex gap-2"><form action={seedSimulated}><button className="btn btn-ghost">Buat data simulasi</button></form><form action={clearSimulated}><button className="btn btn-danger">Hapus simulasi</button></form></div></div></div></div>;
}
