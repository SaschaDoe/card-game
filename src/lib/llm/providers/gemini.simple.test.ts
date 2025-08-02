// Simplified Gemini Provider Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeminiProvider } from './gemini.js';
import { LLMProvider } from '../types.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('Gemini Provider - Core Functionality', () => {
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

  it('checks availability with proper headers', async () => {
    // Mock successful response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true
    } as Response);

    const isAvailable = await provider.isAvailable();
    expect(isAvailable).toBe(true);
    
    // Verify correct API key header is sent
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

  it('handles unavailable service gracefully', async () => {
    // Mock failed response
    vi.mocked(fetch).mockResolvedValueOnce({
      ok: false,
      status: 403
    } as Response);

    const isAvailable = await provider.isAvailable();
    expect(isAvailable).toBe(false);
  });

  it('makes properly formatted API calls', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{ text: 'Test response' }]
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
      temperature: 0.7
    };

    const response = await provider.call(request);

    expect(response.content).toBe('Test response');
    expect(response.model).toBe('gemini-1.5-flash');
    expect(response.provider).toBe(LLMProvider.GEMINI);

    // Verify API call format
    const fetchCall = vi.mocked(fetch).mock.calls[0];
    expect(fetchCall[0]).toContain('generateContent');
    expect(fetchCall[1]?.method).toBe('POST');
    
    const requestBody = JSON.parse(fetchCall[1]?.body as string);
    expect(requestBody.contents[0].parts[0].text).toBe('Test prompt');
    expect(requestBody.generationConfig.temperature).toBe(0.7);
  });

  it('handles missing API key correctly', async () => {
    const providerWithoutKey = new GeminiProvider({
      ...mockConfig,
      apiKey: undefined
    });

    await expect(providerWithoutKey.call({ prompt: 'Test' })).rejects.toMatchObject({
      message: 'API key not configured',
      code: 'MISSING_API_KEY',
      provider: LLMProvider.GEMINI,
      retryable: false
    });
  });

  it('includes system prompts when provided', async () => {
    const mockResponse = {
      candidates: [{
        content: {
          parts: [{ text: 'Response with system prompt' }]
        }
      }]
    };

    vi.mocked(fetch).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockResponse)
    } as Response);

    await provider.call({
      prompt: 'User prompt',
      systemPrompt: 'System instruction'
    });

    const fetchCall = vi.mocked(fetch).mock.calls[0];
    const requestBody = JSON.parse(fetchCall[1]?.body as string);
    
    expect(requestBody.contents[0].parts).toHaveLength(2);
    expect(requestBody.contents[0].parts[0].text).toBe('System instruction');
    expect(requestBody.contents[0].parts[1].text).toBe('User prompt');
  });
});