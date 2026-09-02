export type { DatabasePort, DatabaseTransactionPort } from '@onera/domain';
export type { HealthStatus } from '@onera/core';

export type DatabaseProvider = 'supabase' | 'neon' | 'postgres' | 'pglite';

export interface DatabaseAdapterConfig {
  provider: DatabaseProvider;
  url: string;
}
