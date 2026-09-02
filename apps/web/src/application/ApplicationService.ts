import { container, type Container } from '@/infrastructure/container';
import { AuthUseCases } from './AuthUseCases';
import { OrganizationUseCases } from './OrganizationUseCases';
import { WorkspaceUseCases } from './WorkspaceUseCases';
import { MembershipUseCases } from './MembershipUseCases';
import { RoleUseCases } from './RoleUseCases';

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

export const app = new ApplicationService(container);
