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
 * Spec section 10: distinguish retryable from non-retryable failures using the
 * SDK's typed classes, most specific first. Never string-match error messages,
 * and never let internal detail reach the browser.
 *
 * Order matters — the hierarchy is
 * `RateLimitError`/`AuthenticationError` -> `APIConnectionError` -> `APIError`
 * -> `AnthropicError`, so each branch must sit above its own ancestor.
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
    // Every SDK error extends AnthropicError, so reaching here means the SDK
    // gave up before it ever made a request. In practice that is a missing or
    // unresolvable credential, which is the single likeliest day-one mistake:
    // flipping CHAT_ENABLED=true without setting ANTHROPIC_API_KEY.
    //
    // Verified against SDK 0.128: `new Anthropic()` with no key does NOT throw
    // at construction. The first request throws a bare `AnthropicError`
    // ("Could not resolve authentication method...") that is not an APIError
    // and carries no status, so none of the branches above catch it.
    return {
      message: 'The assistant is unavailable right now.',
      log: 'ANTHROPIC_API_KEY is missing or could not be resolved — the endpoint is dead until it is set',
    };
  }
  return GENERIC;
}
