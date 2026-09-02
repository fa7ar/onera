import type {
  User, Organization, Workspace, Role, Permission,
  Membership, MembershipWithContext, Invitation, InvitationStatus,
  AuthSession, UUID, PermissionKey,
} from './types';
import type { HealthStatus } from '@onera/core';

// ─── Repository Ports (existing, from Onera-01) ───

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
  create(data: { organizationId: UUID; name: string; slug: string }): Promise<Workspace>;
  update(id: UUID, data: { name?: string }): Promise<Workspace>;
  delete(id: UUID): Promise<void>;
}

export interface RoleRepositoryPort {
  findById(id: UUID): Promise<Role | null>;
  findByOrganizationId(orgId: UUID): Promise<Role[]>;
  create(data: { organizationId: UUID; name: string; isSystem?: boolean }): Promise<Role>;
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
  findMembership(workspaceId: UUID, userId: UUID): Promise<MembershipWithContext | null>;
  create(data: { workspaceId: UUID; userId: UUID; roleId: UUID }): Promise<Membership>;
  updateRole(membershipId: UUID, roleId: UUID): Promise<Membership>;
  delete(membershipId: UUID): Promise<void>;
}

export interface InvitationRepositoryPort {
  findByWorkspaceId(workspaceId: UUID): Promise<Invitation[]>;
  findByEmail(email: string): Promise<Invitation[]>;
  create(data: { workspaceId: UUID; email: string; roleId: UUID; invitedBy: UUID }): Promise<Invitation>;
  updateStatus(id: UUID, status: InvitationStatus): Promise<Invitation>;
  delete(id: UUID): Promise<void>;
}

// ─── Capability Ports (Onera-02) ───

export interface AuthPort {
  signUp(email: string, password: string, fullName: string): Promise<{ user: User | null; error: string | null }>;
  signIn(email: string, password: string): Promise<{ session: AuthSession | null; error: string | null }>;
  signOut(): Promise<void>;
  getSession(): Promise<AuthSession | null>;
  onAuthStateChange(callback: (session: AuthSession | null) => void): () => void;
  updatePassword(newPassword: string): Promise<{ error: string | null }>;
}

export interface EventBusPort {
  publish(event: { type: string; payload: Record<string, unknown> }): void;
  subscribe(type: string, handler: (payload: Record<string, unknown>) => void): () => void;
}

// ─── Onera-02 Capability Ports ───

export interface DatabasePort {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
  transaction<T>(fn: (tx: DatabaseTransactionPort) => Promise<T>): Promise<T>;
  health(): Promise<HealthStatus>;
}

export interface DatabaseTransactionPort {
  query<T = unknown>(sql: string, params?: unknown[]): Promise<T[]>;
}

export interface StoragePort {
  upload(path: string, data: Uint8Array | string, contentType?: string): Promise<{ url: string }>;
  download(path: string): Promise<Uint8Array>;
  delete(path: string): Promise<void>;
  getPublicUrl(path: string): string;
  health(): Promise<HealthStatus>;
}

export interface PaymentPort {
  createPayment(data: {
    amount: number;
    currency: string;
    customerId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<{ id: string; status: string }>;
  getPayment(paymentId: string): Promise<{ id: string; status: string; amount: number; currency: string }>;
  verifyWebhook(payload: unknown, signature: string): Promise<boolean>;
  refund(paymentId: string): Promise<void>;
  health(): Promise<HealthStatus>;
}

export interface EmailPort {
  send(data: { to: string; subject: string; html?: string; text?: string; from?: string }): Promise<void>;
  sendBatch(emails: Array<{ to: string; subject: string; html?: string; text?: string }>): Promise<void>;
  health(): Promise<HealthStatus>;
}

export interface QueuePort {
  enqueue(queue: string, message: unknown): Promise<string>;
  dequeue(queue: string): Promise<{ id: string; data: unknown } | null>;
  ack(queue: string, messageId: string): Promise<void>;
  health(): Promise<HealthStatus>;
}

export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
  delete(key: string): Promise<void>;
  invalidate(pattern: string): Promise<void>;
  health(): Promise<HealthStatus>;
}

export interface SearchPort {
  index(indexName: string, documents: Record<string, unknown>[]): Promise<void>;
  search(indexName: string, query: string, options?: {
    limit?: number;
    offset?: number;
    filters?: Record<string, unknown>;
  }): Promise<{ hits: Record<string, unknown>[]; total: number }>;
  deleteDocuments(indexName: string, ids: string[]): Promise<void>;
  health(): Promise<HealthStatus>;
}

export interface AIPort {
  complete(data: {
    prompt: string;
    system?: string;
    maxTokens?: number;
    temperature?: number;
  }): Promise<{ text: string }>;
  embed(text: string): Promise<number[]>;
  health(): Promise<HealthStatus>;
}
