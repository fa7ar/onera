export type { SearchPort } from '@onera/domain';
export type { HealthStatus } from '@onera/core';

export type SearchProvider = 'meilisearch' | 'elasticsearch' | 'postgres-fts';

export interface SearchAdapterConfig {
  provider: SearchProvider;
  url?: string;
  apiKey?: string;
}
