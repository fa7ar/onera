import type { UUID } from '@onera/core';

export interface ModuleManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  dependencies?: string[];
  permissions?: string[];
  migrations?: string[];
}

export interface ModuleContext {
  organizationId: UUID;
  workspaceId: UUID;
  userId: UUID;
}

export interface ModuleAPI {
  registerRoute(path: string, handler: unknown): void;
  registerEvent(eventType: string, handler: unknown): void;
  registerPermission(key: string, description: string): void;
}

export interface Module {
  manifest: ModuleManifest;
  install?(api: ModuleAPI): void | Promise<void>;
  uninstall?(): void | Promise<void>;
}

export type ModuleConstructor = new () => Module;
