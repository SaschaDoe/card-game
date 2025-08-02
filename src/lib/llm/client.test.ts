// LLM Client Tests

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMClient } from './client.js';
import { LLMProvider, LLMClientConfig } from './types.js';

// Mock the providers
vi.mock('./providers/gemini.js', () => ({
  GeminiProvider: vi.fn().mockImplementation((config) => ({
    provider: LLMProvider.GEMINI,
    isAvailable: vi.fn().mockResolvedValue(true),
    call: vi.fn().mockResolvedValue({
      content: 'Test response from Gemini',
      model: config.model,
      provider: LLMProvider.GEMINI,
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
    }),
    validateConfig: vi.fn().mockReturnValue(true)
  }))
}));

vi.mock('./providers/openai.js', () => ({
  OpenAIProvider: vi.fn().mockImplementation((config) => ({
    provider: LLMProvider.OPENAI,
    isAvailable: vi.fn().mockResolvedValue(true),
    call: vi.fn().mockResolvedValue({
      content: 'Test response from OpenAI',
      model: config.model,
      provider: LLMProvider.OPENAI,
      usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 }
    }),
    validateConfig: vi.fn().mockReturnValue(true)
  }))
}));

describe('LLM Client', () => {
  let testConfig: LLMClientConfig;

  beforeEach(() => {
    testConfig = {
      providers: [
        {
          provider: LLMProvider.GEMINI,
          apiKey: 'test-gemini-key',
          model: 'gemini-1.5-flash',
          enabled: true,
          priority: 1,
          rateLimit: {
            requestsPerMinute: 60,
            tokensPerMinute: 100000
          }
        },
        {
          provider: LLMProvider.OPENAI,
          apiKey: 'test-openai-key',
          model: 'gpt-3.5-turbo',
          enabled: true,
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
  });

  it('successfully calls primary provider (Gemini)', async () => {
    const client = new LLMClient(testConfig);
    
    const response = await client.call({
      prompt: 'Test prompt',
      temperature: 0.7
    });

    expect(response.content).toBe('Test response from Gemini');
    expect(response.provider).toBe(LLMProvider.GEMINI);
  });

  it('falls back to secondary provider when primary fails', async () => {
    // Create config with Gemini failing
    const failingConfig = {
      ...testConfig,
      providers: [
        {
          provider: LLMProvider.GEMINI,
          apiKey: 'test-gemini-key',
          model: 'gemini-1.5-flash',
          enabled: true,
          priority: 1
        },
        {
          provider: LLMProvider.OPENAI,
          apiKey: 'test-openai-key', 
          model: 'gpt-3.5-turbo',
          enabled: true,
          priority: 2
        }
      ]
    };

    // Mock Gemini to fail after client creation
    const { GeminiProvider } = await import('./providers/gemini.js');
    const geminiMock = vi.mocked(GeminiProvider);
    geminiMock.mockImplementation((config) => ({
      provider: LLMProvider.GEMINI,
      isAvailable: vi.fn().mockResolvedValue(true),
      call: vi.fn().mockRejectedValue({
        message: 'Gemini failed',
        code: 'API_ERROR',
        provider: LLMProvider.GEMINI,
        retryable: true
      }),
      validateConfig: vi.fn().mockReturnValue(true)
    }));

    const client = new LLMClient(failingConfig);
    
    const response = await client.call({
      prompt: 'Test prompt'
    });

    expect(response.content).toBe('Test response from OpenAI');
    expect(response.provider).toBe(LLMProvider.OPENAI);
  });

  it('handles rate limiting gracefully', async () => {
    // Create config with very low rate limits
    const limitedConfig = {
      ...testConfig,
      providers: [{
        ...testConfig.providers[0],
        rateLimit: {
          requestsPerMinute: 1,
          tokensPerMinute: 10
        }
      }]
    };

    const client = new LLMClient(limitedConfig);

    // First call should succeed
    const response1 = await client.call({ prompt: 'Test 1' });
    expect(response1.content).toBe('Test response from Gemini');

    // Second call should hit rate limit and throw error
    await expect(client.call({ prompt: 'Test 2' })).rejects.toThrow('Rate limit exceeded');
  });

  it('validates API responses correctly', async () => {
    const client = new LLMClient(testConfig);
    
    const response = await client.call({
      prompt: 'Test prompt',
      systemPrompt: 'You are a helpful assistant',
      temperature: 0.5,
      maxTokens: 1000
    });

    expect(response).toHaveProperty('content');
    expect(response).toHaveProperty('model');
    expect(response).toHaveProperty('provider');
    expect(response.usage).toHaveProperty('totalTokens');
  });

  it('manages API keys securely', () => {
    const client = new LLMClient(testConfig);
    const status = client.getProviderStatus();

    // Should not expose API keys in status
    expect(JSON.stringify(status)).not.toContain('test-gemini-key');
    expect(JSON.stringify(status)).not.toContain('test-openai-key');
  });

  it('handles configuration updates', () => {
    const client = new LLMClient(testConfig);
    
    // Update config to disable Gemini
    client.updateConfig({
      providers: [{
        ...testConfig.providers[0],
        enabled: false
      }, testConfig.providers[1]]
    });

    const status = client.getProviderStatus();
    expect(Object.keys(status)).not.toContain(LLMProvider.GEMINI);
  });

  it('throws error when no providers are available', async () => {
    const noProviderConfig = {
      ...testConfig,
      providers: []
    };

    const client = new LLMClient(noProviderConfig);
    
    await expect(client.call({ prompt: 'Test' })).rejects.toThrow('No LLM providers available');
  });

  it('respects timeout settings', async () => {
    // Mock provider to take longer than timeout
    const { GeminiProvider } = await import('./providers/gemini.js');
    const geminiMock = vi.mocked(GeminiProvider);
    geminiMock.mockImplementation((config) => ({
      provider: LLMProvider.GEMINI,
      isAvailable: vi.fn().mockResolvedValue(true),
      call: vi.fn().mockImplementation(() => 
        new Promise(resolve => setTimeout(resolve, 35000)) // Longer than 30s timeout
      ),
      validateConfig: vi.fn().mockReturnValue(true)
    }));

    const client = new LLMClient(testConfig);
    
    await expect(client.call({ prompt: 'Test' })).rejects.toThrow('timeout');
  });
});