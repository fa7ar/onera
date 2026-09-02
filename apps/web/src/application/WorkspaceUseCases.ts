import type { Container } from '@/infrastructure/container';
import type { Workspace, UUID } from '@/domain/types';
import { ValidationError, ForbiddenError, NotFoundError, ConflictError } from '@/domain/errors';
import { slugify, validateSlug } from '@/domain/policies';
import { EventTypes, createEvent } from '@/domain/events';

export class WorkspaceUseCases {
  constructor(private readonly c: Container) {}

  async createWorkspace(
    userId: UUID,
    organizationId: UUID,
    name: string,
    slugInput?: string,
  ): Promise<Workspace> {
    if (!name.trim()) throw new ValidationError('Workspace name is required');
    const slug = slugify(slugInput ?? name);
    if (!validateSlug(slug)) throw new ValidationError('Invalid slug');

    const org = await this.c.orgRepo.findById(organizationId);
    if (!org) throw new NotFoundError('Organization', organizationId);

    const existingWorkspaces = await this.c.workspaceRepo.findByOrganizationId(organizationId);
    if (existingWorkspaces.some((w) => w.slug === slug)) {
      throw new ConflictError('Workspace slug already exists in this organization');
    }

    const workspace = await this.c.workspaceRepo.create({
      organizationId,
      name,
      slug,
    });

    const roles = await this.c.roleRepo.findByOrganizationId(organizationId);
    const memberRole = roles.find((r) => r.name === 'Member');
    if (!memberRole) throw new NotFoundError('Default Member role', organizationId);

    await this.c.membershipRepo.create({
      workspaceId: workspace.id,
      userId,
      roleId: memberRole.id,
    });

    this.c.eventBus.publish(
      createEvent(EventTypes.WORKSPACE_CREATED, {
        workspaceId: workspace.id,
        organizationId,
        name: workspace.name,
      }),
    );

    return workspace;
  }

  async getWorkspacesForOrganization(
    orgId: UUID,
    userId: UUID,
  ): Promise<Workspace[]> {
    const workspaces = await this.c.workspaceRepo.findByOrganizationId(orgId);
    const visible: Workspace[] = [];
    for (const w of workspaces) {
      const membership = await this.c.membershipRepo.findMembership(w.id, userId);
      if (membership) visible.push(w);
    }
    return visible;
  }

  async getWorkspacesForUser(userId: UUID): Promise<Workspace[]> {
    return this.c.workspaceRepo.findByUserId(userId);
  }

  async getWorkspace(id: UUID, userId: UUID): Promise<Workspace> {
    const ws = await this.c.workspaceRepo.findById(id);
    if (!ws) throw new NotFoundError('Workspace', id);
    const membership = await this.c.membershipRepo.findMembership(id, userId);
    if (!membership) throw new ForbiddenError('You are not a member of this workspace');
    return ws;
  }

  async updateWorkspace(
    id: UUID,
    userId: UUID,
    data: { name?: string },
  ): Promise<Workspace> {
    await this.getWorkspace(id, userId);
    return this.c.workspaceRepo.update(id, data);
  }

  async deleteWorkspace(id: UUID, userId: UUID): Promise<void> {
    const ws = await this.getWorkspace(id, userId);
    const org = await this.c.orgRepo.findById(ws.organizationId);
    if (!org || org.ownerId !== userId) {
      throw new ForbiddenError('Only the organization owner can delete workspaces');
    }
    await this.c.workspaceRepo.delete(id);
  }
}
