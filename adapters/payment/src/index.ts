export type { PaymentPort } from '@onera/domain';
export type { HealthStatus } from '@onera/core';

export type PaymentProvider = 'stripe' | 'midtrans' | 'xendit' | 'custom';

export interface PaymentAdapterConfig {
  provider: PaymentProvider;
  secretKey: string;
  webhookSecret: string;
}
