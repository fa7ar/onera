export type { StoragePort } from '@onera/domain';
export type { HealthStatus } from '@onera/core';

export type StorageProvider = 'r2' | 's3' | 'supabase' | 'local';

export interface StorageAdapterConfig {
  provider: StorageProvider;
  bucket: string;
  region?: string;
}
