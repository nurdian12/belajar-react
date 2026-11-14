import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { getStore, isSupabaseConfigured } from './db/store';
import { ensureOrgSeeded } from './seed';

export interface Ctx { orgId: string; userId: string | null; email: string | null; demo: boolean }
export const DEMO_ORG_ID = '00000000-0000-4000-8000-000000000001';

export async function supabaseServer() {
  const jar = await cookies();
  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    cookies: {
      getAll: () => jar.getAll(),
      setAll: (list) => { try { list.forEach(({ name, value, options }) => jar.set(name, value, options)); } catch { /* server component */ } },
    },
  });
}

/** Resolve the tenant for the current request. Throws if unauthenticated (when Supabase auth is on). */
export async function getCtx(): Promise<Ctx> {
  if (!isSupabaseConfigured()) {
    await ensureOrgSeeded(DEMO_ORG_ID, 'Demo Agency');
    return { orgId: DEMO_ORG_ID, userId: null, email: 'ceo@demo.local', demo: true };
  }
  const sb = await supabaseServer();
  const { data } = await sb.auth.getUser();
  if (!data.user) throw new Error('UNAUTHENTICATED');
  const store = await getStore();
  let orgId: string | null = null;
  const { data: prof } = await (await import('@supabase/supabase-js')).createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!).from('profiles').select('org_id').eq('id', data.user.id).maybeSingle();
  orgId = prof?.org_id ?? null;
  if (!orgId) {
    const { randomUUID } = await import('node:crypto');
    orgId = randomUUID();
    const admin = (await import('@supabase/supabase-js')).createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    await admin.from('organizations').insert({ id: orgId, name: `${data.user.email?.split('@')[0] ?? 'My'} Agency`, owner_id: data.user.id });
    await admin.from('profiles').insert({ id: data.user.id, org_id: orgId, full_name: data.user.email, role: 'ceo' });
  }
  void store;
  await ensureOrgSeeded(orgId, 'My Agency');
  return { orgId, userId: data.user.id, email: data.user.email ?? null, demo: false };
}
