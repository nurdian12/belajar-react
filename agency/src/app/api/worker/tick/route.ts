import { NextResponse } from 'next/server';
import { drain } from '@/lib/queue';
export const maxDuration = 300;
// Serverless worker: call from a cron (e.g. Vercel Cron every minute) with Authorization: Bearer $CRON_SECRET
export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get('authorization') !== `Bearer ${secret}`) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  return NextResponse.json({ processed: await drain(20) });
}
export const POST = GET;
