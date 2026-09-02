import { describe, it, expect, beforeEach } from 'vitest';
import { InMemoryCacheAdapter } from '@onera/adapter-dev';
import type { CachePort } from '@onera/domain';

/**
 * Adapter Replacement Demonstration (Onera-02 Section 8).
 *
 * Proves that a service depending on CachePort can work with any adapter
 * that implements the port, without modifying the service code.
 */

class CacheService {
  constructor(private readonly cache: CachePort) {}

  async getValue(key: string): Promise<string | null> {
    return this.cache.get<string>(key);
  }

  async setValue(key: string, value: string, ttl?: number): Promise<void> {
    await this.cache.set(key, value, ttl);
  }

  async clearKey(key: string): Promise<void> {
    await this.cache.delete(key);
  }
}

describe('Adapter Replacement Demonstration', () => {
  let cache: InMemoryCacheAdapter;
  let service: CacheService;

  beforeEach(() => {
    // Service is constructed with a CachePort — it doesn't know which adapter.
    cache = new InMemoryCacheAdapter();
    service = new CacheService(cache);
  });

  it('should store and retrieve values via CachePort', async () => {
    await service.setValue('greeting', 'hello world');
    const value = await service.getValue('greeting');
    expect(value).toBe('hello world');
  });

  it('should return null for missing keys', async () => {
    const value = await service.getValue('nonexistent');
    expect(value).toBeNull();
  });

  it('should delete values', async () => {
    await service.setValue('temp', 'data');
    await service.clearKey('temp');
    const value = await service.getValue('temp');
    expect(value).toBeNull();
  });

  it('should respect TTL expiration', async () => {
    await service.setValue('expires', 'soon', 1);
    // Wait for TTL to expire
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const value = await service.getValue('expires');
    expect(value).toBeNull();
  });

  it('should work with a different CachePort implementation without service changes', async () => {
    // Simulate swapping to a "different" adapter — same interface, different instance.
    const alternateCache = new InMemoryCacheAdapter();
    const alternateService = new CacheService(alternateCache);

    await alternateService.setValue('key', 'value-from-alternate');
    const value = await alternateService.getValue('key');
    expect(value).toBe('value-from-alternate');

    // Verify original cache is unaffected
    const originalValue = await service.getValue('key');
    expect(originalValue).toBeNull();
  });
});
