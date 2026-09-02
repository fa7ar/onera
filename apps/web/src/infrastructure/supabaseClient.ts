import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { config } from './config';

export type { Database } from './types';

export const supabase: SupabaseClient = config.supabaseUrl
  ? createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : (null as unknown as SupabaseClient);
