import { getCtx } from '@/lib/auth';
import { getStore } from '@/lib/db/store';
export async function GET(req: Request) {
  const ctx = await getCtx().catch(() => null); if (!ctx) return new Response('unauthorized', { status: 401 });
  const u = new URL(req.url); const format = u.searchParams.get('format') ?? 'json'; const status = u.searchParams.get('status');
  const s = await getStore();
  const items = (await s.list('content_items', ctx.orgId, status ? { status } : {}, { desc: true }));
  if (format === 'md') return new Response(items.map((i) => `## ${i.title}\n_${i.platform} · ${i.type} · ${i.status}_\n\n${i.body}\n\n${i.hashtags.map((h) => (h.startsWith('#') ? h : '#' + h)).join(' ')}\n`).join('\n---\n\n'), { headers: { 'content-type': 'text/markdown; charset=utf-8', 'content-disposition': 'attachment; filename="content.md"' } });
  if (format === 'csv') { const q = (v: string) => `"${String(v).replace(/"/g, '""')}"`; return new Response(['platform,type,status,title,body,hashtags', ...items.map((i) => [i.platform, i.type, i.status, q(i.title), q(i.body), q(i.hashtags.join(' '))].join(','))].join('\n'), { headers: { 'content-type': 'text/csv; charset=utf-8', 'content-disposition': 'attachment; filename="content.csv"' } }); }
  return Response.json(items, { headers: { 'content-disposition': 'attachment; filename="content.json"' } });
}
