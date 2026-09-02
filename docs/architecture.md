# Architectural Boundaries

## Layer Separation

```
UI → Application → Domain ← Ports (interfaces)
                      ↑
              Infrastructure (adapters implement ports)
```

## Allowed Dependencies

| Layer | May depend on |
|-------|--------------|
| `apps/web` (UI) | `@onera/application`, `@onera/ui`, `@onera/config` |
| `@onera/application` | `@onera/core`, `@onera/domain` |
| `@onera/domain` | `@onera/core` |
| `@onera/core` | Nothing |
| `adapters/*` | `@onera/core`, `@onera/domain` (implements ports) |
| `worker/` | Cloudflare APIs, static assets |

## Forbidden Patterns

1. **Domain → Provider SDK**: `packages/domain` must never import Supabase, Stripe, or any vendor SDK.
2. **Application → Provider SDK**: `packages/application` must never import vendor SDKs.
3. **UI → Adapters**: React components must never directly call database, storage, or payment adapters.
4. **Cloudflare APIs in domain/application/core**: No `D1`, `R2`, `KV`, `DurableObject` references in shared packages.
5. **Circular dependencies**: No package may depend on itself transitively.

## Port Pattern

Domain defines interfaces (ports). Infrastructure adapters implement them. Application consumes ports via dependency injection.

```typescript
// domain/ports.ts — interface only
export interface UserRepositoryPort {
  findById(id: UUID): Promise<User | null>;
}

// adapters/database — implementation
export class SupabaseUserRepository implements UserRepositoryPort {
  async findById(id: UUID): Promise<User | null> { /* ... */ }
}
```

## Extension System

Extensions (modules, addons, integrations) register via the `@onera/extension` registry and conform to `@onera/sdk` contracts. Extensions cannot bypass the port pattern.
