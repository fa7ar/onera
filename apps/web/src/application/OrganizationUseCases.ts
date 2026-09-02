import type { Container } from '@/infrastructure/container';
import type { Organization, UUID } from '@/domain/types';
import { ValidationError, ForbiddenError, NotFoundError, ConflictError } from '@/domain/errors';
import { slugify, validateSlug, SYSTEM_ROLES, DEFAULT_ROLE_PERMISSIONS } from '@/domain/policies';
import { EventTypes, createEvent } from '@/domain/events';

export class OrganizationUseCases {
  constructor(private readonly c: Container) {}

  async createOrganization(
    userId: UUID,
    name: string,
    slugInput?: string,
  ): Promise<{ organization: Organization; workspaceId: UUID }> {
    if (!name.trim()) throw new ValidationError('Organization name is required');
    const slug = slugify(slugInput ?? name);
    if (!validateSlug(slug)) throw new ValidationError('Invalid slug generated from name');

    const existing = await this.c.orgRepo.findBySlug(slug);
    if (existing) throw new ConflictError('Organization slug already exists');

    const organization = await this.c.orgRepo.create({ name, slug, ownerId: userId });

    const allPerms = await this.c.permissionRepo.findAll();

    for (const [roleName, permKeys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const role = await this.c.roleRepo.create({
        organizationId: organization.id,
        name: roleName,
        isSystem: true,
      });
      const permIds = allPerms
        .filter((p) => permKeys.includes(p.key))
        .map((p) => p.id);
      if (permIds.length > 0) {
        await this.c.roleRepo.assignPermissions(role.id, permIds);
      }
    }

    const workspace = await this.c.workspaceRepo.create({
      organizationId: organization.id,
      name: 'Default',
      slug: 'default',
    });

    const ownerRole = (await this.c.roleRepo.findByOrganizationId(organization.id)).find(
      (r) => r.name === SYSTEM_ROLES.OWNER,
    );
    if (!ownerRole) throw new Error('Owner role not found after creation');

    await this.c.membershipRepo.create({
      workspaceId: workspace.id,
      userId,
      roleId: ownerRole.id,
    });

    this.c.eventBus.publish(
      createEvent(EventTypes.ORGANIZATION_CREATED, {
        organizationId: organization.id,
        ownerId: userId,
        name: organization.name,
      }),
    );

    return { organization, workspaceId: workspace.id };
  }

  async getOrganizationsForUser(userId: UUID): Promise<Organization[]> {
    return this.c.orgRepo.findByUserId(userId);
  }

  async getOrganization(id: UUID, userId: UUID): Promise<Organization> {
    const org = await this.c.orgRepo.findById(id);
    if (!org) throw new NotFoundError('Organization', id);

    const workspaces = await this.c.workspaceRepo.findByOrganizationId(org.id);
    const memberships = await Promise.all(
      workspaces.map((w) => this.c.membershipRepo.findMembership(w.id, userId)),
    );
    const isMember = memberships.some((m) => m !== null);
    if (!isMember) throw new ForbiddenError('You are not a member of this organization');

    return org;
  }

  async updateOrganization(
    id: UUID,
    userId: UUID,
    data: { name?: string },
  ): Promise<Organization> {
    const org = await this.getOrganization(id, userId);
    if (org.ownerId !== userId) throw new ForbiddenError('Only the owner can update the organization');
    return this.c.orgRepo.update(id, data);
  }

  async deleteOrganization(id: UUID, userId: UUID): Promise<void> {
    const org = await this.getOrganization(id, userId);
    if (org.ownerId !== userId) throw new ForbiddenError('Only the owner can delete the organization');
    await this.c.orgRepo.delete(id);
  }
}
