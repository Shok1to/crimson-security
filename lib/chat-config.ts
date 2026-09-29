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

/**
 * Caps on the pre-chat details. Generous — a long name or a number with a
 * country code and extension must fit — but bounded, because both reach an
 * email we send.
 */
export const MAX_LEAD_NAME_CHARS = 120;
export const MAX_LEAD_CONTACT_CHARS = 200;

/**
 * Delivery is the outward-facing side effect, so it gets a far tighter budget
 * than the conversation itself. Three an hour per address covers a visitor who
 * reopens the page a couple of times and stops a script turning the chat limit
 * into an email flood.
 */
export const LEAD_RATE_LIMIT_MAX = 3;
export const LEAD_RATE_LIMIT_WINDOW_MS = 60 * 60_000;

/**
 * The enquiry briefing that rides along with each lead email. Haiku, because
 * this is summarising text that is already in front of it rather than
 * reasoning about anything hard.
 */
export const ANALYSIS_MODEL = 'claude-haiku-4-5';
export const ANALYSIS_MAX_TOKENS = 1024;
/**
 * The contact form's visitor is waiting on this request, so the briefing gets a
 * hard ceiling and the enquiry goes without it rather than late.
 *
 * This is ALSO a safety bound, not just a courtesy. The briefing is awaited
 * before the email is sent, so if the serverless function were killed while a
 * slow analysis was still running, the enquiry would never be sent at all --
 * the silent loss issue #1 exists to prevent. Both routes therefore declare a
 * `maxDuration` that comfortably exceeds this, and
 * tests/route-duration.test.ts fails if the two ever drift apart.
 *
 * Measured at roughly 4.8s per call against the live API.
 */
export const ANALYSIS_TIMEOUT_MS = 8_000;
