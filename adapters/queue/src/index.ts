export type { QueuePort } from '@onera/domain';
export type { HealthStatus } from '@onera/core';

export type QueueProvider = 'cloudflare-queues' | 'bullmq' | 'sqs' | 'custom';

export interface QueueAdapterConfig {
  provider: QueueProvider;
}
