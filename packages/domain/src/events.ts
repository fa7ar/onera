import type { UUID } from '@onera/core';

export interface DomainEvent {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export function createEvent(
  type: string,
  payload: Record<string, unknown>,
): DomainEvent {
  return { type, payload, timestamp: new Date().toISOString() };
}

export const EventTypes = {
  USER_SIGNED_UP: 'user.signed_up',
  USER_SIGNED_IN: 'user.signed_in',
  ORGANIZATION_CREATED: 'organization.created',
  WORKSPACE_CREATED: 'workspace.created',
  MEMBER_ADDED: 'member.added',
  MEMBER_REMOVED: 'member.removed',
  INVITATION_SENT: 'invitation.sent',
  INVITATION_ACCEPTED: 'invitation.accepted',
} as const;

export type OrganizationCreatedEvent = DomainEvent & {
  payload: { organizationId: UUID; ownerId: UUID; name: string };
};

export type WorkspaceCreatedEvent = DomainEvent & {
  payload: { workspaceId: UUID; organizationId: UUID; name: string };
};

export type MemberAddedEvent = DomainEvent & {
  payload: { workspaceId: UUID; userId: UUID; roleId: UUID };
};
