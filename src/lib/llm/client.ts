// Universal LLM client with fallback support

import { 
  LLMRequest, 
  LLMResponse, 
  LLMError, 
  LLMProvider, 
  LLMClientConfig, 
  LLMProviderConfig, 
  LLMProviderBase 
} from './types.js';
import { RateLimiter } from './rate-limiter.js';
import { GeminiProvider } from './providers/gemini.js';
import { OpenAIProvider } from './providers/openai.js';

export class LLMClient {
  private providers: Map<LLMProvider, LLMProviderBase> = new Map();
  private rateLimiters: Map<LLMProvider, RateLimiter> = new Map();
  private config: LLMClientConfig;

  constructor(config: LLMClientConfig) {
    this.config = config;
    this.initializeProviders();
  }

  async call(request: LLMRequest): Promise<LLMResponse> {
    const sortedProviders = this.getSortedAvailableProviders();
    
    if (sortedProviders.length === 0) {
      throw this.createError('No LLM providers available', 'NO_PROVIDERS', false);
    }

    let lastError: LLMError | null = null;

    for (const providerType of sortedProviders) {
      try {
        const response = await this.callProvider(providerType, request);
        return response;
      } catch (error) {
        lastError = error as LLMError;
        
        // If error is not retryable or fallback is disabled, throw immediately
        if (!lastError.retryable || !this.config.fallbackEnabled) {
          throw lastError;
        }

        console.warn(`Provider ${providerType} failed, trying next:`, lastError.message);
      }
    }

    // All providers failed
    throw lastError || this.createError('All providers failed', 'ALL_PROVIDERS_FAILED', false);
  }

  private async callProvider(providerType: LLMProvider, request: LLMRequest): Promise<LLMResponse> {
    const provider = this.providers.get(providerType);
    if (!provider) {
      throw this.createError(`Provider ${providerType} not initialized`, 'PROVIDER_NOT_FOUND', false);
    }

    const rateLimiter = this.rateLimiters.get(providerType);
    if (rateLimiter) {
      const estimatedTokens = this.estimateTokens(request);
      const rateCheck = await rateLimiter.checkRateLimit(providerType, estimatedTokens);
      
      if (!rateCheck.allowed) {
        throw this.createError(
          `Rate limit exceeded for ${providerType}. Retry after ${rateCheck.retryAfter}ms`,
          'RATE_LIMIT_EXCEEDED',
          true
        );
      }
    }

    // Check if provider is available
    const isAvailable = await provider.isAvailable();
    if (!isAvailable) {
      throw this.createError(`Provider ${providerType} is not available`, 'PROVIDER_UNAVAILABLE', true);
    }

    // Make the call with retry logic
    let attempts = 0;
    while (attempts < this.config.retryAttempts) {
      try {
        const response = await Promise.race([
          provider.call(request),
          this.createTimeout()
        ]);

        // Record successful request for rate limiting
        if (rateLimiter && response.usage) {
          rateLimiter.recordRequest(providerType, response.usage.totalTokens);
        }

        return response;
      } catch (error) {
        attempts++;
        const llmError = error as LLMError;
        
        if (!llmError.retryable || attempts >= this.config.retryAttempts) {
          throw error;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempts), 10000);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw this.createError(`Max retry attempts exceeded for ${providerType}`, 'MAX_RETRIES_EXCEEDED', false);
  }

  private initializeProviders(): void {
    for (const providerConfig of this.config.providers) {
      if (!providerConfig.enabled) continue;

      let provider: LLMProviderBase | null = null;

      switch (providerConfig.provider) {
        case LLMProvider.GEMINI:
          provider = new GeminiProvider(providerConfig);
          break;
        case LLMProvider.OPENAI:
          provider = new OpenAIProvider(providerConfig);
          break;
        // Add more providers here as needed
        default:
          console.warn(`Unknown provider type: ${providerConfig.provider}`);
          continue;
      }

      if (provider && provider.validateConfig(providerConfig)) {
        this.providers.set(providerConfig.provider, provider);

        // Initialize rate limiter if configured
        if (providerConfig.rateLimit) {
          this.rateLimiters.set(
            providerConfig.provider,
            new RateLimiter(providerConfig.rateLimit)
          );
        }
      } else {
        console.warn(`Invalid configuration for provider: ${providerConfig.provider}`);
      }
    }
  }

  private getSortedAvailableProviders(): LLMProvider[] {
    return this.config.providers
      .filter(config => config.enabled && this.providers.has(config.provider))
      .sort((a, b) => a.priority - b.priority)
      .map(config => config.provider);
  }

  private estimateTokens(request: LLMRequest): number {
    // Rough estimation: 1 token ≈ 4 characters
    const totalText = (request.systemPrompt || '') + request.prompt;
    return Math.ceil(totalText.length / 4);
  }

  private createTimeout(): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(this.createError('Request timeout', 'TIMEOUT', true));
      }, this.config.timeoutMs);
    });
  }

  private createError(message: string, code: string, retryable: boolean): LLMError {
    return {
      message,
      code,
      provider: 'client',
      retryable
    };
  }

  // Utility methods for monitoring and management

  getProviderStatus(): Record<LLMProvider, { available: boolean; rateLimit?: any }> {
    const status: Record<string, any> = {};

    for (const [providerType, provider] of this.providers) {
      const rateLimiter = this.rateLimiters.get(providerType);
      status[providerType] = {
        available: true, // Could check async, but keeping simple for now
        rateLimit: rateLimiter ? rateLimiter.getStatus(providerType) : undefined
      };
    }

    return status;
  }

  updateConfig(newConfig: Partial<LLMClientConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (newConfig.providers) {
      this.providers.clear();
      this.rateLimiters.clear();
      this.initializeProviders();
    }
  }
}