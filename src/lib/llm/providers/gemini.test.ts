// Gemini Provider Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from './gemini.js';
import { LLMProvider } from '../types.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Gemini Provider', () => {
  let provider: GeminiProvider;
  let mockConfig: any;

  beforeEach(() => {
    mockConfig = {
      provider: LLMProvider.GEMINI,
      apiKey: 'test-api-key',
      model: 'gemini-1.5-flash',
      enabled: true,
      priority: 1
    };

    provider = new GeminiProvider(mockConfig);
    vi.clearAllMocks();
  });

  it('validates configuration correctly', () => {
    expect(provider.validateConfig(mockConfig)).toBe(true);
    
    // Test invalid configs
    expect(provider.validateConfig({ ...mockConfig, apiKey: '' })).toBe(false);
    expect(provider.validateConfig({ ...mockConfig, model: '' })).toBe(false);
  });

  it('checks availability correctly', async () => {
    // Mock successful response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true
    } as Response);

    const isAvailable = await provider.isAvailable();
    expect(isAvailable).toBe(true);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/models'),
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({
          'x-goog-api-key': 'test-api-key'
        })
      })
    );
  });

  it('handles unavailable service', async () => {
    // Mock failed response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403
    } as Response);

    const isAvailable = await provider.isAvailable();
    expect(isAvailable).toBe(false);
  });

  it('makes successful API calls', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{ text: 'This is a test response from Gemini' }]
        },
        finishReason: 'STOP'
      }],
      usageMetadata: {
        promptTokenCount: 10,
        candidatesTokenCount: 20,
        totalTokenCount: 30
      }
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response);

    const request = {
      prompt: 'Test prompt',
      temperature: 0.7,
      maxTokens: 1000
    };

    const response = await provider.call(request);

    expect(response.content).toBe('This is a test response from Gemini');
    expect(response.model).toBe('gemini-1.5-flash');
    expect(response.provider).toBe(LLMProvider.GEMINI);
    expect(response.usage).toEqual({
      promptTokens: 10,
      completionTokens: 20,
      totalTokens: 30
    });
  });

  it('handles system prompts correctly', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{ text: 'Response with system prompt' }]
        },
        finishReason: 'STOP'
      }]
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response);

    const request = {
      prompt: 'Test prompt',
      systemPrompt: 'You are a helpful assistant'
    };

    await provider.call(request);

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1]?.body as string);
    
    expect(requestBody.contents[0].parts).toHaveLength(2);
    expect(requestBody.contents[0].parts[0].text).toBe('You are a helpful assistant');
    expect(requestBody.contents[0].parts[1].text).toBe('Test prompt');
  });

  it('handles API errors correctly', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({
        error: { message: 'Invalid request' }
      })
    } as Response);

    const request = { prompt: 'Test prompt' };

    await expect(provider.call(request)).rejects.toMatchObject({
      message: 'Invalid request',
      code: 'API_ERROR',
      provider: LLMProvider.GEMINI,
      retryable: false
    });
  });

  it('handles network errors correctly', async () => {
    vi.mocked(fetch).mockRejectedValueOnce(new Error('Network error'));

    const request = { prompt: 'Test prompt' };

    await expect(provider.call(request)).rejects.toMatchObject({
      message: 'Network error',
      code: 'NETWORK_ERROR',
      provider: LLMProvider.GEMINI,
      retryable: true
    });
  });

  it('handles rate limiting errors as retryable', async () => {
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 429,
      json: () => Promise.resolve({
        error: { message: 'Rate limit exceeded' }
      })
    } as Response);

    const request = { prompt: 'Test prompt' };

    await expect(provider.call(request)).rejects.toMatchObject({
      message: 'Rate limit exceeded',
      code: 'API_ERROR',
      provider: LLMProvider.GEMINI,
      retryable: true
    });
  });

  it('handles missing API key', async () => {
    const providerWithoutKey = new GeminiProvider({
      ...mockConfig,
      apiKey: undefined
    });

    const request = { prompt: 'Test prompt' };

    await expect(providerWithoutKey.call(request)).rejects.toMatchObject({
      message: 'API key not configured',
      code: 'MISSING_API_KEY',
      provider: LLMProvider.GEMINI,
      retryable: false
    });
  });

  it('handles invalid response format', async () => {
    const invalidResponse = {
      candidates: [{
        // Missing content
      }]
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(invalidResponse)
    } as Response);

    const request = { prompt: 'Test prompt' };

    await expect(provider.call(request)).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
      provider: LLMProvider.GEMINI,
      retryable: false
    });
  });
});