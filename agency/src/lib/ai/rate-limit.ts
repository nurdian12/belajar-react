// In-process token bucket. For multi-instance deployments swap for Redis/Upstash behind the same interface.
interface Bucket { tokens: number; last: number }
const buckets = new Map<string, Bucket>();
export function tryTake(key: string, perMinute: number): boolean {
  const now = Date.now(); const b = buckets.get(key) ?? { tokens: perMinute, last: now };
  b.tokens = Math.min(perMinute, b.tokens + ((now - b.last) / 60_000) * perMinute); b.last = now;
  const ok = b.tokens >= 1; if (ok) b.tokens -= 1; buckets.set(key, b); return ok;
}
export async function waitForSlot(key: string, perMinute: number, maxWaitMs = 30_000): Promise<void> {
  const start = Date.now();
  while (!tryTake(key, perMinute)) {
    if (Date.now() - start > maxWaitMs) throw new Error(`Rate limit exceeded for ${key}`);
    await new Promise((r) => setTimeout(r, 500));
  }
}
