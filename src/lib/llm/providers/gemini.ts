// Google Gemini Flash LLM provider

import { LLMProviderBase, LLMProvider, LLMRequest, LLMResponse, LLMProviderConfig, LLMError } from '../types.js';

export class GeminiProvider extends LLMProviderBase {
  provider = LLMProvider.GEMINI;
  
  constructor(private config: LLMProviderConfig) {
    super();
  }

  async isAvailable(): Promise<boolean> {
    if (!this.config.apiKey) {
      return false;
    }

    try {
      // Test with a simple request
      const response = await fetch(`${this.getBaseUrl()}/models`, {
        method: 'GET',
        headers: this.getHeaders()
      });
      return response.ok;
    } catch (error) {
      console.warn('Gemini provider not available:', error);
      return false;
    }
  }

  async call(request: LLMRequest): Promise<LLMResponse> {
    if (!this.config.apiKey) {
      throw this.createError('API key not configured', 'MISSING_API_KEY', false);
    }

    try {
      const requestBody = this.buildRequestBody(request);
      const response = await fetch(`${this.getBaseUrl()}/models/${this.config.model}:generateContent`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        const isRetryable = response.status >= 500 || response.status === 429;
        
        const error = this.createError(errorMessage, 'API_ERROR', isRetryable);
        throw error;
      }

      const data = await response.json();
      return this.parseResponse(data, request);
    } catch (error) {
      // Re-throw our custom LLM errors
      if (error && typeof error === 'object' && 'code' in error) {
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
    return this.config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
  }

  private getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-goog-api-key': this.config.apiKey!
    };
  }

  private buildRequestBody(request: LLMRequest): any {
    const parts: any[] = [];
    
    if (request.systemPrompt) {
      parts.push({ text: request.systemPrompt });
    }
    
    parts.push({ text: request.prompt });

    return {
      contents: [{ parts }],
      generationConfig: {
        temperature: request.temperature || 0.7,
        maxOutputTokens: request.maxTokens || 2048,
        candidateCount: 1
      }
    };
  }

  private parseResponse(data: any, request: LLMRequest): LLMResponse {
    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw this.createError('No response candidate found', 'INVALID_RESPONSE', false);
    }

    const content = candidate.content?.parts?.[0]?.text;
    if (!content) {
      throw this.createError('No content in response', 'INVALID_RESPONSE', false);
    }

    return {
      content: content.trim(),
      model: this.config.model,
      provider: this.provider,
      usage: this.extractUsage(data),
      metadata: {
        finishReason: candidate.finishReason,
        safetyRatings: candidate.safetyRatings
      }
    };
  }

  private extractUsage(data: any): LLMResponse['usage'] {
    const usage = data.usageMetadata;
    if (!usage) return undefined;

    return {
      promptTokens: usage.promptTokenCount || 0,
      completionTokens: usage.candidatesTokenCount || 0,
      totalTokens: usage.totalTokenCount || 0
    };
  }

  private createError(message: string, code: string, retryable: boolean): LLMError {
    return {
      message,
      code,
      provider: this.provider,
      retryable,
      details: { config: this.config.model }
    } as LLMError;
  }
}