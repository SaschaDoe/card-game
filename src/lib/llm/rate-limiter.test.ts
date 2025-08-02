// Rate Limiter Tests

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { RateLimiter } from './rate-limiter.js';

describe('Rate Limiter', () => {
  let rateLimiter: RateLimiter;

  beforeEach(() => {
    // Mock Date.now for predictable testing
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-01T00:00:00Z'));

    rateLimiter = new RateLimiter({
      requestsPerMinute: 60,
      tokensPerMinute: 10000
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('allows requests within rate limits', async () => {
    const result = await rateLimiter.checkRateLimit('test-provider', 100);
    
    expect(result.allowed).toBe(true);
    expect(result.retryAfter).toBeUndefined();
  });

  it('blocks requests when request limit exceeded', async () => {
    // Make requests up to the limit
    for (let i = 0; i < 60; i++) {
      await rateLimiter.checkRateLimit('test-provider', 10);
      rateLimiter.recordRequest('test-provider', 10);
    }

    // Next request should be blocked
    const result = await rateLimiter.checkRateLimit('test-provider', 10);
    
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('blocks requests when token limit exceeded', async () => {
    // Make a request that would exceed token limit
    const result = await rateLimiter.checkRateLimit('test-provider', 10001);
    
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeGreaterThan(0);
  });

  it('resets limits after time window', async () => {
    // Fill up the request limit
    for (let i = 0; i < 60; i++) {
      rateLimiter.recordRequest('test-provider', 10);
    }

    // Should be blocked
    let result = await rateLimiter.checkRateLimit('test-provider', 10);
    expect(result.allowed).toBe(false);

    // Advance time by 61 seconds
    vi.advanceTimersByTime(61 * 1000);

    // Should now be allowed
    result = await rateLimiter.checkRateLimit('test-provider', 10);
    expect(result.allowed).toBe(true);
  });

  it('tracks different providers separately', async () => {
    // Fill limit for provider A
    for (let i = 0; i < 60; i++) {
      rateLimiter.recordRequest('provider-a', 10);
    }

    // Provider A should be blocked
    let resultA = await rateLimiter.checkRateLimit('provider-a', 10);
    expect(resultA.allowed).toBe(false);

    // Provider B should still be allowed
    let resultB = await rateLimiter.checkRateLimit('provider-b', 10);
    expect(resultB.allowed).toBe(true);
  });

  it('provides accurate status information', () => {
    // Record some requests
    for (let i = 0; i < 10; i++) {
      rateLimiter.recordRequest('test-provider', 100);
    }

    const status = rateLimiter.getStatus('test-provider');
    
    expect(status.requestsRemaining).toBe(50); // 60 - 10
    expect(status.tokensRemaining).toBe(9000); // 10000 - (10 * 100)
    expect(status.resetTime).toBeGreaterThan(Date.now());
  });

  it('records requests correctly', () => {
    rateLimiter.recordRequest('test-provider', 500);
    
    const status = rateLimiter.getStatus('test-provider');
    expect(status.requestsRemaining).toBe(59);
    expect(status.tokensRemaining).toBe(9500);
  });

  it('handles burst requests correctly', async () => {
    // Make multiple rapid requests
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(rateLimiter.checkRateLimit('test-provider', 100));
    }

    const results = await Promise.all(promises);
    
    // All should be allowed since we're under the limit
    results.forEach(result => {
      expect(result.allowed).toBe(true);
    });
  });

  it('calculates retry time correctly', async () => {
    const startTime = Date.now();
    
    // Fill up the limit
    for (let i = 0; i < 60; i++) {
      rateLimiter.recordRequest('test-provider', 10);
    }

    const result = await rateLimiter.checkRateLimit('test-provider', 10);
    
    expect(result.allowed).toBe(false);
    expect(result.retryAfter).toBeLessThanOrEqual(60 * 1000); // Should be within the window
    expect(result.retryAfter).toBeGreaterThan(0);
  });
});