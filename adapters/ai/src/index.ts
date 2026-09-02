export type { AIPort } from '@onera/domain';
export type { HealthStatus } from '@onera/core';

export type AIProvider = 'openai' | 'anthropic' | 'custom';

export interface AIAdapterConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}
