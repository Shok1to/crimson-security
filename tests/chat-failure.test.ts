import { describe, it, expect } from 'vitest';
import Anthropic from '@anthropic-ai/sdk';
import { describeFailure } from '@/lib/chat-failure';

const headers = new Headers();

describe('describeFailure', () => {
  it('names an upstream rate limit and tells the visitor to retry', () => {
    const error = new Anthropic.RateLimitError(429, undefined, undefined, headers);
    const { message, log } = describeFailure(error);
    expect(log).toMatch(/rate limit/i);
    expect(message).toMatch(/try again/i);
  });

  it('names a rejected key on a 401', () => {
    const error = new Anthropic.AuthenticationError(401, undefined, undefined, headers);
    expect(describeFailure(error).log).toMatch(/ANTHROPIC_API_KEY/);
  });

  /**
   * I1, the day-one misconfiguration: CHAT_ENABLED=true with no
   * ANTHROPIC_API_KEY. Verified against SDK 0.128 by constructing a client with
   * no key and issuing a request — construction succeeds, and the request
   * throws a bare AnthropicError with no status, so it is neither an APIError
   * nor an AuthenticationError. It used to fall through to "unexpected
   * failure", which gives an operator nothing.
   */
  it('names a missing credential for a bare AnthropicError', () => {
    const error = new Anthropic.AnthropicError(
      'Could not resolve authentication method. Expected one of apiKey, authToken, credentials, config, or profile to be set.',
    );
    expect(error).not.toBeInstanceOf(Anthropic.APIError);
    expect(error).not.toBeInstanceOf(Anthropic.AuthenticationError);

    const { message, log } = describeFailure(error);
    expect(log).toMatch(/ANTHROPIC_API_KEY/);
    expect(log).toMatch(/missing/i);
    expect(log).not.toMatch(/unexpected failure/);
    expect(message).toMatch(/unavailable/i);
  });

  // Deferred minor: an APIConnectionError has no status, so the APIError branch
  // used to log the useless "upstream API error undefined".
  it('names a connection failure rather than logging an undefined status', () => {
    const error = new Anthropic.APIConnectionError({ message: 'socket hang up' });
    const { log } = describeFailure(error);
    expect(log).toMatch(/reach the Anthropic API/i);
    expect(log).not.toMatch(/undefined/);
  });

  it('logs the status for any other API error', () => {
    const error = new Anthropic.InternalServerError(503, undefined, undefined, headers);
    expect(describeFailure(error).log).toContain('503');
  });

  it('falls back for a non-SDK error', () => {
    expect(describeFailure(new Error('boom')).log).toBe('unexpected failure');
    expect(describeFailure('boom').log).toBe('unexpected failure');
  });

  // No internal detail may reach the browser on any path.
  it('never leaks the underlying message to the visitor', () => {
    const secrets = [
      new Anthropic.AnthropicError('apiKey sk-ant-secret is invalid'),
      new Anthropic.APIConnectionError({ message: 'connect ECONNREFUSED 10.0.0.1:443' }),
      new Anthropic.InternalServerError(500, undefined, 'internal stack detail', headers),
      new Error('internal stack detail'),
    ];
    for (const error of secrets) {
      const { message } = describeFailure(error);
      expect(message).not.toMatch(/sk-ant|ECONNREFUSED|stack detail/);
    }
  });
});
