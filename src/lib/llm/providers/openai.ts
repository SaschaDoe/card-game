// OpenAI GPT LLM provider (fallback)

import { LLMProviderBase, LLMProvider, LLMRequest, LLMResponse, LLMProviderConfig, LLMError } from '../types.js';

export class OpenAIProvider extends LLMProviderBase {
  provider = LLMProvider.OPENAI;
  
  constructor(private config: LLMProviderConfig) {
    super();
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      const response = await fetch(`${this.getBaseUrl()}/models`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return response.ok;
    } catch (error) {
      console.warn('OpenAI provider not available:', error);
      return false;
    }
  }

  async call(request: LLMRequest): Promise<LLMResponse> {
    if (!this.config.apiKey) {
      throw this.createError('API key not configured', 'MISSING_API_KEY', false);
    }

    try {
      const requestBody = this.buildRequestBody(request);
      const response = await fetch(`${this.getBaseUrl()}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw this.createError(
          errorData.error?.message || `HTTP ${response.status}`,
          'API_ERROR',
          response.status >= 500 || response.status === 429
        );
      }

      const data = await response.json();
      return this.parseResponse(data, request);
    } catch (error) {
      if (error instanceof Error && error.message.includes('API_ERROR')) {
        throw error;
      }
      throw this.createError(
        error instanceof Error ? error.message : 'Unknown error',
        'NETWORK_ERROR',
        true
      );
    }
  }

  validateConfig(config: LLMProviderConfig): boolean {
    return !!(config.apiKey && config.model);
  }

  private getBaseUrl(): string {
    return this.config.baseUrl || 'https://api.openai.com/v1';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey!}`
    };
  }

  private buildRequestBody(request: LLMRequest): any {
    const messages: any[] = [];
    
    if (request.systemPrompt) {
      messages.push({
        role: 'system',
        content: request.systemPrompt
      });
    }
    
    messages.push({
      role: 'user',
      content: request.prompt
    });

    return {
      model: this.config.model,
      messages,
      temperature: request.temperature || 0.7,
      max_tokens: request.maxTokens || 2048
    };
  }

  private parseResponse(data: any, request: LLMRequest): LLMResponse {
    const choice = data.choices?.[0];
    if (!choice) {
      throw this.createError('No response choice found', 'INVALID_RESPONSE', false);
    }

    const content = choice.message?.content;
    if (!content) {
      throw this.createError('No content in response', 'INVALID_RESPONSE', false);
    }

    return {
      content: content.trim(),
      model: data.model || this.config.model,
      provider: this.provider,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined,
      metadata: {
        finishReason: choice.finish_reason,
        index: choice.index
      }
    };
  }

  private createError(message: string, code: string, retryable: boolean): LLMError {
    return {
      message,
      code,
      provider: this.provider,
      retryable,
      details: { model: this.config.model }
    } as LLMError;
  }
}