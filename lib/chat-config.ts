/** Single place to tune the chatbot's model and limits. */

/** Haiku 4.5. No date suffix — the ID is complete as-is. */
export const CHAT_MODEL = 'claude-haiku-4-5';

/**
 * Deliberately low. FAQ answers should be short, the system prompt asks for
 * brevity, and streaming means HTTP timeouts are not a concern. Caps worst-case
 * output cost at roughly $0.01 per response.
 */
export const MAX_OUTPUT_TOKENS = 2048;

export const MAX_USER_MESSAGE_CHARS = 1000;
export const MAX_MESSAGES = 24;
/** Sanity bound only — 12 assistant replies at max_tokens is already ~96k chars. */
export const MAX_PAYLOAD_CHARS = 100_000;

export const RATE_LIMIT_MAX = 15;
export const RATE_LIMIT_WINDOW_MS = 60_000;
