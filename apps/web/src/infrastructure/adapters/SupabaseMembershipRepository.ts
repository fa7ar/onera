import { supabase } from '../supabaseClient';
import type { MembershipRepositoryPort } from '@/domain/ports/repositories';
import type { Membership, MembershipWithContext, UUID } from '@/domain/types';
import type { Role, Workspace, User } from '@/domain/types';

function mapMembership(data: {
  id: string;
  workspace_id: string;
  user_id: string;
  role_id: string;
  created_at: string;
}): Membership {
  return {
    id: data.id,
    workspaceId: data.workspace_id,
    userId: data.user_id,
    roleId: data.role_id,
    createdAt: data.created_at,
  };
}

interface JoinedMembershipRow {
  id: string;
  workspace_id: string;
  user_id: string;
  role_id: string;
  created_at: string;
  role: {
    id: string;
    organization_id: string;
    name: string;
    is_system: boolean;
    created_at: string;
  };
  workspace: {
    id: string;
    organization_id: string;
    name: string;
    slug: string;
    created_at: string;
    updated_at: string;
  };
  user: {
    id: string;
    email: string;
    full_name: string | null;
    avatar_url: string | null;
    created_at: string;
    updated_at: string;
  };
}

function mapJoined(row: JoinedMembershipRow): MembershipWithContext {
  const role: Role = {
    id: row.role.id,
    organizationId: row.role.organization_id,
    name: row.role.name,
    isSystem: row.role.is_system,
    createdAt: row.role.created_at,
  };
  const workspace: Workspace = {
    id: row.workspace.id,
    organizationId: row.workspace.organization_id,
    name: row.workspace.name,
    slug: row.workspace.slug,
    createdAt: row.workspace.created_at,
    updatedAt: row.workspace.updated_at,
  };
  const user: Pick<User, 'id' | 'email' | 'fullName' | 'avatarUrl'> = {
    id: row.user.id,
    email: row.user.email,
    fullName: row.user.full_name,
    avatarUrl: row.user.avatar_url,
  };
  return {
    membership: mapMembership(row),
    user,
    role,
    workspace,
  };
}

export class SupabaseMembershipRepository implements MembershipRepositoryPort {
  async findByWorkspaceId(workspaceId: UUID): Promise<MembershipWithContext[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select(
        '*, role:roles(*), workspace:workspaces(*), user:profiles(*)',
      )
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return (data as unknown as JoinedMembershipRow[]).map(mapJoined);
  }

  async findByUserId(userId: UUID): Promise<MembershipWithContext[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select(
        '*, role:roles(*), workspace:workspaces(*), user:profiles(*)',
      )
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return (data as unknown as JoinedMembershipRow[]).map(mapJoined);
  }

  async findMembership(
    workspaceId: UUID,
    userId: UUID,
  ): Promise<MembershipWithContext | null> {
    const { data, error } = await supabase
      .from('memberships')
      .select(
        '*, role:roles(*), workspace:workspaces(*), user:profiles(*)',
      )
      .eq('workspace_id', workspaceId)
      .eq('user_id', userId)
      .maybeSingle();
    if (error || !data) return null;
    return mapJoined(data as unknown as JoinedMembershipRow);
  }

  async create(data: {
    workspaceId: UUID;
    userId: UUID;
    roleId: UUID;
  }): Promise<Membership> {
    const { data: created, error } = await supabase
      .from('memberships')
      .insert({
        workspace_id: data.workspaceId,
        user_id: data.userId,
        role_id: data.roleId,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapMembership(created);
  }

  async updateRole(membershipId: UUID, roleId: UUID): Promise<Membership> {
    const { data: updated, error } = await supabase
      .from('memberships')
      .update({ role_id: roleId })
      .eq('id', membershipId)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapMembership(updated);
  }

  async delete(membershipId: UUID): Promise<void> {
    const { error } = await supabase
      .from('memberships')
      .delete()
      .eq('id', membershipId);
    if (error) throw new Error(error.message);
  }
}
