'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { createCampaign } from '@/app/actions';

const PLATFORMS = ['instagram', 'tiktok', 'facebook', 'youtube', 'linkedin', 'website', 'meta_ads', 'google_ads'];
const schema = z.object({ name: z.string().min(2, 'Nama minimal 2 karakter'), brand: z.string(), client_id: z.string(), objective: z.string().min(3, 'Isi objective'), target_audience: z.string(), budget: z.number({ message: 'Angka' }).min(0), platforms: z.array(z.string()).min(1, 'Pilih minimal 1 platform'), start_date: z.string(), end_date: z.string() });
type V = z.infer<typeof schema>;
export function CampaignForm({ clients }: { clients: { id: string; name: string }[] }) {
  const r = useRouter(); const [err, setErr] = useState('');
  const f = useForm<V>({ resolver: zodResolver(schema), defaultValues: { name: '', brand: '', client_id: '', objective: '', target_audience: '', budget: 0, platforms: ['instagram'], start_date: '', end_date: '' } });
  const e = f.formState.errors;
  const submit = f.handleSubmit(async (v) => { setErr(''); try { const { id } = await createCampaign({ ...v, client_id: v.client_id || null, start_date: v.start_date || null, end_date: v.end_date || null }); r.push(`/campaigns/${id}`); } catch (x) { setErr((x as Error).message); } });
  return <form onSubmit={submit} className="card grid gap-4 p-5 sm:grid-cols-2">
    <div><label className="label">Nama campaign</label><input className="input" {...f.register('name')} />{e.name && <p className="text-xs text-rose-600">{e.name.message}</p>}</div>
    <div><label className="label">Klien</label><select className="input" {...f.register('client_id')}><option value="">— internal —</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
    <div><label className="label">Brand</label><input className="input" {...f.register('brand')} /></div>
    <div><label className="label">Budget (Rp)</label><input type="number" className="input" {...f.register('budget', { valueAsNumber: true })} />{e.budget && <p className="text-xs text-rose-600">{e.budget.message}</p>}</div>
    <div className="sm:col-span-2"><label className="label">Objective</label><textarea rows={2} className="input" {...f.register('objective')} />{e.objective && <p className="text-xs text-rose-600">{e.objective.message}</p>}</div>
    <div className="sm:col-span-2"><label className="label">Target audience</label><input className="input" {...f.register('target_audience')} /></div>
    <div><label className="label">Mulai</label><input type="date" className="input" {...f.register('start_date')} /></div><div><label className="label">Selesai</label><input type="date" className="input" {...f.register('end_date')} /></div>
    <div className="sm:col-span-2"><label className="label">Platform</label><div className="flex flex-wrap gap-3">{PLATFORMS.map((p) => <label key={p} className="flex items-center gap-1.5 text-sm"><input type="checkbox" value={p} {...f.register('platforms')} />{p}</label>)}</div>{e.platforms && <p className="text-xs text-rose-600">{e.platforms.message}</p>}</div>
    {err && <p className="text-sm text-rose-600 sm:col-span-2">{err}</p>}
    <div className="sm:col-span-2"><button className="btn" disabled={f.formState.isSubmitting}>{f.formState.isSubmitting ? 'Mengirim ke AI Manager…' : 'Buat campaign & jalankan tim AI'}</button></div></form>;
}
