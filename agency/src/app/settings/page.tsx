import { getCtx } from '@/lib/auth';
import { getStore, isSupabaseConfigured } from '@/lib/db/store';
import { configuredProviders, getProvider } from '@/lib/ai';
import { ACTION_LABEL } from '@/lib/approvals';
import { Badge, PageHeader } from '@/components/ui';
import { logout, saveSettings } from '../actions';

export default async function Settings() {
  const ctx = await getCtx(); const s = await getStore(); const org = (await s.get('organizations', ctx.orgId, ctx.orgId))!; const integ = await s.list('integrations', ctx.orgId);
  const c = configuredProviders(); const p = getProvider(); const month = new Date().toISOString().slice(0, 7);
  const spent = (await s.list('ai_usage', ctx.orgId)).filter((u) => u.created_at.startsWith(month)).reduce((a, u) => a + u.cost_usd, 0);
  const row = (l: string, ok: boolean, extra = '') => <li className="flex items-center justify-between py-2 text-sm"><span>{l} <span className="text-xs text-slate-400">{extra}</span></span><Badge v={ok ? 'active' : 'draft'}>{ok ? 'terkonfigurasi' : 'belum'}</Badge></li>;
  return <div><PageHeader title="Settings" sub="Kunci API hanya dibaca di server dari environment variable — tidak pernah dikirim ke browser.">{!ctx.demo && <form action={logout}><button className="btn btn-ghost">Keluar</button></form>}</PageHeader>
    <div className="grid gap-6 lg:grid-cols-2">
      <form action={saveSettings} className="card space-y-4 p-5"><h2 className="font-semibold">Organisasi & kebijakan approval CEO</h2>
        <div><label className="label">Nama perusahaan</label><input name="name" defaultValue={org.name} className="input" /></div>
        <div><label className="label">Batas biaya AI per bulan (USD, 0 = tanpa batas) — terpakai {spent.toFixed(2)}</label><input name="budget" type="number" step="1" defaultValue={Number((org.settings as any).monthly_ai_budget_usd ?? 0)} className="input" /></div>
        <div><div className="label">Tindakan yang wajib approval</div>{Object.entries(org.approval_policy).map(([k, v]) => <label key={k} className="flex items-center gap-2 py-1 text-sm"><input type="checkbox" name={`p_${k}`} defaultChecked={!!v} disabled={k === 'project_delivery'} />{ACTION_LABEL[k] ?? k}</label>)}</div><button className="btn">Simpan</button></form>
      <div className="space-y-6">
        <section className="card p-5"><h2 className="font-semibold">Provider AI</h2><ul className="divide-y divide-slate-100">{row('Anthropic', c.anthropic, process.env.ANTHROPIC_MODEL ?? '')}{row('OpenAI', c.openai)}</ul>
          <p className="mt-2 text-sm">Aktif: <b>{p.name}</b> ({p.defaultModel}){p.simulated && <span className="ml-2 text-fuchsia-600">Local Template Engine (tanpa API key, bukan model AI)</span>}</p></section>
        <section className="card p-5"><h2 className="font-semibold">Infrastruktur</h2><ul className="divide-y divide-slate-100">{row('Supabase (DB/Auth/Storage)', isSupabaseConfigured(), isSupabaseConfigured() ? '' : 'mode demo: file lokal .data/')}{row('Image generation', !!process.env.OPENAI_API_KEY, 'OpenAI Images')}{row('Video generation', false, 'belum ada provider')}</ul></section>
        <section className="card p-5"><h2 className="font-semibold">Integrasi platform</h2><p className="mb-2 text-xs text-slate-500">Konektor publish/iklan/email belum diimplementasikan; AI tidak akan mengklaim terkirim/terbit.</p><ul className="divide-y divide-slate-100">{integ.map((i) => <li key={i.id} className="flex items-center justify-between py-1.5 text-sm"><span>{i.provider}</span><Badge v={i.status === 'connected' ? 'active' : 'draft'}>{i.status === 'connected' ? 'terhubung' : 'belum dikonfigurasi'}</Badge></li>)}</ul></section></div></div></div>;
}
