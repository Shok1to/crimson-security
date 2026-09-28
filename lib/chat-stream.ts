import type Anthropic from '@anthropic-ai/sdk';
import type { ChatTurn } from '@/lib/enquiry-delivery';

/** One Server-Sent Events frame. JSON.stringify escapes newlines, so a multi-line
 *  payload cannot accidentally terminate the frame early. */
export function sseEvent(event: string, data: unknown): string {
  return `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
}

export function toAnthropicMessages(turns: ChatTurn[]): Anthropic.MessageParam[] {
  return turns.map((t) => ({ role: t.role, content: t.content }));
}

/**
 * Only `tool_use` continues the loop. Everything else ends the turn — including
 * `max_tokens` (a truncated answer) and any stop reason we do not recognise.
 * Defaulting unknown values to "keep looping" would spin.
 */
export function isTerminalStopReason(stopReason: string | null): boolean {
  return stopReason !== 'tool_use';
}
