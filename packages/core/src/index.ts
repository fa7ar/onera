// Onera Core — Runtime Infrastructure

// ─── Primitives (existing) ───
export type UUID = string;
export type ISODate = string;

export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'AUTHENTICATION_ERROR'
  | 'AUTHORIZATION_ERROR'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface AppError {
  code: ErrorCode;
  message: string;
  requestId?: string;
  details?: Record<string, unknown>;
}

export interface Result<T, E = AppError> {
  ok: boolean;
  value?: T;
  error?: E;
}

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E = AppError>(error: E): Result<never, E> {
  return { ok: false, error };
}

export interface Disposable {
  dispose(): void | Promise<void>;
}

export interface Identifiable {
  id: UUID;
}

export interface Timestamped {
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface Auditable extends Identifiable, Timestamped {}

// ─── Lifecycle ───
export interface Initializable {
  initialize(): Promise<void>;
}

export interface HealthCheckable {
  health(): Promise<HealthStatus>;
}

export type HealthState = 'healthy' | 'degraded' | 'unavailable';

export interface HealthStatus {
  state: HealthState;
  details?: Record<string, unknown>;
}

// ─── Provider Registry ───
export type ProviderName =
  | 'database'
  | 'storage'
  | 'auth'
  | 'payment'
  | 'email'
  | 'queue'
  | 'cache'
  | 'search'
  | 'ai';

export class ProviderNotRegisteredError extends Error {
  constructor(providerName: string) {
    super(`Provider not registered: ${providerName}`);
    this.name = 'ProviderNotRegisteredError';
  }
}

export class ProviderAlreadyRegisteredError extends Error {
  constructor(providerName: string) {
    super(`Provider already registered: ${providerName}`);
    this.name = 'ProviderAlreadyRegisteredError';
  }
}

export class ProviderRegistry {
  private providers = new Map<ProviderName, unknown>();

  register<T>(name: ProviderName, adapter: T): void {
    if (this.providers.has(name)) {
      throw new ProviderAlreadyRegisteredError(name);
    }
    this.providers.set(name, adapter);
  }

  resolve<T>(name: ProviderName): T {
    const adapter = this.providers.get(name);
    if (adapter === undefined) {
      throw new ProviderNotRegisteredError(name);
    }
    return adapter as T;
  }

  has(name: ProviderName): boolean {
    return this.providers.has(name);
  }

  registeredProviders(): ProviderName[] {
    return Array.from(this.providers.keys());
  }
}

// ─── Logger ───
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  level: LogLevel;
  message: string;
  requestId?: string;
  timestamp: string;
  meta?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(requestId: string): Logger;
}

export class ConsoleLogger implements Logger {
  constructor(
    private readonly requestId?: string,
    private readonly minLevel: LogLevel = 'info',
  ) {}

  private readonly levels: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (this.levels[level] < this.levels[this.minLevel]) return;
    const entry: LogEntry = {
      level,
      message,
      requestId: this.requestId,
      timestamp: new Date().toISOString(),
      meta,
    };
    const fn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    fn(JSON.stringify(entry));
  }

  debug(message: string, meta?: Record<string, unknown>): void { this.log('debug', message, meta); }
  info(message: string, meta?: Record<string, unknown>): void { this.log('info', message, meta); }
  warn(message: string, meta?: Record<string, unknown>): void { this.log('warn', message, meta); }
  error(message: string, meta?: Record<string, unknown>): void { this.log('error', message, meta); }

  child(requestId: string): Logger {
    return new ConsoleLogger(requestId, this.minLevel);
  }
}

// ─── Request Context ───
export interface RequestContext {
  requestId: string;
  timestamp: Date;
  url: string;
  method: string;
  headers: Record<string, string>;
}

const REQUEST_ID_MAX_LENGTH = 128;
const REQUEST_ID_PATTERN = /^[a-zA-Z0-9_-]+$/;

export function normalizeRequestId(raw: string | null | undefined): string {
  if (!raw || raw.length > REQUEST_ID_MAX_LENGTH || !REQUEST_ID_PATTERN.test(raw)) {
    return generateRequestId();
  }
  return raw;
}

export function generateRequestId(): string {
  return `req_${crypto.randomUUID()}`;
}

