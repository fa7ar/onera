import { describe, it, expect } from 'vitest';
import { checkHealth, ProviderRegistry, type HealthCheckable } from '@onera/core';

describe('Health Check', () => {
  it('should report healthy when all providers are healthy', async () => {
    const registry = new ProviderRegistry();
    registry.register<HealthCheckable>('cache', {
      health: async () => ({ state: 'healthy' }),
    });
    registry.register<HealthCheckable>('queue', {
      health: async () => ({ state: 'healthy' }),
    });

    const report = await checkHealth(registry, 'Onera');
    expect(report.status).toBe('healthy');
    expect(report.service).toBe('Onera');
    expect(report.providers.cache).toBe('healthy');
    expect(report.providers.queue).toBe('healthy');
    expect(report.timestamp).toBeDefined();
  });

  it('should report degraded when a provider is degraded', async () => {
    const registry = new ProviderRegistry();
    registry.register<HealthCheckable>('cache', {
      health: async () => ({ state: 'healthy' }),
    });
    registry.register<HealthCheckable>('queue', {
      health: async () => ({ state: 'degraded' }),
    });

    const report = await checkHealth(registry, 'Onera');
    expect(report.status).toBe('degraded');
  });

  it('should report unavailable when a provider is unavailable', async () => {
    const registry = new ProviderRegistry();
    registry.register<HealthCheckable>('database', {
      health: async () => ({ state: 'unavailable' }),
    });

    const report = await checkHealth(registry, 'Onera');
    expect(report.status).toBe('unavailable');
  });

  it('should handle providers without health() method as healthy', async () => {
    const registry = new ProviderRegistry();
    registry.register('cache', { get: () => null });

    const report = await checkHealth(registry, 'Onera');
    expect(report.status).toBe('healthy');
    expect(report.providers.cache).toBe('healthy');
  });

  it('should report degraded when health check throws', async () => {
    const registry = new ProviderRegistry();
    registry.register<HealthCheckable>('database', {
      health: async () => { throw new Error('Connection refused'); },
    });

    const report = await checkHealth(registry, 'Onera');
    expect(report.status).toBe('degraded');
    expect(report.providers.database).toBe('degraded');
  });

  it('should work with empty registry', async () => {
    const registry = new ProviderRegistry();
    const report = await checkHealth(registry, 'Onera');
    expect(report.status).toBe('healthy');
    expect(Object.keys(report.providers)).toHaveLength(0);
  });
});
