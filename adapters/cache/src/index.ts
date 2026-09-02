export type { CachePort } from '@onera/domain';
export type { HealthStatus } from '@onera/core';

export type CacheProvider = 'cloudflare-kv' | 'redis' | 'memory';

export interface CacheAdapterConfig {
  provider: CacheProvider;
  ttl?: number;
}
