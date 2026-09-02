import type { AuthSession, UUID, Organization, Workspace, MembershipWithContext, Role, Permission, Invitation, PermissionKey } from '@onera/domain';
import type { UserRepositoryPort, OrganizationRepositoryPort, WorkspaceRepositoryPort, RoleRepositoryPort, PermissionRepositoryPort, MembershipRepositoryPort, InvitationRepositoryPort, AuthPort, EventBusPort } from '@onera/domain';
import { ValidationError, ForbiddenError, NotFoundError, ConflictError, UnauthorizedError } from '@onera/domain';
import { validateEmail, slugify, validateSlug, hasPermission, SYSTEM_ROLES, DEFAULT_ROLE_PERMISSIONS } from '@onera/domain';
import { EventTypes, createEvent } from '@onera/domain';

export interface Container {
  userRepo: UserRepositoryPort;
  orgRepo: OrganizationRepositoryPort;
  workspaceRepo: WorkspaceRepositoryPort;
  roleRepo: RoleRepositoryPort;
  permissionRepo: PermissionRepositoryPort;
  membershipRepo: MembershipRepositoryPort;
  invitationRepo: InvitationRepositoryPort;
  auth: AuthPort;
  eventBus: EventBusPort;
}

export class AuthUseCases {
  constructor(private readonly c: Container) {}
  async signUp(email: string, password: string, fullName: string) {
    if (!validateEmail(email)) throw new ValidationError('Invalid email address');
    if (password.length < 6) throw new ValidationError('Password must be at least 6 characters');
    if (!fullName.trim()) throw new ValidationError('Name is required');
    const { user, error } = await this.c.auth.signUp(email, password, fullName);
    if (error) throw new UnauthorizedError(error);
    if (!user) throw new UnauthorizedError('Sign up failed');
    this.c.eventBus.publish(createEvent(EventTypes.USER_SIGNED_UP, { userId: user.id, email }));
    return user;
  }
  async signIn(email: string, password: string): Promise<AuthSession> {
    if (!validateEmail(email)) throw new ValidationError('Invalid email address');
    if (!password) throw new ValidationError('Password is required');
    const { session, error } = await this.c.auth.signIn(email, password);
    if (error) throw new UnauthorizedError(error);
    if (!session) throw new UnauthorizedError('Sign in failed');
    this.c.eventBus.publish(createEvent(EventTypes.USER_SIGNED_IN, { userId: session.user.id }));
    return session;
  }
  async signOut(): Promise<void> { await this.c.auth.signOut(); }
  async getSession(): Promise<AuthSession | null> { return this.c.auth.getSession(); }
  onAuthStateChange(cb: (s: AuthSession | null) => void): () => void { return this.c.auth.onAuthStateChange(cb); }
  async updatePassword(pw: string): Promise<void> {
    if (pw.length < 6) throw new ValidationError('Password must be at least 6 characters');
    const { error } = await this.c.auth.updatePassword(pw);
    if (error) throw new UnauthorizedError(error);
  }
}

export class OrganizationUseCases {
  constructor(private readonly c: Container) {}
  async createOrganization(userId: UUID, name: string, slugInput?: string): Promise<{ organization: Organization; workspaceId: UUID }> {
    if (!name.trim()) throw new ValidationError('Organization name is required');
    const slug = slugify(slugInput ?? name);
    if (!validateSlug(slug)) throw new ValidationError('Invalid slug');
    const existing = await this.c.orgRepo.findBySlug(slug);
    if (existing) throw new ConflictError('Organization slug already exists');
    const organization = await this.c.orgRepo.create({ name, slug, ownerId: userId });
    const allPerms = await this.c.permissionRepo.findAll();
    for (const [roleName, permKeys] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
      const role = await this.c.roleRepo.create({ organizationId: organization.id, name: roleName, isSystem: true });
      const permIds = allPerms.filter((p) => permKeys.includes(p.key)).map((p) => p.id);
      if (permIds.length > 0) await this.c.roleRepo.assignPermissions(role.id, permIds);
    }
    const workspace = await this.c.workspaceRepo.create({ organizationId: organization.id, name: 'Default', slug: 'default' });
    const ownerRole = (await this.c.roleRepo.findByOrganizationId(organization.id)).find((r) => r.name === SYSTEM_ROLES.OWNER);
    if (!ownerRole) throw new Error('Owner role not found');
    await this.c.membershipRepo.create({ workspaceId: workspace.id, userId, roleId: ownerRole.id });
    this.c.eventBus.publish(createEvent(EventTypes.ORGANIZATION_CREATED, { organizationId: organization.id, ownerId: userId, name: organization.name }));
    return { organization, workspaceId: workspace.id };
  }
  async getOrganizationsForUser(userId: UUID): Promise<Organization[]> { return this.c.orgRepo.findByUserId(userId); }
  async getOrganization(id: UUID, userId: UUID): Promise<Organization> {
    const org = await this.c.orgRepo.findById(id);
    if (!org) throw new NotFoundError('Organization', id);
    const workspaces = await this.c.workspaceRepo.findByOrganizationId(org.id);
    const memberships = await Promise.all(workspaces.map((w) => this.c.membershipRepo.findMembership(w.id, userId)));
    if (!memberships.some((m) => m !== null)) throw new ForbiddenError('You are not a member of this organization');
    return org;
  }
  async updateOrganization(id: UUID, userId: UUID, data: { name?: string }): Promise<Organization> {
    const org = await this.getOrganization(id, userId);
    if (org.ownerId !== userId) throw new ForbiddenError('Only the owner can update');
    return this.c.orgRepo.update(id, data);
  }
  async deleteOrganization(id: UUID, userId: UUID): Promise<void> {
    const org = await this.getOrganization(id, userId);
    if (org.ownerId !== userId) throw new ForbiddenError('Only the owner can delete');
    await this.c.orgRepo.delete(id);
  }
}

