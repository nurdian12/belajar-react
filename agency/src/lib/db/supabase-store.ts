// Production store: Supabase PostgreSQL via service role (server only). Every query is filtered by org_id.
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { ListOpts, NewRow, Store } from './store';
import type { TableName, Tables } from './types';

export class SupabaseStore implements Store {
  private sb: SupabaseClient;
  constructor() {
    this.sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  }
  private ck<T>(r: { data: T | null; error: { message: string } | null }, ctx: string): T {
    if (r.error) throw new Error(`${ctx}: ${r.error.message}`);
    return r.data as T;
  }
  async insert<T extends TableName>(table: T, orgId: string, row: NewRow<T>) {
    return this.ck(await this.sb.from(table).insert({ ...row, org_id: orgId }).select().single(), `insert ${table}`) as Tables[T];
  }
  async update<T extends TableName>(table: T, orgId: string, id: string, patch: Partial<Tables[T]>) {
    return this.ck(await this.sb.from(table).update({ ...patch, updated_at: new Date().toISOString() }).eq('id', id).eq('org_id', orgId).select().single(), `update ${table}`) as Tables[T];
  }
  async get<T extends TableName>(table: T, orgId: string, id: string) {
    return this.ck(await this.sb.from(table).select('*').eq('id', id).eq('org_id', orgId).maybeSingle(), `get ${table}`) as Tables[T] | null;
  }
  async list<T extends TableName>(table: T, orgId: string, filter: Record<string, unknown> = {}, opts: ListOpts = {}) {
    let q = this.sb.from(table).select('*').eq('org_id', orgId);
    for (const [k, v] of Object.entries(filter)) q = Array.isArray(v) ? q.in(k, v) : v === null ? q.is(k, null) : q.eq(k, v as never);
    q = q.order(opts.orderBy ?? 'created_at', { ascending: !opts.desc });
    if (opts.limit) q = q.limit(opts.limit);
    return this.ck(await q, `list ${table}`) as Tables[T][];
  }
  async remove(table: TableName, orgId: string, id: string) {
    this.ck(await this.sb.from(table).delete().eq('id', id).eq('org_id', orgId), `remove ${table}`);
  }
  async claimJob() {
    const now = new Date().toISOString();
    const stale = new Date(Date.now() - 5 * 60_000).toISOString();
    const { data } = await this.sb.from('jobs').select('*')
      .or(`and(status.eq.pending,run_at.lte.${now}),and(status.eq.running,locked_at.lt.${stale})`).order('run_at').limit(1);
    const j = data?.[0];
    if (!j) return null;
    // optimistic lock: only succeeds if nobody else claimed it first
    const { data: upd } = await this.sb.from('jobs')
      .update({ status: 'running', locked_at: now, attempts: j.attempts + 1, updated_at: now })
      .eq('id', j.id).eq('status', j.status).eq('attempts', j.attempts).select();
    return (upd?.[0] as Tables['jobs']) ?? null;
  }
  async allOrgs() { return this.ck(await this.sb.from('organizations').select('*'), 'orgs') as Tables['organizations'][]; }
}
