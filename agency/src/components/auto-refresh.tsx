'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
export function AutoRefresh({ ms = 3000 }: { ms?: number }) {
  const r = useRouter();
  useEffect(() => { const t = setInterval(() => { if (!document.hidden) r.refresh(); }, ms); return () => clearInterval(t); }, [r, ms]);
  return null;
}
