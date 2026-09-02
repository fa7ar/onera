import type { PermissionKey } from './types';

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function validateSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function hasPermission(
  userPermissions: PermissionKey[],
  required: PermissionKey,
): boolean {
  return userPermissions.includes(required);
}

export function hasAnyPermission(
  userPermissions: PermissionKey[],
  required: PermissionKey[],
): boolean {
  return required.some((p) => userPermissions.includes(p));
}

export const SYSTEM_ROLES = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  MEMBER: 'Member',
  VIEWER: 'Viewer',
} as const;

export const DEFAULT_ROLE_PERMISSIONS: Record<string, PermissionKey[]> = {
  Owner: [
    'org.manage', 'org.delete', 'workspace.create', 'workspace.manage',
    'workspace.delete', 'member.invite', 'member.remove', 'member.manage',
    'role.manage', 'billing.manage', 'invoice.read', 'invoice.write',
  ],
  Admin: [
    'workspace.create', 'workspace.manage', 'member.invite',
    'member.remove', 'member.manage', 'invoice.read', 'invoice.write',
  ],
  Member: ['invoice.read'],
  Viewer: ['invoice.read'],
};
