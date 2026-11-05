# ONERA

**Open-source, modular, vendor-neutral ERP platform.**

Onera is designed for **Cloudflare Workers + Static Assets** with runtime portability. The architecture follows strict layering to keep domain and application logic free of vendor-specific dependencies. build by [Fajar Tri](https://fjr.ai.id)

## Quick Start

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Run all checks (lint + typecheck + build)
pnpm check
```

## Architecture

```
Browser → Cloudflare Worker → Static Assets / API Routes → Application → Domain
```

### Dependency Direction

```
UI → Application → Domain
         ↑
   Infrastructure (adapters implement domain ports)
```

**Never allow:**
- Domain → Provider SDKs (Supabase, Stripe, etc.)
- UI → Database / Payment / Storage adapters directly

### Monorepo Structure

| Directory | Purpose |
|-----------|---------|
| `apps/web` | Primary React + Vite frontend |
| `packages/*` | Shared packages (core, domain, application, ui, sdk, events, workflow, permissions, config, extension) |
| `adapters/*` | Provider boundary interfaces (database, auth, storage, payment, email, queue, cache, search, ai) |
| `modules/` | Future business modules |
| `addons/` | Future addons |
| `integrations/` | Future integrations |
| `database/` | Migrations and seeds |
| `worker/` | Cloudflare Worker entry point |
| `docs/` | Developer documentation |

### Packages

| Package | Purpose | Dependencies |
|---------|---------|-------------|
| `@onera/core` | Framework primitives, error model, shared types | None |
| `@onera/domain` | Domain entities, value objects, policies, ports | core |
| `@onera/application` | Use-case orchestration | core, domain |
| `@onera/ui` | Design-system primitives and tokens | React |
| `@onera/sdk` | Public developer-facing contracts | core, domain |
| `@onera/events` | Event contracts and in-memory bus | core, domain |
| `@onera/workflow` | Workflow engine boundaries | core |
| `@onera/permissions` | RBAC boundaries | core, domain |
| `@onera/config` | Typed configuration | core |
| `@onera/extension` | Extension system boundaries | core, sdk |

## Configuration

Environment variables are documented in `.env.example`. The typed configuration mechanism (`@onera/config`) provides safe access without direct `process.env` usage in application code.

## Error Handling

All API errors follow a standardized shape:

```json
{
  "error": {
    "code": "INTERNAL_ERROR",
    "message": "An unexpected error occurred.",
    "requestId": "..."
  }
}
```

Error codes: `VALIDATION_ERROR`, `AUTHENTICATION_ERROR`, `AUTHORIZATION_ERROR`, `NOT_FOUND`, `CONFLICT`, `RATE_LIMITED`, `INTERNAL_ERROR`.

## API

- `GET /api/health` — Health check endpoint
- `/api/v1/*` — Future API routes

## License

MIT
