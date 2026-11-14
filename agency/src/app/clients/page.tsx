import Link from 'next/link';
import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { Empty, PageHeader } from '@/components/ui';
import { saveClient } from '../actions';

export default async function Clients() {
  const ctx = await getCtx(); const s = await getStore(); const [cs, ps] = await Promise.all([s.list('clients', ctx.orgId), s.list('projects', ctx.orgId)]);
  return <div><PageHeader title="Client Management" sub="Setiap klien punya workspace, brand, dokumen, dan memori AI yang terpisah." />
    <details className="mb-6" open={cs.length === 0}><summary className="btn mb-3 w-fit cursor-pointer list-none">+ Klien baru</summary><form action={saveClient} className="card grid gap-3 p-5 sm:grid-cols-2">
      {[['name', 'Nama klien *'], ['industry', 'Industri'], ['website', 'Website'], ['contact_email', 'Email kontak']].map(([k, l]) => <div key={k}><label className="label">{l}</label><input name={k} required={k === 'name'} className="input" /></div>)}
      {[['products', 'Produk & layanan'], ['target_audience', 'Target audiens'], ['competitors', 'Kompetitor'], ['marketing_history', 'Riwayat marketing']].map(([k, l]) => <div key={k} className="sm:col-span-2"><label className="label">{l}</label><textarea name={k} rows={2} className="input" /></div>)}
      <div><button className="btn">Simpan klien</button></div></form></details>
    {cs.length === 0 ? <Empty>Belum ada klien.</Empty> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{cs.map((c) => <Link key={c.id} href={`/clients/${c.id}`} className="card p-4 hover:shadow-md"><div className="font-medium">{c.name}</div><div className="text-xs text-slate-500">{c.industry || '—'}</div><div className="mt-2 text-xs text-slate-400">{ps.filter((p) => p.client_id === c.id).length} proyek</div></Link>)}</div>}</div>;
}
