import type { TableName, Tables } from './types';

export type NewRow<T extends TableName> = Omit<Tables[T], 'id' | 'created_at' | 'updated_at' | 'org_id'> & Partial<Pick<Tables[T], 'id'>>;
export interface ListOpts { orderBy?: string; desc?: boolean; limit?: number }

/** Every method is tenant-scoped: orgId is mandatory. */
export interface Store {
  insert<T extends TableName>(table: T, orgId: string, row: NewRow<T>): Promise<Tables[T]>;
  update<T extends TableName>(table: T, orgId: string, id: string, patch: Partial<Tables[T]>): Promise<Tables[T]>;
  get<T extends TableName>(table: T, orgId: string, id: string): Promise<Tables[T] | null>;
  list<T extends TableName>(table: T, orgId: string, filter?: Partial<Record<keyof Tables[T] & string, unknown>>, opts?: ListOpts): Promise<Tables[T][]>;
  remove(table: TableName, orgId: string, id: string): Promise<void>;
  /** System-level (cross-tenant) job claim for the worker. Atomic. */
  claimJob(): Promise<Tables['jobs'] | null>;
  /** Organizations list for worker/maintenance. */
  allOrgs(): Promise<Tables['organizations'][]>;
}

export const isSupabaseConfigured = () =>
  !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY);

const g = globalThis as unknown as { __store?: Store };
export async function getStore(): Promise<Store> {
  if (g.__store) return g.__store;
  if (isSupabaseConfigured()) {
    const { SupabaseStore } = await import('./supabase-store');
    g.__store = new SupabaseStore();
  } else {
    const { FileStore } = await import('./file-store');
    g.__store = new FileStore();
  }
  return g.__store;
}
