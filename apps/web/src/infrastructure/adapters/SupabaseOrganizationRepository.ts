import { supabase } from '../supabaseClient';
import type { OrganizationRepositoryPort } from '@/domain/ports/repositories';
import type { Organization, UUID } from '@/domain/types';

function mapOrg(data: {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}): Organization {
  return {
    id: data.id,
    name: data.name,
    slug: data.slug,
    ownerId: data.owner_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export class SupabaseOrganizationRepository implements OrganizationRepositoryPort {
  async findById(id: UUID): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error || !data) return null;
    return mapOrg(data);
  }

  async findBySlug(slug: string): Promise<Organization | null> {
    const { data, error } = await supabase
      .from('organizations')
      .select('*')
      .eq('slug', slug)
      .maybeSingle();
    if (error || !data) return null;
    return mapOrg(data);
  }

  async findByUserId(userId: UUID): Promise<Organization[]> {
    const { data, error } = await supabase
      .from('memberships')
      .select('workspace:workspaces(organization:organizations(*))')
      .eq('user_id', userId);
    if (error || !data) return [];

    const orgs = new Map<string, Organization>();
    for (const row of data) {
      const orgData = (row as unknown as { workspace: { organization: Record<string, unknown> } }).workspace.organization;
      if (orgData && typeof orgData.id === 'string') {
        orgs.set(orgData.id, mapOrg(orgData as Parameters<typeof mapOrg>[0]));
      }
    }
    return Array.from(orgs.values());
  }

  async create(data: {
    name: string;
    slug: string;
    ownerId: UUID;
  }): Promise<Organization> {
    const { data: created, error } = await supabase
      .from('organizations')
      .insert({ name: data.name, slug: data.slug, owner_id: data.ownerId })
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapOrg(created);
  }

  async update(id: UUID, data: { name?: string }): Promise<Organization> {
    const update: Record<string, string> = { updated_at: new Date().toISOString() };
    if (data.name !== undefined) update.name = data.name;

    const { data: updated, error } = await supabase
      .from('organizations')
      .update(update)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw new Error(error.message);
    return mapOrg(updated);
  }

  async delete(id: UUID): Promise<void> {
    const { error } = await supabase.from('organizations').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
