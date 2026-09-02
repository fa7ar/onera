export const config = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL as string) ?? '',
  supabaseAnonKey: (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ?? '',
  appName: 'Onera',
  appVersion: '0.1.0',
} as const;

export type AppConfig = typeof config;
