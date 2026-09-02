import type { Container } from '@/infrastructure/container';
import type { Role, Permission, UUID } from '@/domain/types';
import { ForbiddenError, ValidationError } from '@/domain/errors';

export class RoleUseCases {
  constructor(private readonly c: Container) {}

  async getRolesForOrganization(
    orgId: UUID,
    userId: UUID,
  ): Promise<Role[]> {
    return this.c.roleRepo.findByOrganizationId(orgId);
  }

  async getAllPermissions(): Promise<Permission[]> {
    return this.c.permissionRepo.findAll();
  }

  async getRolePermissions(roleId: UUID): Promise<Permission[]> {
    return this.c.roleRepo.getPermissions(roleId);
  }

  async createRole(
    orgId: UUID,
    name: string,
    permissionIds: UUID[],
    userId: UUID,
  ): Promise<Role> {
    if (!name.trim()) throw new ValidationError('Role name is required');
    const roles = await this.c.roleRepo.findByOrganizationId(orgId);
    if (roles.some((r) => r.name === name)) {
      throw new ValidationError('Role name already exists');
    }
    const role = await this.c.roleRepo.create({ organizationId: orgId, name });
    if (permissionIds.length > 0) {
      await this.c.roleRepo.assignPermissions(role.id, permissionIds);
    }
    return role;
  }

  async deleteRole(roleId: UUID, userId: UUID): Promise<void> {
    const role = await this.c.roleRepo.findById(roleId);
    if (!role) throw new Error('Role not found');
    if (role.isSystem) throw new ValidationError('Cannot delete a system role');
    await this.c.roleRepo.delete(roleId);
  }
}
