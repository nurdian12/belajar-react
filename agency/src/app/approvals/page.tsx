import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { ACTION_LABEL } from '@/lib/approvals';
import { Badge, Empty, PageHeader, ago } from '@/components/ui';
import { approvalDecision, publishAction } from '../actions';

export default async function Approvals({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams; const ctx = await getCtx(); const s = await getStore();
  const [aps, agents, items] = await Promise.all([s.list('approvals', ctx.orgId, {}, { desc: true }), s.list('ai_agents', ctx.orgId), s.list('content_items', ctx.orgId, { status: 'approved' })]);
  const pending = aps.filter((a) => a.status === 'pending_approval'); const rest = aps.filter((a) => a.status !== 'pending_approval').slice(0, 20);
  return <div><PageHeader title="Approval Center" sub="Semua tindakan berdampak eksternal harus disetujui CEO. AI tidak pernah mempublikasikan/mengirim tanpa persetujuan dan integrasi aktif." />
    {error && <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
    <h2 className="mb-2 font-semibold">Menunggu keputusan ({pending.length})</h2>
    {pending.length === 0 ? <Empty>Tidak ada approval tertunda.</Empty> : <div className="space-y-3">{pending.map((a) => <form key={a.id} action={approvalDecision} className="card p-4"><input type="hidden" name="id" value={a.id} />
      <div className="flex flex-wrap items-center gap-2"><Badge v={a.status} /><span className="rounded bg-slate-100 px-2 py-0.5 text-xs">{ACTION_LABEL[a.action] ?? a.action}</span><span className="text-xs text-slate-400">oleh {agents.find((x) => x.id === a.requested_by_agent_id)?.name ?? 'sistem'} · {ago(a.created_at)}</span></div>
      <div className="mt-2 font-medium">{a.title}</div><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{a.description}</p>
      <div className="mt-3 flex gap-2"><input name="note" className="input" placeholder="Catatan (opsional)" /><button name="decision" value="approved" className="btn">Approve</button><button name="decision" value="rejected" className="btn btn-danger">Reject</button></div></form>)}</div>}
    <h2 className="mb-2 mt-8 font-semibold">Konten approved — siap terbit</h2>
    {items.length === 0 ? <Empty>Belum ada.</Empty> : <div className="space-y-3">{items.map((c) => <div key={c.id} className="card flex flex-wrap items-center gap-3 p-4"><div className="min-w-0 flex-1"><div className="truncate text-sm font-medium">{c.title}</div><div className="text-xs text-slate-500">{c.platform} · {c.type}</div></div>
      <form action={publishAction}><input type="hidden" name="id" value={c.id} /><button className="btn btn-ghost" title="Butuh integrasi platform">Publish via integrasi</button></form>
      <form action={publishAction}><input type="hidden" name="id" value={c.id} /><input type="hidden" name="manual" value="1" /><button className="btn btn-ghost">Tandai terbit manual</button></form></div>)}</div>}
    <h2 className="mb-2 mt-8 font-semibold">Riwayat</h2>
    <div className="card divide-y divide-slate-100">{rest.map((a) => <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 text-sm"><Badge v={a.status} /><span className="flex-1 truncate">{a.title}</span><span className="text-xs text-slate-400">{ago(a.decided_at ?? a.created_at)}</span></div>)}{rest.length === 0 && <div className="p-4 text-sm text-slate-400">Belum ada riwayat.</div>}</div></div>;
}
