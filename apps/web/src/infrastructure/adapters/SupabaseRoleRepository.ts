import { supabase } from '../supabaseClient';
import type { RoleRepositoryPort } from '@/domain/ports/repositories';
import type { Role, Permission, UUID, PermissionKey } from '@/domain/types';

function mapRole(data: {
  id: string;
  organization_id: string;
  name: string;
  is_system: boolean;
  created_at: string;
}): Role {
  return {
    id: data.id,
    organizationId: data.organization_id,
    name: data.name,
    isSystem: data.is_system,
    createdAt: data.created_at,
  };
}

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

export class SupabaseRoleRepository implements RoleRepositoryPort {
  async findById(id: UUID): Promise<Role | null> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return mapRole(data);
  }

  async findByOrganizationId(orgId: UUID): Promise<Role[]> {
    const { data, error } = await supabase
      .from('roles')
      .select('*')
      .eq('organization_id', orgId)
      .order('name', { ascending: true });
    if (error || !data) return [];
    return data.map(mapRole);
  }

  async create(data: {
    organizationId: UUID;
    name: string;
    isSystem?: boolean;
  }): Promise<Role> {
    const { data: created, error } = await supabase
      .from('roles')
      .insert({
        organization_id: data.organizationId,
        name: data.name,
        is_system: data.isSystem ?? false,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapRole(created);
  }

  async delete(id: UUID): Promise<void> {
    const { error } = await supabase.from('roles').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  async assignPermissions(roleId: UUID, permissionIds: UUID[]): Promise<void> {
    if (permissionIds.length === 0) return;
    const rows = permissionIds.map((pid) => ({
      role_id: roleId,
      permission_id: pid,
    }));
    const { error } = await supabase.from('role_permissions').insert(rows);
    if (error) throw new Error(error.message);
  }

  async getPermissions(roleId: UUID): Promise<Permission[]> {
    const { data, error } = await supabase
      .from('role_permissions')
      .select('permission:permissions(*)')
      .eq('role_id', roleId);
    if (error || !data) return [];
    return data.map((row) => mapPermission((row as unknown as { permission: Parameters<typeof mapPermission>[0] }).permission));
  }

  async getPermissionKeys(userId: UUID, workspaceId: UUID): Promise<PermissionKey[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('role_id')
      .eq('user_id', userId)
      .eq('workspace_id', workspaceId)
      .maybeSingle();
    if (error || !data) return [];

    const { data: perms, error: permError } = await supabase
      .from('role_permissions')
      .select('permission:permissions(key)')
      .eq('role_id', data.role_id);
    if (permError || !perms) return [];

    return perms.map((row) => (row as unknown as { permission: { key: string } }).permission.key);
  }
}
