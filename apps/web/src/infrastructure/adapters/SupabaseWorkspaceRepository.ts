import { supabase } from '../supabaseClient';
import type { WorkspaceRepositoryPort } from '@/domain/ports/repositories';
import type { Workspace, UUID } from '@/domain/types';

function mapWorkspace(data: {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  created_at: string;
  updated_at: string;
}): Workspace {
  return {
    id: data.id,
    organizationId: data.organization_id,
    name: data.name,
    slug: data.slug,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export class SupabaseWorkspaceRepository implements WorkspaceRepositoryPort {
  async findById(id: UUID): Promise<Workspace | null> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return mapWorkspace(data);
  }

  async findByOrganizationId(orgId: UUID): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('workspaces')
      .select('*')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: true });
    if (error || !data) return [];
    return data.map(mapWorkspace);
  }

  async findByUserId(userId: UUID): Promise<Workspace[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('workspace:workspaces(*)')
      .eq('user_id', userId);
    if (error || !data) return [];

    const workspaces = new Map<string, Workspace>();
    for (const row of data) {
      const ws = (row as unknown as { workspace: Parameters<typeof mapWorkspace>[0] }).workspace;
      if (ws && ws.id) workspaces.set(ws.id, mapWorkspace(ws));
    }
    return Array.from(workspaces.values());
  }

  async create(data: {
    organizationId: UUID;
    name: string;
    slug: string;
  }): Promise<Workspace> {
    const { data: created, error } = await supabase
      .from('workspaces')
      .insert({
        organization_id: data.organizationId,
        name: data.name,
        slug: data.slug,
      })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapWorkspace(created);
  }

  async update(id: UUID, data: { name?: string }): Promise<Workspace> {
    const update: Record<string, string> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) update.name = data.name;

    const { data: updated, error } = await supabase
      .from('workspaces')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapWorkspace(updated);
  }

  async delete(id: UUID): Promise<void> {
    const { error } = await supabase.from('workspaces').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
