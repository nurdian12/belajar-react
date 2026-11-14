// Local development store: JSON file persisted on disk. NOT for production (use Supabase).
import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import type { ListOpts, NewRow, Store } from './store';
import type { TableName, Tables } from './types';

type Row = Record<string, any>;
export class FileStore implements Store {
  private data: Record<string, Row[]> = {};
  private file: string;
  private timer: NodeJS.Timeout | null = null;
  constructor(file = process.env.DEV_DB_FILE || path.join(process.cwd(), '.data', 'db.json')) {
    this.file = file;
    try { this.data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { this.data = {}; }
  }
  private persist() {
    if (this.file === ':memory:' || this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      try { fs.mkdirSync(path.dirname(this.file), { recursive: true }); fs.writeFileSync(this.file, JSON.stringify(this.data)); } catch { /* ignore */ }
    }, 150);
  }
  private t(table: string) { return (this.data[table] ??= []); }
  async insert<T extends TableName>(table: T, orgId: string, row: NewRow<T>) {
    const now = new Date().toISOString();
    const full = { ...(row as Row), id: (row as Row).id ?? randomUUID(), org_id: orgId, created_at: now, updated_at: now };
    this.t(table).push(full); this.persist();
    return structuredClone(full) as Tables[T];
  }
  async update<T extends TableName>(table: T, orgId: string, id: string, patch: Partial<Tables[T]>) {
    const r = this.t(table).find((x) => x.id === id && x.org_id === orgId);
    if (!r) throw new Error(`${table}/${id} not found`);
    Object.assign(r, patch, { updated_at: new Date().toISOString() }); this.persist();
    return structuredClone(r) as Tables[T];
  }
  async get<T extends TableName>(table: T, orgId: string, id: string) {
    const r = this.t(table).find((x) => x.id === id && x.org_id === orgId);
    return r ? (structuredClone(r) as Tables[T]) : null;
  }
  async list<T extends TableName>(table: T, orgId: string, filter: Record<string, unknown> = {}, opts: ListOpts = {}) {
    let rows = this.t(table).filter((r) => r.org_id === orgId && Object.entries(filter).every(([k, v]) => (Array.isArray(v) ? v.includes(r[k]) : r[k] === v)));
    const ob = opts.orderBy ?? 'created_at';
    rows = rows.sort((a, b) => (a[ob] > b[ob] ? 1 : a[ob] < b[ob] ? -1 : 0));
    if (opts.desc) rows.reverse();
    if (opts.limit) rows = rows.slice(0, opts.limit);
    return structuredClone(rows) as Tables[T][];
  }
  async remove(table: TableName, orgId: string, id: string) {
    this.data[table] = this.t(table).filter((x) => !(x.id === id && x.org_id === orgId)); this.persist();
  }
  async claimJob() {
    const now = new Date().toISOString();
    const stale = Date.now() - 5 * 60_000;
    const j = this.t('jobs')
      .filter((x) => (x.status === 'pending' && x.run_at <= now) || (x.status === 'running' && x.locked_at && Date.parse(x.locked_at) < stale))
      .sort((a, b) => (a.run_at > b.run_at ? 1 : -1))[0];
    if (!j) return null;
    Object.assign(j, { status: 'running', locked_at: now, attempts: j.attempts + 1, updated_at: now }); this.persist();
    return structuredClone(j) as Tables['jobs'];
  }
  async allOrgs() { return structuredClone(this.t('organizations')) as Tables['organizations'][]; }
}
