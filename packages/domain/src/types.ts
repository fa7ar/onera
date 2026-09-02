import type { UUID, ISODate, ErrorCode } from '@onera/core';

export type { UUID, ISODate } from '@onera/core';

export type PermissionKey = string;

export interface User {
  id: UUID;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  createdAt: ISODate;
}

export interface Organization {
  id: UUID;
  name: string;
  slug: string;
  ownerId: UUID;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Workspace {
  id: UUID;
  organizationId: UUID;
  name: string;
  slug: string;
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Role {
  id: UUID;
  organizationId: UUID;
  name: string;
  isSystem: boolean;
  createdAt: ISODate;
}

export interface Permission {
  id: UUID;
  key: PermissionKey;
  description: string | null;
  module: string;
}

export interface Membership {
  id: UUID;
  workspaceId: UUID;
  userId: UUID;
  roleId: UUID;
  createdAt: ISODate;
}

export type InvitationStatus = 'pending' | 'accepted' | 'declined' | 'revoked';

export interface Invitation {
  id: UUID;
  workspaceId: UUID;
  email: string;
  roleId: UUID;
  invitedBy: UUID;
  status: InvitationStatus;
  createdAt: ISODate;
}

export interface MembershipWithContext {
  membership: Membership;
  user: Pick<User, 'id' | 'email' | 'fullName' | 'avatarUrl'>;
  role: Role;
  workspace: Workspace;
}

export interface AuthSession {
  user: User;
  accessToken: string;
}

export interface AuthContext {
  userId: UUID;
  email: string;
  activeWorkspaceId: UUID | null;
  permissions: PermissionKey[];
}

export type { ErrorCode } from '@onera/core';
