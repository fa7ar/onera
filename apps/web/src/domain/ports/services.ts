import type { AuthSession, User } from '@/domain/types';

export interface AuthPort {
  signUp(email: string, password: string, fullName: string): Promise<{ user: User | null; error: string | null }>;
  signIn(email: string, password: string): Promise<{ session: AuthSession | null; error: string | null }>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void;
  updatePassword(newPassword: string): Promise<{ error: string | null }>;
}

export interface EventBusPort {
  publish(event: { type: string; payload: Record<string, unknown> }): void;
  subscribe(type: string, handler: (payload: Record<string, unknown>) => void): () => void;
}

export interface StoragePort {
  upload(path: string, file: File): Promise<{ url: string }>;
  delete(path: string): Promise<void>;
  getPublicUrl(path: string): string;
}

export interface Config {
  supabaseUrl: string;
  supabaseAnonKey: string;
  appName: string;
  appVersion: string;
}

export interface ConfigPort {
  get(): Config;
}
