export type Block =
  | { type: 'text'; text: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean };
export interface Msg { role: 'user' | 'assistant'; content: Block[] }
export interface ToolDef { name: string; description: string; input_schema: Record<string, unknown> }
export interface LLMRequest {
  system: string; messages: Msg[]; tools?: ToolDef[]; forceTool?: string; maxTokens?: number; temperature?: number;
  signal?: AbortSignal; model?: string;
}
export interface LLMResponse {
  text: string; toolCalls: { id: string; name: string; input: Record<string, unknown> }[];
  usage: { input: number; output: number }; stopReason: string; model: string; provider: string;
}
/** Adapter pattern: swap models without touching orchestration code. */
export interface LLMProvider { name: 'anthropic' | 'openai' | 'mock'; simulated: boolean; defaultModel: string; complete(req: LLMRequest): Promise<LLMResponse> }

export class ProviderError extends Error {
  constructor(message: string, public status?: number, public retryable = false) { super(message); }
}