export class WorkspaceUseCases {
  constructor(private readonly c: Container) {}
  async createWorkspace(userId: UUID, organizationId: UUID, name: string, slugInput?: string): Promise<Workspace> {
    if (!name.trim()) throw new ValidationError('Workspace name is required');
    const slug = slugify(slugInput ?? name);
    if (!validateSlug(slug)) throw new ValidationError('Invalid slug');
    const org = await this.c.orgRepo.findById(organizationId);
    if (!org) throw new NotFoundError('Organization', organizationId);
    const existing = await this.c.workspaceRepo.findByOrganizationId(organizationId);
    if (existing.some((w) => w.slug === slug)) throw new ConflictError('Workspace slug already exists');
    const workspace = await this.c.workspaceRepo.create({ organizationId, name, slug });
    const roles = await this.c.roleRepo.findByOrganizationId(organizationId);
    const memberRole = roles.find((r) => r.name === 'Member');
    if (!memberRole) throw new NotFoundError('Default Member role', organizationId);
    await this.c.membershipRepo.create({ workspaceId: workspace.id, userId, roleId: memberRole.id });
    this.c.eventBus.publish(createEvent(EventTypes.WORKSPACE_CREATED, { workspaceId: workspace.id, organizationId, name }));
    return workspace;
  }
  async getWorkspacesForOrganization(orgId: UUID, userId: UUID): Promise<Workspace[]> {
    const workspaces = await this.c.workspaceRepo.findByOrganizationId(orgId);
    const visible: Workspace[] = [];
    for (const w of workspaces) { if (await this.c.membershipRepo.findMembership(w.id, userId)) visible.push(w); }
    return visible;
  }
  async getWorkspacesForUser(userId: UUID): Promise<Workspace[]> { return this.c.workspaceRepo.findByUserId(userId); }
  async getWorkspace(id: UUID, userId: UUID): Promise<Workspace> {
    const ws = await this.c.workspaceRepo.findById(id);
    if (!ws) throw new NotFoundError('Workspace', id);
    if (!(await this.c.membershipRepo.findMembership(id, userId))) throw new ForbiddenError('Not a member');
    return ws;
  }
  async updateWorkspace(id: UUID, userId: UUID, data: { name?: string }): Promise<Workspace> {
    await this.getWorkspace(id, userId);
    return this.c.workspaceRepo.update(id, data);
  }
  async deleteWorkspace(id: UUID, userId: UUID): Promise<void> {
    const ws = await this.getWorkspace(id, userId);
    const org = await this.c.orgRepo.findById(ws.organizationId);
    if (!org || org.ownerId !== userId) throw new ForbiddenError('Only org owner can delete');
    await this.c.workspaceRepo.delete(id);
  }
}