export function createRequestContext(request: Request): RequestContext {
  const rawId = request.headers.get('X-Request-ID');
  const requestId = normalizeRequestId(rawId);
  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  request.headers.forEach((value, key) => { headers[key] = value; });
  return {
    requestId,
    timestamp: new Date(),
    url: url.pathname + url.search,
    method: request.method,
    headers,
  };
}

// ─── Runtime Environment ───
export interface PublicConfig {
  appName: string;
  appVersion: string;
  env: 'development' | 'staging' | 'production';
  appUrl: string;
  apiUrl: string;
}

export interface PrivateConfig {
  databaseUrl?: string;
  authSecret?: string;
  storageBucket?: string;
  paymentSecretKey?: string;
  emailApiKey?: string;
  aiApiKey?: string;
}

export interface FeatureFlags {
  [key: string]: boolean;
}

export interface RuntimeEnvironment {
  public: PublicConfig;
  private: PrivateConfig;
  bindings?: Record<string, unknown>;
  features: FeatureFlags;
}

// ─── Runtime Config ───
export interface RuntimeConfig {
  environment: RuntimeEnvironment;
  providerOverrides?: Partial<Record<ProviderName, boolean>>;
}

// ─── Onera Context ───
export interface OneraContext {
  config: RuntimeConfig;
  providers: ProviderRegistry;
  request: RequestContext;
  logger: Logger;
  environment: RuntimeEnvironment;
}

// ─── Error Normalization ───
export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly provider: string,
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class ProviderUnavailableError extends ProviderError {
  constructor(provider: string, message = 'Provider is unavailable') {
    super(message, 'PROVIDER_UNAVAILABLE', provider);
    this.name = 'ProviderUnavailableError';
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(provider: string, message = 'Provider request timed out') {
    super(message, 'PROVIDER_TIMEOUT', provider);
    this.name = 'ProviderTimeoutError';
  }
}

export class ProviderRejectedError extends ProviderError {
  constructor(provider: string, message = 'Provider rejected the request') {
    super(message, 'PROVIDER_REJECTED', provider);
    this.name = 'ProviderRejectedError';
  }
}

export class ProviderAuthenticationFailedError extends ProviderError {
  constructor(provider: string, message = 'Provider authentication failed') {
    super(message, 'PROVIDER_AUTH_FAILED', provider);
    this.name = 'ProviderAuthenticationFailedError';
  }
}

export class ProviderRateLimitedError extends ProviderError {
  constructor(provider: string, message = 'Provider rate limited the request') {
    super(message, 'PROVIDER_RATE_LIMITED', provider);
    this.name = 'ProviderRateLimitedError';
  }
}

export function normalizeProviderError(error: unknown, provider: string): ProviderError {
  if (error instanceof ProviderError) return error;
  if (error instanceof Error) {
    return new ProviderError(error.message, 'PROVIDER_UNKNOWN', provider);
  }
  if (typeof error === 'string') {
    return new ProviderError(error, 'PROVIDER_UNKNOWN', provider);
  }
  return new ProviderError('Unknown provider error', 'PROVIDER_UNKNOWN', provider);
}

// ─── Health Check ───
export interface HealthReport {
  status: HealthState;
  service: string;
  timestamp: string;
  providers: Record<string, HealthState>;
}

export async function checkHealth(
  registry: ProviderRegistry,
  appName: string,
): Promise<HealthReport> {
  const providerStatuses: Record<string, HealthState> = {};
  let overall: HealthState = 'healthy';

  for (const name of registry.registeredProviders()) {
    try {
  const adapter = registry.resolve<HealthCheckable>(name);
      if (adapter && typeof adapter.health === 'function') {
        const status = await adapter.health();
        providerStatuses[name] = status.state;
        if (status.state === 'unavailable') overall = 'unavailable';
        else if (status.state === 'degraded' && overall === 'healthy') overall = 'degraded';
      } else {
        providerStatuses[name] = 'healthy';
      }
    } catch {
      providerStatuses[name] = 'degraded';
      if (overall === 'healthy') overall = 'degraded';
    }
  }

  return {
    status: overall,
    service: appName,
    timestamp: new Date().toISOString(),
    providers: providerStatuses,
  };
}
