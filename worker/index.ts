/**
 * Onera Cloudflare Worker — Runtime & Adapter Kernel (Onera-02).
 *
 * Serves static assets, handles API routes with structured error handling,
 * request ID propagation, health checks, and provider registry boot.
 *
 * Cloudflare-specific APIs are isolated here at the runtime boundary.
 * Domain/application packages have zero Cloudflare dependencies.
 */

import {
  type OneraContext,
  type RuntimeEnvironment,
  type PublicConfig,
  type PrivateConfig,
  type FeatureFlags,
  type Logger,
  ConsoleLogger,
  ProviderRegistry,
  createRequestContext,
  checkHealth,
  normalizeProviderError,
} from '@onera/core';

// ─── Cloudflare Bindings (isolated to runtime boundary) ───

interface AssetFetcher {
  fetch(request: Request): Promise<Response>;
}

interface CloudflareBindings {
  ASSETS: AssetFetcher;
  APP_ENV: string;
  DB?: unknown;
  R2?: unknown;
  KV?: unknown;
  QUEUE?: unknown;
}

// ─── CORS ───

const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Request-ID',
  'Access-Control-Expose-Headers': 'X-Request-ID',
};

// ─── Response Helpers ───

function jsonResponse(data: unknown, status = 200, extraHeaders?: Record<string, string>): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders, ...extraHeaders },
  });
}

function errorResponse(
  code: string,
  message: string,
  status: number,
  requestId: string,
): Response {
  return jsonResponse(
    { error: { code, message, requestId } },
    status,
    { 'X-Request-ID': requestId },
  );
}

// ─── Composition Root ───
// This is the ONLY place where providers are assembled.

function createEnvironment(env: CloudflareBindings): RuntimeEnvironment {
  const publicConfig: PublicConfig = {
    appName: 'Onera',
    appVersion: '0.1.0',
    env: (env.APP_ENV ?? 'development') as PublicConfig['env'],
    appUrl: 'http://localhost:8787',
    apiUrl: 'http://localhost:8787',
  };

  const privateConfig: PrivateConfig = {};

  const features: FeatureFlags = {
    'api.health': true,
    'api.v1': false,
  };

  return {
    public: publicConfig,
    private: privateConfig,
    bindings: {
      DB: env.DB,
      R2: env.R2,
      KV: env.KV,
      QUEUE: env.QUEUE,
    },
    features,
  };
}

function bootProviders(_env: RuntimeEnvironment): ProviderRegistry {
  const registry = new ProviderRegistry();
  // In Onera-02, no provider implementations are registered.
  // Development adapters are available in @onera/adapter-dev for testing.
  // Actual provider registration happens in future phases.
  return registry;
}

// ─── Runtime Error Boundary ───

function handleError(error: unknown, requestId: string, logger: Logger): Response {
  logger.error('Unhandled error', { requestId, error: error instanceof Error ? error.message : String(error) });

  if (error instanceof Error) {
    // Check for known provider errors
    const name = error.name;
    if (name === 'ProviderUnavailableError' || name === 'ProviderTimeoutError') {
      return errorResponse('INTERNAL_ERROR', 'A service is temporarily unavailable.', 503, requestId);
    }
    if (name === 'ProviderRateLimitedError') {
      return errorResponse('RATE_LIMITED', 'Too many requests. Please try again later.', 429, requestId);
    }
    if (name === 'ProviderAuthenticationFailedError') {
      return errorResponse('AUTHENTICATION_ERROR', 'Authentication failed.', 401, requestId);
    }
  }

  const normalized = normalizeProviderError(error, 'worker');
  if (normalized.code !== 'PROVIDER_UNKNOWN') {
    return errorResponse('INTERNAL_ERROR', 'A service error occurred.', 502, requestId);
  }

  return errorResponse('INTERNAL_ERROR', 'An unexpected error occurred.', 500, requestId);
}

// ─── Worker Entry ───

export default {
  async fetch(request: Request, env: CloudflareBindings): Promise<Response> {
    const reqCtx = createRequestContext(request);
    const requestId = reqCtx.requestId;
    const logger = new ConsoleLogger(requestId).child(requestId);

    // Preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 200, headers: corsHeaders });
    }

    // Boot runtime
    const environment = createEnvironment(env);
    const providers = bootProviders(environment);
    const ctx: OneraContext = {
      config: { environment },
      providers,
      request: reqCtx,
      logger,
      environment,
    };

    const url = new URL(request.url);
    const { pathname } = url;

    try {
      // Health endpoint
      if (pathname === '/api/health') {
        const report = await checkHealth(ctx.providers, ctx.environment.public.appName);
        const httpStatus = report.status === 'healthy' ? 200 : report.status === 'degraded' ? 200 : 503;
        return jsonResponse(report, httpStatus, { 'X-Request-ID': requestId });
      }

      // Future API routes (/api/v1/*)
      if (pathname.startsWith('/api/')) {
        return errorResponse('NOT_FOUND', 'API endpoint not found.', 404, requestId);
      }

      // Static assets
      return await env.ASSETS.fetch(request);
    } catch (error) {
      return handleError(error, requestId, logger);
    }
  },
};
