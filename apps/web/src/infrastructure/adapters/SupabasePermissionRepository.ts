import { supabase } from '../supabaseClient';
import type { PermissionRepositoryPort } from '@/domain/ports/repositories';
import type { Permission, PermissionKey } from '@/domain/types';

function mapPermission(data: {
  id: string;
  key: string;
  description: string | null;
  module: string;
  created_at: string;
}): Permission {
  return {
    id: data.id,
    key: data.key,
    description: data.description,
    module: data.module,
  };
}

export class SupabasePermissionRepository implements PermissionRepositoryPort {
  async findAll(): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .order('module', { ascending: true })
      .order('key', { ascending: true });
    if (error || !data) return [];
    return data.map(mapPermission);
  }

  async findByKey(key: PermissionKey): Promise<Permission | null> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('key', key)
      .maybeSingle();
    if (error || !data) return null;
    return mapPermission(data);
  }

  async findByModule(module: string): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('permissions')
      .select('*')
      .eq('module', module)
      .order('key', { ascending: true });
    if (error || !data) return [];
    return data.map(mapPermission);
  }
}