export class MembershipUseCases {
  constructor(private readonly c: Container) {}
  async getMembers(wsId: UUID, userId: UUID): Promise<MembershipWithContext[]> {
    if (!(await this.c.membershipRepo.findMembership(wsId, userId))) throw new ForbiddenError('Not a member');
    return this.c.membershipRepo.findByWorkspaceId(wsId);
  }
  async getUserPermissions(wsId: UUID, userId: UUID): Promise<PermissionKey[]> { return this.c.roleRepo.getPermissionKeys(userId, wsId); }
  async removeMember(wsId: UUID, membershipId: UUID, requesterId: UUID): Promise<void> {
    const m = await this.c.membershipRepo.findMembership(wsId, requesterId);
    if (!m) throw new ForbiddenError('Not a member');
    const perms = await this.getUserPermissions(wsId, requesterId);
    if (m.role.name !== 'Owner' && !hasPermission(perms, 'member.remove')) throw new ForbiddenError('No permission to remove');
    await this.c.membershipRepo.delete(membershipId);
  }
  async updateMemberRole(wsId: UUID, membershipId: UUID, roleId: UUID, requesterId: UUID): Promise<void> {
    const m = await this.c.membershipRepo.findMembership(wsId, requesterId);
    if (!m) throw new ForbiddenError('Not a member');
    const perms = await this.getUserPermissions(wsId, requesterId);
    if (m.role.name !== 'Owner' && !hasPermission(perms, 'member.manage')) throw new ForbiddenError('No permission');
    await this.c.membershipRepo.updateRole(membershipId, roleId);
  }
  async inviteMember(wsId: UUID, email: string, roleId: UUID, requesterId: UUID): Promise<void> {
    if (!validateEmail(email)) throw new ValidationError('Invalid email');
    const m = await this.c.membershipRepo.findMembership(wsId, requesterId);
    if (!m) throw new ForbiddenError('Not a member');
    const perms = await this.getUserPermissions(wsId, requesterId);
    if (m.role.name !== 'Owner' && !hasPermission(perms, 'member.invite')) throw new ForbiddenError('No permission');
    const role = await this.c.roleRepo.findById(roleId);
    if (!role) throw new NotFoundError('Role', roleId);
    const existing = await this.c.membershipRepo.findByWorkspaceId(wsId);
    if (existing.some((mem) => mem.user.email === email)) throw new ValidationError('Already a member');
    await this.c.invitationRepo.create({ workspaceId: wsId, email, roleId, invitedBy: requesterId });
  }
  async getInvitations(wsId: UUID, userId: UUID): Promise<Invitation[]> {
    if (!(await this.c.membershipRepo.findMembership(wsId, userId))) throw new ForbiddenError('Not a member');
    return this.c.invitationRepo.findByWorkspaceId(wsId);
  }
  async revokeInvitation(invitationId: UUID, userId: UUID): Promise<void> {
    const inv = (await this.c.invitationRepo.findByEmail('')).find((i) => i.id === invitationId);
    if (!inv) throw new NotFoundError('Invitation', invitationId);
    if (inv.invitedBy !== userId) {
      const m = await this.c.membershipRepo.findMembership(inv.workspaceId, userId);
      if (!m || m.role.name !== 'Owner') throw new ForbiddenError('Can only revoke own invitations');
    }
    await this.c.invitationRepo.updateStatus(invitationId, 'revoked');
  }
  async acceptInvitation(invitationId: UUID, userId: UUID, userEmail: string): Promise<void> {
    const invs = await this.c.invitationRepo.findByEmail(userEmail);
    const inv = invs.find((i) => i.id === invitationId);
    if (!inv) throw new NotFoundError('Invitation', invitationId);
    await this.c.membershipRepo.create({ workspaceId: inv.workspaceId, userId, roleId: inv.roleId });
    await this.c.invitationRepo.updateStatus(invitationId, 'accepted');
  }
}

export class RoleUseCases {
  constructor(private readonly c: Container) {}
  async getRolesForOrganization(orgId: UUID, _userId: UUID): Promise<Role[]> { return this.c.roleRepo.findByOrganizationId(orgId); }
  async getAllPermissions(): Promise<Permission[]> { return this.c.permissionRepo.findAll(); }
  async getRolePermissions(roleId: UUID): Promise<Permission[]> { return this.c.roleRepo.getPermissions(roleId); }
  async createRole(orgId: UUID, name: string, permissionIds: UUID[], _userId: UUID): Promise<Role> {
    if (!name.trim()) throw new ValidationError('Role name required');
    const roles = await this.c.roleRepo.findByOrganizationId(orgId);
    if (roles.some((r) => r.name === name)) throw new ValidationError('Role name exists');
    const role = await this.c.roleRepo.create({ organizationId: orgId, name });
    if (permissionIds.length > 0) await this.c.roleRepo.assignPermissions(role.id, permissionIds);
    return role;
  }
  async deleteRole(roleId: UUID, _userId: UUID): Promise<void> {
    const role = await this.c.roleRepo.findById(roleId);
    if (!role) throw new NotFoundError('Role', roleId);
    if (role.isSystem) throw new ValidationError('Cannot delete system role');
    await this.c.roleRepo.delete(roleId);
  }
}

export class ApplicationService {
  readonly auth: AuthUseCases;
  readonly organizations: OrganizationUseCases;
  readonly workspaces: WorkspaceUseCases;
  readonly memberships: MembershipUseCases;
  readonly roles: RoleUseCases;
  constructor(c: Container) {
    this.auth = new AuthUseCases(c);
    this.organizations = new OrganizationUseCases(c);
    this.workspaces = new WorkspaceUseCases(c);
    this.memberships = new MembershipUseCases(c);
    this.roles = new RoleUseCases(c);
  }
}

export { ValidationError, NotFoundError, ForbiddenError, ConflictError, UnauthorizedError };
export type { AuthSession, Organization, Workspace, MembershipWithContext, Role, Permission, Invitation, PermissionKey };
