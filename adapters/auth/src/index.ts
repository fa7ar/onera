export type { AuthPort, AuthSession, User } from '@onera/domain';
export type { HealthStatus } from '@onera/core';

export type AuthProvider = 'supabase' | 'clerk' | 'authjs' | 'custom';

export interface AuthAdapterConfig {
  provider: AuthProvider;
  url?: string;
  anonKey?: string;
}
