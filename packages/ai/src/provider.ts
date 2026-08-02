import type { AiTool } from './tools';

/** Provider abstraction so the model vendor is swappable (ARCHITECTURE.md sec 8). */
export type AiMessage = { role: 'system' | 'user' | 'assistant'; content: string };

export type AiProvider = {
  readonly id: string;
  /** Explain a pre-built evidence bundle. No tool calls that mutate; read tools only. */
  complete(input: { messages: AiMessage[]; tools?: AiTool[]; maxTokens?: number }): Promise<string>;
};

/** Deterministic fallback used in tests and when no API key is configured. */
export const echoProvider: AiProvider = {
  id: 'echo',
  async complete({ messages }) {
    return messages.at(-1)?.content ?? '';
  },
};

/**
 * Anthropic-backed provider. Lazy-imports the SDK so the package builds without it
 * installed at type-check time; constructs the client only when a key is present.
 */
export function anthropicProvider(model = 'claude-opus-4-8'): AiProvider {
  return {
    id: `anthropic:${model}`,
    async complete({ messages, maxTokens = 1024 }) {
      const key = process.env.ANTHROPIC_API_KEY;
      if (!key) return echoProvider.complete({ messages });
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: key });
      const system = messages.find((m) => m.role === 'system')?.content;
      const res = await client.messages.create({
        model,
        max_tokens: maxTokens,
        system,
        messages: messages
          .filter((m) => m.role !== 'system')
          .map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      });
      return res.content
        .map((c) => (c.type === 'text' ? c.text : ''))
        .join('')
        .trim();
    },
  };
}
