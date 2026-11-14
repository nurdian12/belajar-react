import Link from 'next/link';
import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { CampaignForm } from '@/components/campaign-form';
import { Badge, Empty, PageHeader } from '@/components/ui';

export default async function Campaigns() {
  const ctx = await getCtx(); const s = await getStore();
  const [cs, clients, projects] = await Promise.all([s.list('campaigns', ctx.orgId, {}, { desc: true }), s.list('clients', ctx.orgId), s.list('projects', ctx.orgId)]);
  return <div><PageHeader title="Campaigns" sub="Satu campaign melibatkan banyak AI Agent; hasilnya digabung dalam satu workspace." />
    <details className="mb-6" open={cs.length === 0}><summary className="btn mb-3 w-fit cursor-pointer list-none">+ Campaign baru</summary><CampaignForm clients={clients.map((c) => ({ id: c.id, name: c.name }))} /></details>
    {cs.length === 0 ? <Empty>Belum ada campaign.</Empty> : <div className="grid gap-3 sm:grid-cols-2">{cs.map((c) => { const p = projects.find((x) => x.id === c.project_id); return <Link key={c.id} href={`/campaigns/${c.id}`} className="card p-4 hover:shadow-md"><div className="flex items-start justify-between gap-2"><div className="font-medium">{c.name}</div><Badge v={p?.status ?? c.status} /></div><p className="mt-1 line-clamp-2 text-sm text-slate-500">{c.objective}</p><div className="mt-2 text-xs text-slate-400">{c.platforms.join(' · ')} · Rp{c.budget.toLocaleString('id-ID')}</div></Link>; })}</div>}</div>;
}
