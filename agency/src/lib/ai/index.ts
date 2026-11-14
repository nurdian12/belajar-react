import { AnthropicProvider } from './anthropic';
import { OpenAIProvider } from './openai';
import { MockProvider } from './mock';
import { ProviderError, type LLMProvider, type LLMRequest, type LLMResponse } from './types';
import { estimateCost } from './pricing';
import { waitForSlot } from './rate-limit';

export function configuredProviders() {
  return { anthropic: !!process.env.ANTHROPIC_API_KEY, openai: !!process.env.OPENAI_API_KEY };
}
export function getProvider(prefer?: string): LLMProvider {
  const c = configuredProviders();
  const want = (prefer || process.env.AI_PROVIDER || '').toLowerCase();
  if (want === 'mock') return new MockProvider();
  if (want === 'openai' && c.openai) return new OpenAIProvider();
  if (want === 'anthropic' && c.anthropic) return new AnthropicProvider();
  if (c.anthropic) return new AnthropicProvider();
  if (c.openai) return new OpenAIProvider();
  return new MockProvider();
}

export interface CallOpts { orgId: string; timeoutMs?: number; retries?: number; perMinute?: number }
/** Rate-limited, timeout-guarded, retrying LLM call with automatic provider fallback (anthropic <-> openai). */
export async function callLLM(req: LLMRequest, opts: CallOpts): Promise<LLMResponse & { costUsd: number; simulated: boolean }> {
  const primary = getProvider();
  const c = configuredProviders();
  const chain: LLMProvider[] = [primary];
  if (primary.name === 'anthropic' && c.openai) chain.push(new OpenAIProvider());
  if (primary.name === 'openai' && c.anthropic) chain.push(new AnthropicProvider());
  let lastErr: unknown;
  for (const p of chain) {
    for (let attempt = 0; attempt <= (opts.retries ?? 2); attempt++) {
      await waitForSlot(`llm:${opts.orgId}`, opts.perMinute ?? 120);
      const ac = new AbortController();
      const timer = setTimeout(() => ac.abort(), opts.timeoutMs ?? 120_000);
      try {
        const r = await p.complete({ ...req, model: p === primary ? req.model : undefined, signal: ac.signal });
        return { ...r, costUsd: p.simulated ? 0 : estimateCost(r.model, r.usage.input, r.usage.output), simulated: p.simulated };
      } catch (e) {
        lastErr = e;
        const retryable = e instanceof ProviderError ? e.retryable : (e as Error).name === 'AbortError';
        if (!retryable) break;
        await new Promise((r) => setTimeout(r, 800 * 2 ** attempt));
      } finally { clearTimeout(timer); }
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error('LLM call failed');
}
