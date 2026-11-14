import { getCtx } from '@/lib/auth';
import { readAsset } from '@/lib/storage';
export async function GET(_: Request, { params }: { params: Promise<{ name: string }> }) {
  const ctx = await getCtx().catch(() => null); if (!ctx) return new Response('unauthorized', { status: 401 });
  const a = await readAsset(ctx.orgId, (await params).name);
  return a ? new Response(new Uint8Array(a.data), { headers: { 'content-type': a.type, 'cache-control': 'private, max-age=3600' } }) : new Response('not found', { status: 404 });
}
