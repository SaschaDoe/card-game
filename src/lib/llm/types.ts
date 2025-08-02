// LLM API types and interfaces

export interface LLMRequest {
  prompt: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  model?: string;
}

export interface LLMResponse {
  content: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  metadata?: Record<string, any>;
}

export interface LLMError {
  message: string;
  code: string;
  provider: string;
  retryable: boolean;
  details?: Record<string, any>;
}

export enum LLMProvider {
  GEMINI = 'gemini',
  OPENAI = 'openai',
  CLAUDE = 'claude',
  LOCAL = 'local'
}

export interface LLMProviderConfig {
  provider: LLMProvider;
  apiKey?: string;
  baseUrl?: string;
  model: string;
  enabled: boolean;
  priority: number; // Lower numbers = higher priority
  rateLimit?: {
    requestsPerMinute: number;
    tokensPerMinute: number;
  };
}

export interface LLMClientConfig {
  providers: LLMProviderConfig[];
  fallbackEnabled: boolean;
  retryAttempts: number;
  timeoutMs: number;
}

export abstract class LLMProviderBase {
  abstract provider: LLMProvider;
  abstract isAvailable(): Promise<boolean>;
  abstract call(request: LLMRequest): Promise<LLMResponse>;
  abstract validateConfig(config: LLMProviderConfig): boolean;
}