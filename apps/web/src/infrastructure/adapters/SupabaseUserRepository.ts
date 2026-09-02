import { supabase } from '../supabaseClient';
import type { UserRepositoryPort } from '@/domain/ports/repositories';
import type { User, UUID } from '@/domain/types';
import { mapUser } from './SupabaseAuthAdapter';

export class SupabaseUserRepository implements UserRepositoryPort {
  async findById(id: UUID): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return mapUser(data);
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', email)
      .maybeSingle();
    if (error || !data) return null;
    return mapUser(data);
  }

  async updateProfile(
    id: UUID,
    data: { fullName?: string; avatarUrl?: string },
  ): Promise<User> {
    const update: Record<string, string | null> = { updated_at: new Date().toISOString() };
    if (data.fullName !== undefined) update.full_name = data.fullName;
    if (data.avatarUrl !== undefined) update.avatar_url = data.avatarUrl;

    const { data: updated, error } = await supabase
      .from('profiles')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapUser(updated);
  }
}
