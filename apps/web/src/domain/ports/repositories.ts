import type {
  User,
  Organization,
  Workspace,
  Role,
  Permission,
  Membership,
  MembershipWithContext,
  Invitation,
  UUID,
  PermissionKey,
} from '@/domain/types';

export interface UserRepositoryPort {
  findById(id: UUID): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  updateProfile(id: UUID, data: { fullName?: string; avatarUrl?: string }): Promise<User>;
}

export interface OrganizationRepositoryPort {
  findById(id: UUID): Promise<Organization | null>;
  findBySlug(slug: string): Promise<Organization | null>;
  findByUserId(userId: UUID): Promise<Organization[]>;
  create(data: { name: string; slug: string; ownerId: UUID }): Promise<Organization>;
  update(id: UUID, data: { name?: string }): Promise<Organization>;
  delete(id: UUID): Promise<void>;
}

export interface WorkspaceRepositoryPort {
  findById(id: UUID): Promise<Workspace | null>;
  findByOrganizationId(orgId: UUID): Promise<Workspace[]>;
  findByUserId(userId: UUID): Promise<Workspace[]>;
  create(data: {
    organizationId: UUID;
    name: string;
    slug: string;
  }): Promise<Workspace>;
  update(id: UUID, data: { name?: string }): Promise<Workspace>;
  delete(id: UUID): Promise<void>;
}

export interface RoleRepositoryPort {
  findById(id: UUID): Promise<Role | null>;
  findByOrganizationId(orgId: UUID): Promise<Role[]>;
  create(data: {
    organizationId: UUID;
    name: string;
    isSystem?: boolean;
  }): Promise<Role>;
  delete(id: UUID): Promise<void>;
  assignPermissions(roleId: UUID, permissionIds: UUID[]): Promise<void>;
  getPermissions(roleId: UUID): Promise<Permission[]>;
  getPermissionKeys(userId: UUID, workspaceId: UUID): Promise<PermissionKey[]>;
}

export interface PermissionRepositoryPort {
  findAll(): Promise<Permission[]>;
  findByKey(key: PermissionKey): Promise<Permission | null>;
  findByModule(module: string): Promise<Permission[]>;
}

export interface MembershipRepositoryPort {
  findByWorkspaceId(workspaceId: UUID): Promise<MembershipWithContext[]>;
  findByUserId(userId: UUID): Promise<MembershipWithContext[]>;
  findMembership(
    workspaceId: UUID,
    userId: UUID,
  ): Promise<MembershipWithContext | null>;
  create(data: { workspaceId: UUID; userId: UUID; roleId: UUID }): Promise<Membership>;
  updateRole(membershipId: UUID, roleId: UUID): Promise<Membership>;
  delete(membershipId: UUID): Promise<void>;
}

export interface InvitationRepositoryPort {
  findByWorkspaceId(workspaceId: UUID): Promise<Invitation[]>;
  findByEmail(email: string): Promise<Invitation[]>;
  create(data: {
    workspaceId: UUID;
    email: string;
    roleId: UUID;
    invitedBy: UUID;
  }): Promise<Invitation>;
  updateStatus(id: UUID, status: Invitation['status']): Promise<Invitation>;
  delete(id: UUID): Promise<void>;
}
