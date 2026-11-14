import { ProviderError, type LLMProvider, type LLMRequest, type LLMResponse } from './types';

export class OpenAIProvider implements LLMProvider {
  name = 'openai' as const; simulated = false;
  defaultModel = process.env.OPENAI_MODEL || 'gpt-4o';
  async complete(req: LLMRequest): Promise<LLMResponse> {
    const model = req.model || this.defaultModel;
    const messages: any[] = [{ role: 'system', content: req.system }];
    for (const m of req.messages) {
      if (m.role === 'assistant') {
        const text = m.content.filter((b) => b.type === 'text').map((b: any) => b.text).join('\n');
        const calls = m.content.filter((b) => b.type === 'tool_use').map((b: any) => ({ id: b.id, type: 'function', function: { name: b.name, arguments: JSON.stringify(b.input) } }));
        messages.push({ role: 'assistant', content: text || null, ...(calls.length ? { tool_calls: calls } : {}) });
      } else {
        for (const b of m.content) {
          if (b.type === 'tool_result') messages.push({ role: 'tool', tool_call_id: b.tool_use_id, content: b.content });
          else if (b.type === 'text') messages.push({ role: 'user', content: b.text });
        }
      }
    }
    const body: Record<string, unknown> = { model, messages, max_completion_tokens: req.maxTokens ?? 4096, ...(req.temperature !== undefined ? { temperature: req.temperature } : {}) };
    if (req.tools?.length) {
      body.tools = req.tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema } }));
      if (req.forceTool) body.tool_choice = { type: 'function', function: { name: req.forceTool } };
    }
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST', signal: req.signal,
      headers: { 'content-type': 'application/json', authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => '');
      throw new ProviderError(`OpenAI ${res.status}: ${t.slice(0, 300)}`, res.status, res.status === 429 || res.status >= 500);
    }
    const j: any = await res.json();
    const msg = j.choices?.[0]?.message ?? {};
    const toolCalls = (msg.tool_calls ?? []).map((c: any) => {
      let input: Record<string, unknown> = {};
      try { input = JSON.parse(c.function.arguments || '{}'); } catch { /* malformed args -> empty */ }
      return { id: c.id, name: c.function.name, input };
    });
    return {
      text: msg.content ?? '', toolCalls, usage: { input: j.usage?.prompt_tokens ?? 0, output: j.usage?.completion_tokens ?? 0 },
      stopReason: j.choices?.[0]?.finish_reason ?? '', model: j.model ?? model, provider: 'openai',
    };
  }
}
