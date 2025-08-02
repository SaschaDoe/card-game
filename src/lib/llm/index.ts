// LLM module exports

export * from './types.js';
export * from './client.js';
export * from './rate-limiter.js';
export { GeminiProvider } from './providers/gemini.js';
export { OpenAIProvider } from './providers/openai.js';

// Default configuration factory
export function createDefaultLLMConfig(): import('./types.js').LLMClientConfig {
  return {
    providers: [
      {
        provider: 'gemini' as import('./types.js').LLMProvider,
        model: 'gemini-1.5-flash',
        enabled: true,
        priority: 1,
        rateLimit: {
          requestsPerMinute: 60,
          tokensPerMinute: 100000
        }
      },
      {
        provider: 'openai' as import('./types.js').LLMProvider,
        model: 'gpt-3.5-turbo',
        enabled: false, // Disabled by default, enable when API key is provided
        priority: 2,
        rateLimit: {
          requestsPerMinute: 60,
          tokensPerMinute: 90000
        }
      }
    ],
    fallbackEnabled: true,
    retryAttempts: 3,
    timeoutMs: 30000
  };
}