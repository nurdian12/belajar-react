import './globals.css';
import type { Metadata } from 'next';
import { Sidebar } from '@/components/sidebar';
import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
import { getProvider } from '@/lib/ai';
import { kick } from '@/lib/queue';

export const metadata: Metadata = { title: 'AI Digital Marketing Agency', description: 'Perusahaan digital marketing virtual yang dijalankan AI Agent' };
export const dynamic = 'force-dynamic';

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let shell: React.ReactNode = children;
  try {
    const ctx = await getCtx(); const s = await getStore(); kick();
    const pending = (await s.list('approvals', ctx.orgId, { status: 'pending_approval' })).length;
    const org = (await s.get('organizations', ctx.orgId, ctx.orgId))?.name ?? 'Agency';
    const prov = getProvider();
    shell = <>
      <Sidebar pending={pending} org={org} demo={ctx.demo} />
      <main className="min-h-screen px-4 pb-10 pt-14 lg:ml-64 lg:px-8 lg:pt-8">
        {prov.simulated && <div className="mb-4 rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-4 py-2 text-xs text-fuchsia-800">⚠️ Provider AI belum dikonfigurasi — memakai <b>MOCK adapter</b> (hanya untuk development). Output bersifat simulasi. Setel <code>ANTHROPIC_API_KEY</code> atau <code>OPENAI_API_KEY</code> di server.</div>}
        {children}
      </main></>;
  } catch (e) { if ((e as Error).message !== 'UNAUTHENTICATED') throw e; shell = <main className="p-6">{children}</main>; }
  return <html lang="id"><body>{shell}</body></html>;
}
