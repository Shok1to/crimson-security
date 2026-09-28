import Anthropic from '@anthropic-ai/sdk';

export interface FailureDescription {
  /** Shown to the visitor. Deliberately generic — no internal detail leaks. */
  message: string;
  /** Written to the server log. Never carries personal data. */
  log: string;
}

const GENERIC: FailureDescription = {
  message: 'Something went wrong. Please try again.',
  log: 'unexpected failure',
};

/**
 * Spec section 10: typed SDK classes, never string-matched, and no internal
 * detail to the browser. Branch order matters — the hierarchy runs
 * RateLimitError/AuthenticationError -> APIConnectionError -> APIError ->
 * AnthropicError, so each must sit above its own ancestor.
 */
export function describeFailure(error: unknown): FailureDescription {
  if (error instanceof Anthropic.RateLimitError) {
    return { message: 'The assistant is busy right now — try again in a moment.', log: 'rate limited upstream' };
  }
  if (error instanceof Anthropic.AuthenticationError) {
    // Operator error, not visitor error. Loud, because the endpoint is dead until it is fixed.
    return { message: 'The assistant is unavailable right now.', log: 'ANTHROPIC_API_KEY was rejected (401)' };
  }
  if (error instanceof Anthropic.APIConnectionError) {
    // An APIError with no status — the generic branch below would have logged
    // "upstream API error undefined", which says nothing useful.
    return { message: 'Something went wrong. Please try again.', log: 'could not reach the Anthropic API' };
  }
  if (error instanceof Anthropic.APIError) {
    return { message: 'Something went wrong. Please try again.', log: `upstream API error ${error.status}` };
  }
  if (error instanceof Anthropic.AnthropicError) {
    // Every SDK error extends AnthropicError, so this means the SDK gave up
    // before making a request — in practice a missing ANTHROPIC_API_KEY. In
    // SDK 0.128 that throws a bare AnthropicError on first request, not at
    // construction, with no status, so no branch above catches it.
    return {
      message: 'The assistant is unavailable right now.',
      log: 'ANTHROPIC_API_KEY is missing or could not be resolved — the endpoint is dead until it is set',
    };
  }
  return GENERIC;
}
