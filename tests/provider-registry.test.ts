import { describe, it, expect, beforeEach } from 'vitest';
import { ProviderRegistry, ProviderNotRegisteredError, ProviderAlreadyRegisteredError } from '@onera/core';

describe('ProviderRegistry', () => {
  let registry: ProviderRegistry;

  beforeEach(() => {
    registry = new ProviderRegistry();
  });

  it('should register and resolve a provider', () => {
    const mock = { health: () => Promise.resolve({ state: 'healthy' as const }) };
    registry.register('cache', mock);
    expect(registry.has('cache')).toBe(true);
    expect(registry.resolve<typeof mock>('cache')).toBe(mock);
  });

  it('should throw when resolving unregistered provider', () => {
    expect(() => registry.resolve('database')).toThrow(ProviderNotRegisteredError);
  });

  it('should throw when registering duplicate provider', () => {
    registry.register('cache', {});
    expect(() => registry.register('cache', {})).toThrow(ProviderAlreadyRegisteredError);
  });

  it('should list registered providers', () => {
    registry.register('cache', {});
    registry.register('queue', {});
    const names = registry.registeredProviders();
    expect(names).toContain('cache');
    expect(names).toContain('queue');
    expect(names).toHaveLength(2);
  });

  it('should report has() as false for unregistered providers', () => {
    expect(registry.has('ai')).toBe(false);
  });
});
