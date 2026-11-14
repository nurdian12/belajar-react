import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { Badge, Empty, PageHeader } from '@/components/ui';
import { generateContent, requestContentApproval } from '../actions';

const PLATFORMS = ['instagram', 'tiktok', 'facebook', 'youtube', 'linkedin', 'website'];
const KINDS = [['ideas', 'Ide konten'], ['caption', 'Caption'], ['hashtags', 'Hashtag'], ['hooks', 'Hook'], ['carousel', 'Konsep carousel'], ['video_script', 'Script video'], ['calendar', 'Kalender konten'], ['creative_brief', 'Creative brief'], ['image', 'Aset gambar (butuh provider)']];
const TEMPLATES: Record<string, string> = { instagram: 'Feed/Carousel/Reels — hook kuat, caption ≤2200 char, 5-10 hashtag', tiktok: 'Video vertikal 15-45s, hook 3 detik, teks layar, trending sound', facebook: 'Post komunitas, cerita + CTA, grup & iklan', youtube: 'Judul + deskripsi SEO, script long-form/Shorts', linkedin: 'Thought leadership, storytelling profesional', website: 'Landing page / blog SEO' };
export default async function Content({ searchParams }: { searchParams: Promise<{ status?: string; platform?: string }> }) {
  const q = await searchParams; const ctx = await getCtx(); const s = await getStore();
  const [all, clients] = await Promise.all([s.list('content_items', ctx.orgId, {}, { desc: true }), s.list('clients', ctx.orgId)]);
  const items = all.filter((i) => (!q.status || i.status === q.status) && (!q.platform || i.platform === q.platform));
  return <div><PageHeader title="Content Factory" sub="Produksi konten oleh agent yang tepat. Semua output berstatus Draft sampai Anda menyetujui.">
    <a className="btn btn-ghost" href="/api/export?format=md">Export .md</a><a className="btn btn-ghost" href="/api/export?format=csv">Export .csv</a><a className="btn btn-ghost" href="/api/export?format=json">.json</a></PageHeader>
    <form action={generateContent} className="card mb-6 grid gap-3 p-5 sm:grid-cols-6">
      <div className="sm:col-span-2"><label className="label">Platform (template)</label><select name="platform" className="input">{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select></div>
      <div className="sm:col-span-2"><label className="label">Jenis</label><select name="kind" className="input">{KINDS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
      <div><label className="label">Jumlah</label><input name="count" type="number" min={1} max={30} defaultValue={5} className="input" /></div>
      <div><label className="label">Klien</label><select name="client_id" className="input"><option value="">—</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
      <div className="sm:col-span-4"><label className="label">Topik / brief</label><input name="topic" required minLength={3} className="input" placeholder="mis. promo kopi susu gula aren untuk mahasiswa" /></div>
      <div className="sm:col-span-2"><label className="label">Tone (opsional)</label><input name="tone" className="input" placeholder="santai, edukatif…" /></div>
      <div className="sm:col-span-6 flex items-center gap-3"><button className="btn">Generate</button><span className="text-xs text-slate-400">Template: {TEMPLATES[PLATFORMS[0]]} (lihat per platform di bawah)</span></div></form>
    <details className="mb-5 text-xs text-slate-500"><summary className="cursor-pointer">Template platform</summary><ul className="mt-2 space-y-1">{Object.entries(TEMPLATES).map(([k, v]) => <li key={k}><b>{k}</b>: {v}</li>)}</ul></details>
    <form className="mb-4 flex gap-2"><select name="platform" defaultValue={q.platform ?? ''} className="input !w-auto"><option value="">Semua platform</option>{PLATFORMS.map((p) => <option key={p}>{p}</option>)}</select><select name="status" defaultValue={q.status ?? ''} className="input !w-auto"><option value="">Semua status</option>{['draft', 'pending_approval', 'approved', 'rejected', 'published'].map((p) => <option key={p}>{p}</option>)}</select><button className="btn btn-ghost">Filter</button></form>
    {items.length === 0 ? <Empty>Belum ada konten.</Empty> : <div className="grid gap-3 md:grid-cols-2">{items.map((i) => <div key={i.id} className="card flex flex-col p-4"><div className="mb-2 flex items-center gap-2"><Badge v={i.status} /><span className="text-xs text-slate-500">{i.platform} · {i.type}</span></div><div className="text-sm font-medium">{i.title}</div>
      {i.asset_url && <img src={i.asset_url} alt="" className="mt-2 max-h-48 rounded-lg" />}
      <p className="mt-1 line-clamp-6 whitespace-pre-wrap text-sm text-slate-600">{i.body}</p>{i.hashtags.length > 0 && <p className="mt-1 text-xs text-brand">{i.hashtags.map((h) => (h.startsWith('#') ? h : '#' + h)).join(' ')}</p>}
      {i.status === 'draft' && <form action={requestContentApproval} className="mt-3"><input type="hidden" name="id" value={i.id} /><button className="btn btn-ghost">Ajukan approval</button></form>}</div>)}</div>}</div>;
}
