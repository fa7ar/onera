import { supabase } from '../supabaseClient';
import { config } from '../config';
import type { AuthPort } from '@/domain/ports/services';
import type { AuthSession, User } from '@/domain/types';
import type { UserRepositoryPort } from '@/domain/ports/repositories';

function mapUser(data: {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}): User {
  return {
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    avatarUrl: data.avatar_url,
    createdAt: data.created_at,
  };
}

export class SupabaseAuthAdapter implements AuthPort {
  constructor(private readonly userRepo: UserRepositoryPort) {}

  private get available(): boolean {
    return Boolean(config.supabaseUrl);
  }

  async signUp(
    email: string,
    password: string,
    fullName: string,
  ): Promise<{ user: User | null; error: string | null }> {
    if (!this.available) return { user: null, error: 'Authentication is not configured.' };
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { user: null, error: error.message };
    if (!data.user) return { user: null, error: 'No user returned' };

    await supabase.from('profiles').upsert({
      id: data.user.id,
      email: data.user.email ?? email,
      full_name: fullName,
    });

    const user = await this.userRepo.findById(data.user.id);
    return { user, error: null };
  }

  async signIn(
    email: string,
    password: string,
  ): Promise<{ session: AuthSession | null; error: string | null }> {
    if (!this.available) return { session: null, error: 'Authentication is not configured.' };
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { session: null, error: error.message };
    if (!data.session || !data.user)
      return { session: null, error: 'No session returned' };

    const user = await this.userRepo.findById(data.user.id);
    if (!user) return { session: null, error: 'Profile not found' };

    return {
      session: { user, accessToken: data.session.access_token },
      error: null,
    };
  }

  async signOut(): Promise<void> {
    if (!this.available) return;
    await supabase.auth.signOut();
  }

  async getSession(): Promise<AuthSession | null> {
    if (!this.available) return null;
    const { data } = await supabase.auth.getSession();
    if (!data.session || !data.session.user) return null;

    const user = await this.userRepo.findById(data.session.user.id);
    if (!user) return null;

    return {
      user,
      accessToken: data.session.access_token,
    };
  }

  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void {
    if (!this.available) return () => {};
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      (async () => {
        if (!session || !session.user) {
          callback(null);
          return;
        }
        const user = await this.userRepo.findById(session.user.id);
        if (!user) {
          callback(null);
          return;
        }
        callback({ user, accessToken: session.access_token });
      })();
    });
    return () => data.subscription.unsubscribe();
  }

  async updatePassword(newPassword: string): Promise<{ error: string | null }> {
    if (!this.available) return { error: 'Authentication is not configured.' };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return { error: error?.message ?? null };
  }
}

export { mapUser };
