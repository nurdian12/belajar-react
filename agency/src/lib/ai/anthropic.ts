import { ProviderError, type LLMProvider, type LLMRequest, type LLMResponse } from './types';

export class AnthropicProvider implements LLMProvider {
  name = 'anthropic' as const; simulated = false;
  defaultModel = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5-5';
  async complete(req: LLMRequest): Promise<LLMResponse> {
    const model = req.model || this.defaultModel;
    const body: Record<string, unknown> = {
      model, max_tokens: req.maxTokens ?? 4096, system: req.system, messages: req.messages,
      ...(req.temperature !== undefined ? { temperature: req.temperature } : {}),
    };
    if (req.tools?.length) {
      body.tools = req.tools;
      if (req.forceTool) body.tool_choice = { type: 'tool', name: req.forceTool };
    }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST', signal: req.signal,
      headers: { 'content-type': 'application/json', 'x-api-key': process.env.ANTHROPIC_API_KEY!, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new ProviderError(`Anthropic ${res.status}: ${t.slice(0, 300)}`, res.status, res.status === 429 || res.status >= 500);
    }
    const j: any = await res.json();
    const blocks: any[] = j.content ?? [];
    return {
      text: blocks.filter((b) => b.type === 'text').map((b) => b.text).join('\n'),
      toolCalls: blocks.filter((b) => b.type === 'tool_use').map((b) => ({ id: b.id, name: b.name, input: b.input ?? {} })),
      usage: { input: j.usage?.input_tokens ?? 0, output: j.usage?.output_tokens ?? 0 },
      stopReason: j.stop_reason ?? '', model: j.model ?? model, provider: 'anthropic',
    };
  }
}
