import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import { isSupabaseConfigured } from './db/store';

const BUCKET = 'agency-assets';
const dir = (org: string) => path.join(process.cwd(), '.data', 'assets', org);
export async function saveAsset(orgId: string, name: string, data: Buffer, contentType = 'image/png'): Promise<string> {
  const safe = name.replace(/[^a-zA-Z0-9._-]/g, '_');
  if (isSupabaseConfigured()) {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { error } = await sb.storage.from(BUCKET).upload(`${orgId}/${safe}`, data, { contentType, upsert: true });
    if (error) throw new Error(`Storage upload failed: ${error.message}`);
  } else { fs.mkdirSync(dir(orgId), { recursive: true }); fs.writeFileSync(path.join(dir(orgId), safe), data); }
  return `/api/assets/${safe}`;
}
export async function readAsset(orgId: string, name: string): Promise<{ data: Buffer; type: string } | null> {
  const safe = path.basename(name);
  const type = safe.endsWith('.png') ? 'image/png' : safe.endsWith('.jpg') ? 'image/jpeg' : 'application/octet-stream';
  if (isSupabaseConfigured()) {
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data } = await sb.storage.from(BUCKET).download(`${orgId}/${safe}`);   // org prefix = tenant isolation
    return data ? { data: Buffer.from(await data.arrayBuffer()), type } : null;
  }
  try { return { data: fs.readFileSync(path.join(dir(orgId), safe)), type }; } catch { return null; }
}
