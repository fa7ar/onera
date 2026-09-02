export type { EmailPort } from '@onera/domain';
export type { HealthStatus } from '@onera/core';

export type EmailProvider = 'resend' | 'ses' | 'smtp' | 'postmark';

export interface EmailAdapterConfig {
  provider: EmailProvider;
  apiKey: string;
  fromEmail: string;
}
