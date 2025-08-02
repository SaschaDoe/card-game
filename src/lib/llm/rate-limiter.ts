// Rate limiting for LLM API calls

export interface RateLimitConfig {
  requestsPerMinute: number;
  tokensPerMinute: number;
  burstAllowance?: number;
}

export interface RateLimitState {
  requests: number[];
  tokens: number[];
  lastReset: number;
}

export class RateLimiter {
  private state: Map<string, RateLimitState> = new Map();
  private readonly windowMs = 60 * 1000; // 1 minute

  constructor(private config: RateLimitConfig) {}

  async checkRateLimit(
    provider: string, 
    estimatedTokens: number = 0
  ): Promise<{ allowed: boolean; retryAfter?: number }> {
    const now = Date.now();
    const state = this.getOrCreateState(provider, now);

    // Clean old entries outside the window
    this.cleanOldEntries(state, now);

    // Check request rate limit
    if (state.requests.length >= this.config.requestsPerMinute) {
      const oldestRequest = Math.min(...state.requests);
      const retryAfter = oldestRequest + this.windowMs - now;
      return { allowed: false, retryAfter };
    }

    // Check token rate limit
    const currentTokens = state.tokens.reduce((sum, tokens) => sum + tokens, 0);
    if (currentTokens + estimatedTokens > this.config.tokensPerMinute) {
      const oldestToken = Math.min(...state.requests); // Use request timestamps
      const retryAfter = oldestToken + this.windowMs - now;
      return { allowed: false, retryAfter };
    }

    return { allowed: true };
  }

  recordRequest(provider: string, tokens: number): void {
    const now = Date.now();
    const state = this.getOrCreateState(provider, now);
    
    state.requests.push(now);
    state.tokens.push(tokens);
  }

  private getOrCreateState(provider: string, now: number): RateLimitState {
    if (!this.state.has(provider)) {
      this.state.set(provider, {
        requests: [],
        tokens: [],
        lastReset: now
      });
    }
    return this.state.get(provider)!;
  }

  private cleanOldEntries(state: RateLimitState, now: number): void {
    const cutoff = now - this.windowMs;
    
    // Remove old requests
    state.requests = state.requests.filter(timestamp => timestamp > cutoff);
    state.tokens = state.tokens.filter((_, index) => state.requests[index] !== undefined);
  }

  getStatus(provider: string): {
    requestsRemaining: number;
    tokensRemaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const state = this.getOrCreateState(provider, now);
    this.cleanOldEntries(state, now);

    const currentTokens = state.tokens.reduce((sum, tokens) => sum + tokens, 0);
    const nextReset = state.lastReset + this.windowMs;

    return {
      requestsRemaining: Math.max(0, this.config.requestsPerMinute - state.requests.length),
      tokensRemaining: Math.max(0, this.config.tokensPerMinute - currentTokens),
      resetTime: nextReset
    };
  }
}