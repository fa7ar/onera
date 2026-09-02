import type { UUID } from '@onera/core';
import type { PermissionKey } from '@onera/domain';

export interface PermissionCheckerPort {
  hasPermission(userId: UUID, workspaceId: UUID, permission: PermissionKey): Promise<boolean>;
  hasAnyPermission(userId: UUID, workspaceId: UUID, permissions: PermissionKey[]): Promise<boolean>;
  getUserPermissions(userId: UUID, workspaceId: UUID): Promise<PermissionKey[]>;
}

export const CORE_PERMISSIONS = [
  'org.manage', 'org.delete', 'workspace.create', 'workspace.manage',
  'workspace.delete', 'member.invite', 'member.remove', 'member.manage',
  'role.manage', 'billing.manage', 'invoice.read', 'invoice.write',
] as const;

export type CorePermission = (typeof CORE_PERMISSIONS)[number];
