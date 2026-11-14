import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { Badge, Empty, PageHeader } from '@/components/ui';
import { addClientDocument, saveBrand, saveClient } from '@/app/actions';

export default async function ClientPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await getCtx(); const s = await getStore(); const { id } = await params;
  const c = await s.get('clients', ctx.orgId, id); if (!c) notFound();
  const [brands, docs, projects, camps, mems] = await Promise.all([s.list('brands', ctx.orgId, { client_id: id }), s.list('client_documents', ctx.orgId, { client_id: id }), s.list('projects', ctx.orgId, { client_id: id }, { desc: true }), s.list('campaigns', ctx.orgId, { client_id: id }), s.list('agent_memories', ctx.orgId, { client_id: id })]);
  const b = brands[0];
  return <div><PageHeader title={c.name} sub={`${c.industry || 'Klien'} · workspace terpisah (${mems.length} memori AI khusus klien ini)`} />
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={saveClient} className="card space-y-3 p-5"><h2 className="font-semibold">Profil klien</h2><input type="hidden" name="id" value={c.id} />
        {(['name', 'industry', 'website', 'contact_email'] as const).map((k) => <div key={k}><label className="label">{k}</label><input name={k} defaultValue={c[k]} className="input" /></div>)}
        {(['products', 'target_audience', 'competitors', 'marketing_history', 'notes'] as const).map((k) => <div key={k}><label className="label">{k.replace('_', ' ')}</label><textarea name={k} rows={2} defaultValue={c[k]} className="input" /></div>)}<button className="btn">Simpan</button></form>
      <div className="space-y-6">
        <form action={saveBrand} className="card space-y-3 p-5"><h2 className="font-semibold">Brand & guidelines</h2><input type="hidden" name="client_id" value={c.id} />
          <div><label className="label">Nama brand</label><input name="name" defaultValue={b?.name ?? c.name} className="input" /></div>
          <div><label className="label">Guidelines</label><textarea name="guidelines" rows={3} defaultValue={b?.guidelines} className="input" /></div>
          <div><label className="label">Tone of voice</label><input name="tone_of_voice" defaultValue={b?.tone_of_voice} className="input" /></div>
          <div className="grid grid-cols-2 gap-3"><div><label className="label">Warna</label><input name="colors" defaultValue={b?.colors} className="input" /></div><div><label className="label">Keyword</label><input name="keywords" defaultValue={b?.keywords} className="input" /></div></div><button className="btn">Simpan brand</button></form>
        <div className="card p-5"><h2 className="mb-3 font-semibold">Dokumen klien</h2>{docs.length === 0 ? <Empty>Belum ada dokumen.</Empty> : <ul className="mb-3 space-y-1 text-sm">{docs.map((d) => <li key={d.id} className="rounded bg-slate-50 px-3 py-1.5">📄 {d.title} <span className="text-xs text-slate-400">({d.content.length} char)</span></li>)}</ul>}
          <form action={addClientDocument} className="space-y-2"><input type="hidden" name="client_id" value={c.id} /><input name="title" placeholder="Judul" className="input" /><textarea name="content" rows={3} placeholder="Tempel isi dokumen, atau unggah file teks…" className="input" /><input type="file" name="file" accept=".txt,.md,.csv" className="text-xs" /><button className="btn btn-ghost">Tambah dokumen (masuk konteks AI)</button></form></div></div>
      <div className="card p-5"><h2 className="mb-3 font-semibold">Riwayat proyek</h2>{projects.length === 0 ? <Empty>Belum ada.</Empty> : <ul className="space-y-2 text-sm">{projects.map((p) => <li key={p.id} className="flex items-center gap-2"><Link href={`/projects/${p.id}`} className="flex-1 truncate hover:text-brand">{p.title}</Link><Badge v={p.status} /></li>)}</ul>}</div>
      <div className="card p-5"><h2 className="mb-3 font-semibold">Campaign</h2>{camps.length === 0 ? <Empty>Belum ada.</Empty> : <ul className="space-y-2 text-sm">{camps.map((x) => <li key={x.id}><Link href={`/campaigns/${x.id}`} className="hover:text-brand">{x.name}</Link></li>)}</ul>}</div></div></div>;
}
