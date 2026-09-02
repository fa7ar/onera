# Development Setup

## Prerequisites

- Node.js >= 18
- pnpm >= 9

## Installation

```bash
pnpm install
```

## Development

```bash
pnpm dev          # Start Vite dev server
pnpm wrangler:dev # Start Cloudflare Worker locally (after build)
```

## Building

```bash
pnpm build        # Build the frontend to dist/
```

## Checks

```bash
pnpm lint         # ESLint
pnpm typecheck    # TypeScript strict mode
pnpm test         # Tests
pnpm check        # All of the above + build
```

## Cloudflare Worker

The Worker serves static assets from `dist/` and handles `/api/*` routes.

```bash
pnpm wrangler:dev     # Local worker dev
pnpm wrangler:deploy  # Deploy to Cloudflare
```

Configuration is in `wrangler.jsonc`. Secrets should be set via:

```bash
wrangler secret put SECRET_NAME
```

Never commit secrets to `.env` or `wrangler.jsonc`.
