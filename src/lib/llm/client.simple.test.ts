// Simplified LLM Client Tests to validate core functionality

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LLMClient } from './client.js';
import { LLMProvider, LLMClientConfig } from './types.js';

describe('LLM Client - Core Functionality', () => {
  let testConfig: LLMClientConfig;

  beforeEach(() => {
    testConfig = {
      providers: [
        {
          provider: LLMProvider.GEMINI,
          apiKey: 'test-gemini-key',
          model: 'gemini-1.5-flash',
          enabled: true,
          priority: 1
        }
      ],
      fallbackEnabled: true,
      retryAttempts: 2,
      timeoutMs: 5000
    };
  });

  it('initializes without errors', () => {
    expect(() => new LLMClient(testConfig)).not.toThrow();
  });

  it('validates configuration correctly', () => {
    const client = new LLMClient(testConfig);
    expect(client).toBeDefined();
  });

  it('throws error when no providers are configured', async () => {
    const noProviderConfig = {
      ...testConfig,
      providers: []
    };

    const client = new LLMClient(noProviderConfig);
    
    await expect(client.call({ prompt: 'Test' })).rejects.toThrow('No LLM providers available');
  });

  it('provides provider status information', () => {
    const client = new LLMClient(testConfig);
    const status = client.getProviderStatus();
    
    expect(status).toBeDefined();
    expect(typeof status).toBe('object');
  });

  it('handles configuration updates', () => {
    const client = new LLMClient(testConfig);
    
    expect(() => {
      client.updateConfig({
        retryAttempts: 5,
        timeoutMs: 10000
      });
    }).not.toThrow();
  });

  it('manages API keys securely', () => {
    const client = new LLMClient(testConfig);
    const status = client.getProviderStatus();

    // Should not expose API keys in status
    const statusString = JSON.stringify(status);
    expect(statusString).not.toContain('test-gemini-key');
    expect(statusString).not.toContain('apiKey');
  });
});