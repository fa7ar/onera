import type {
  UserRepositoryPort,
  OrganizationRepositoryPort,
  WorkspaceRepositoryPort,
  RoleRepositoryPort,
  PermissionRepositoryPort,
  MembershipRepositoryPort,
  InvitationRepositoryPort,
} from '@/domain/ports/repositories';
import type { AuthPort, EventBusPort } from '@/domain/ports/services';

import { SupabaseUserRepository } from '@/infrastructure/adapters/SupabaseUserRepository';
import { SupabaseOrganizationRepository } from '@/infrastructure/adapters/SupabaseOrganizationRepository';
import { SupabaseWorkspaceRepository } from '@/infrastructure/adapters/SupabaseWorkspaceRepository';
import { SupabaseRoleRepository } from '@/infrastructure/adapters/SupabaseRoleRepository';
import { SupabasePermissionRepository } from '@/infrastructure/adapters/SupabasePermissionRepository';
import { SupabaseMembershipRepository } from '@/infrastructure/adapters/SupabaseMembershipRepository';
import { SupabaseInvitationRepository } from '@/infrastructure/adapters/SupabaseInvitationRepository';
import { SupabaseAuthAdapter } from '@/infrastructure/adapters/SupabaseAuthAdapter';
import { InMemoryEventBus } from '@/infrastructure/adapters/InMemoryEventBus';

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

function createContainer(): Container {
  const userRepo = new SupabaseUserRepository();
  const eventBus = new InMemoryEventBus();

  return {
    userRepo,
    orgRepo: new SupabaseOrganizationRepository(),
    workspaceRepo: new SupabaseWorkspaceRepository(),
    roleRepo: new SupabaseRoleRepository(),
    permissionRepo: new SupabasePermissionRepository(),
    membershipRepo: new SupabaseMembershipRepository(),
    invitationRepo: new SupabaseInvitationRepository(),
    auth: new SupabaseAuthAdapter(userRepo),
    eventBus,
  };
}

export const container = createContainer();
