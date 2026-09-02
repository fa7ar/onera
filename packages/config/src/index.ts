export interface AppConfig {
  env: 'development' | 'staging' | 'production';
  appUrl: string;
  apiUrl: string;
  appName: string;
  appVersion: string;
}

export interface DatabaseConfig {
  url: string;
}

export interface AuthConfig {
  provider: 'supabase' | 'clerk' | 'custom';
}

export interface StorageConfig {
  provider: 'r2' | 's3' | 'supabase' | 'local';
  bucket?: string;
}

export interface FullConfig {
  app: AppConfig;
  database?: DatabaseConfig;
  auth?: AuthConfig;
  storage?: StorageConfig;
}

declare global {
  interface ImportMetaEnv {
    readonly VITE_APP_ENV?: string;
    readonly VITE_APP_URL?: string;
    readonly VITE_API_URL?: string;
  }
}

function getEnvVar(key: string): string | undefined {
  try {
    return import.meta.env?.[key] as string | undefined;
  } catch {
    return undefined;
  }
}

export function createConfig(overrides: Partial<FullConfig> = {}): FullConfig {
  const env = (getEnvVar('VITE_APP_ENV') ?? 'development') as AppConfig['env'];
  const appUrl = getEnvVar('VITE_APP_URL') ?? 'http://localhost:5173';
  const apiUrl = getEnvVar('VITE_API_URL') ?? 'http://localhost:8787';

  return {
    app: { env, appUrl, apiUrl, appName: 'Onera', appVersion: '0.1.0' },
    ...overrides,
  };
}
