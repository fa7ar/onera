import { supabase } from '../supabaseClient';
import type { InvitationRepositoryPort } from '@/domain/ports/repositories';
import type { Invitation, UUID } from '@/domain/types';

function mapInvitation(data: {
  id: string;
  workspace_id: string;
  email: string;
  role_id: string;
  invited_by: string;
  status: 'pending' | 'accepted' | 'declined' | 'revoked';
  created_at: string;
}): Invitation {
  return {
    id: data.id,
    workspaceId: data.workspace_id,
    email: data.email,
    roleId: data.role_id,
    invitedBy: data.invited_by,
    status: data.status,
    createdAt: data.created_at,
  };
}

export class SupabaseInvitationRepository implements InvitationRepositoryPort {
  async findByWorkspaceId(workspaceId: UUID): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(mapInvitation);
  }

  async findByEmail(email: string): Promise<Invitation[]> {
    const { data, error } = await supabase
      .from('invitations')
      .select('*')
      .eq('email', email)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map(mapInvitation);
  }

  async create(data: {
    workspaceId: UUID;
    email: string;
    roleId: UUID;
    invitedBy: UUID;
  }): Promise<Invitation> {
    const { data: created, error } = await supabase
      .from('invitations')
      .insert({
        workspace_id: data.workspaceId,
        email: data.email,
        role_id: data.roleId,
        invited_by: data.invitedBy,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapInvitation(created);
  }

  async updateStatus(
    id: UUID,
    status: Invitation['status'],
  ): Promise<Invitation> {
    const { data: updated, error } = await supabase
      .from('invitations')
      .update({ status })
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapInvitation(updated);
  }

  async delete(id: UUID): Promise<void> {
    const { error } = await supabase.from('invitations').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
