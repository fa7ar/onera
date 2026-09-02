import type { Module, ModuleManifest, ModuleConstructor } from '@onera/sdk';

type ExtensionType = 'module' | 'addon' | 'integration';

interface RegisteredExtension {
  type: ExtensionType;
  module: Module;
  enabled: boolean;
}

class ExtensionRegistry {
  private extensions = new Map<string, RegisteredExtension>();

  register(type: ExtensionType, ctor: ModuleConstructor): void {
    const module = new ctor();
    if (this.extensions.has(module.manifest.id)) {
      throw new Error(`Extension already registered: ${module.manifest.id}`);
    }
    this.extensions.set(module.manifest.id, { type, module, enabled: true });
  }

  unregister(id: string): void {
    const ext = this.extensions.get(id);
    if (ext?.module.uninstall) ext.module.uninstall();
    this.extensions.delete(id);
  }

  get(id: string): Module | null {
    return this.extensions.get(id)?.module ?? null;
  }

  list(type?: ExtensionType): ModuleManifest[] {
    return Array.from(this.extensions.values())
      .filter((e) => !type || e.type === type)
      .filter((e) => e.enabled)
      .map((e) => e.module.manifest);
  }

  enable(id: string): void {
    const ext = this.extensions.get(id);
    if (ext) ext.enabled = true;
  }

  disable(id: string): void {
    const ext = this.extensions.get(id);
    if (ext) ext.enabled = false;
  }
}

export { ExtensionRegistry };
export type { ExtensionType, RegisteredExtension, Module, ModuleManifest, ModuleConstructor };
