import type { Container } from '@/infrastructure/container';
import type { MembershipWithContext, UUID, PermissionKey } from '@/domain/types';
import { ValidationError, ForbiddenError, NotFoundError } from '@/domain/errors';
import { validateEmail, hasPermission } from '@/domain/policies';
import { EventTypes, createEvent } from '@/domain/events';

export class MembershipUseCases {
  constructor(private readonly c: Container) {}

  async getMembers(
    workspaceId: UUID,
    userId: UUID,
  ): Promise<MembershipWithContext[]> {
    const membership = await this.c.membershipRepo.findMembership(workspaceId, userId);
    if (!membership) throw new ForbiddenError('You are not a member of this workspace');
    return this.c.membershipRepo.findByWorkspaceId(workspaceId);
  }

  async getUserPermissions(
    workspaceId: UUID,
    userId: UUID,
  ): Promise<PermissionKey[]> {
    return this.c.roleRepo.getPermissionKeys(userId, workspaceId);
  }

  async removeMember(
    workspaceId: UUID,
    membershipId: UUID,
    requesterId: UUID,
  ): Promise<void> {
    const membership = await this.c.membershipRepo.findMembership(workspaceId, requesterId);
    if (!membership) throw new ForbiddenError('You are not a member of this workspace');

    const permissions = await this.getUserPermissions(workspaceId, requesterId);
    const isOrgOwner = membership.role.name === 'Owner';
    if (!isOrgOwner && !hasPermission(permissions, 'member.remove')) {
      throw new ForbiddenError('You do not have permission to remove members');
    }

    await this.c.membershipRepo.delete(membershipId);
    this.c.eventBus.publish(
      createEvent(EventTypes.MEMBER_REMOVED, { workspaceId, membershipId }),
    );
  }

  async updateMemberRole(
    workspaceId: UUID,
    membershipId: UUID,
    roleId: UUID,
    requesterId: UUID,
  ): Promise<void> {
    const membership = await this.c.membershipRepo.findMembership(workspaceId, requesterId);
    if (!membership) throw new ForbiddenError('You are not a member of this workspace');

    const permissions = await this.getUserPermissions(workspaceId, requesterId);
    const isOrgOwner = membership.role.name === 'Owner';
    if (!isOrgOwner && !hasPermission(permissions, 'member.manage')) {
      throw new ForbiddenError('You do not have permission to manage members');
    }

    await this.c.membershipRepo.updateRole(membershipId, roleId);
  }

  async inviteMember(
    workspaceId: UUID,
    email: string,
    roleId: UUID,
    requesterId: UUID,
  ): Promise<void> {
    if (!validateEmail(email)) throw new ValidationError('Invalid email address');

    const membership = await this.c.membershipRepo.findMembership(workspaceId, requesterId);
    if (!membership) throw new ForbiddenError('You are not a member of this workspace');

    const permissions = await this.getUserPermissions(workspaceId, requesterId);
    const isOrgOwner = membership.role.name === 'Owner';
    if (!isOrgOwner && !hasPermission(permissions, 'member.invite')) {
      throw new ForbiddenError('You do not have permission to invite members');
    }

    const role = await this.c.roleRepo.findById(roleId);
    if (!role) throw new NotFoundError('Role', roleId);

    const existingMembers = await this.c.membershipRepo.findByWorkspaceId(workspaceId);
    const existingMember = existingMembers.find((m) => m.user.email === email);
    if (existingMember) throw new ValidationError('User is already a member');

    await this.c.invitationRepo.create({
      workspaceId,
      email,
      roleId,
      invitedBy: requesterId,
    });

    this.c.eventBus.publish(
      createEvent(EventTypes.INVITATION_SENT, { workspaceId, email }),
    );
  }

  async getInvitations(
    workspaceId: UUID,
    userId: UUID,
  ) {
    const membership = await this.c.membershipRepo.findMembership(workspaceId, userId);
    if (!membership) throw new ForbiddenError('You are not a member of this workspace');
    return this.c.invitationRepo.findByWorkspaceId(workspaceId);
  }

  async revokeInvitation(invitationId: UUID, userId: UUID): Promise<void> {
    const { data } = await (await import('@/infrastructure/supabaseClient')).supabase
      .from('invitations')
      .select('workspace_id, invited_by')
      .eq('id', invitationId)
      .maybeSingle();

    if (!data) throw new NotFoundError('Invitation', invitationId);
    if (data.invited_by !== userId) {
      const membership = await this.c.membershipRepo.findMembership(data.workspace_id, userId);
      if (!membership || membership.role.name !== 'Owner') {
        throw new ForbiddenError('You can only revoke invitations you sent');
      }
    }
    await this.c.invitationRepo.updateStatus(invitationId, 'revoked');
  }

  async acceptInvitation(
    invitationId: UUID,
    userId: UUID,
    userEmail: string,
  ): Promise<void> {
    const invitations = await this.c.invitationRepo.findByEmail(userEmail);
    const invitation = invitations.find((i) => i.id === invitationId);
    if (!invitation) throw new NotFoundError('Invitation', invitationId);

    const roles = await this.c.roleRepo.findByOrganizationId(
      (await this.c.workspaceRepo.findById(invitation.workspaceId))?.organizationId ?? '',
    );
    const role = roles.find((r) => r.id === invitation.roleId);
    if (!role) throw new NotFoundError('Role for invitation', invitation.roleId);

    await this.c.membershipRepo.create({
      workspaceId: invitation.workspaceId,
      userId,
      roleId: invitation.roleId,
    });
    await this.c.invitationRepo.updateStatus(invitationId, 'accepted');

    this.c.eventBus.publish(
      createEvent(EventTypes.INVITATION_ACCEPTED, {
        workspaceId: invitation.workspaceId,
        userId,
      }),
    );
  }
}
