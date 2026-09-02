import { describe, it, expect } from 'vitest';
import {
  ProviderError,
  ProviderUnavailableError,
  ProviderTimeoutError,
  ProviderRejectedError,
  ProviderAuthenticationFailedError,
  ProviderRateLimitedError,
  normalizeProviderError,
} from '@onera/core';

describe('Error Normalization', () => {
  it('should create ProviderUnavailableError with correct code', () => {
    const err = new ProviderUnavailableError('redis');
    expect(err.code).toBe('PROVIDER_UNAVAILABLE');
    expect(err.provider).toBe('redis');
    expect(err.name).toBe('ProviderUnavailableError');
  });

  it('should create ProviderTimeoutError', () => {
    const err = new ProviderTimeoutError('postgres');
    expect(err.code).toBe('PROVIDER_TIMEOUT');
    expect(err.provider).toBe('postgres');
  });

  it('should create ProviderRejectedError', () => {
    const err = new ProviderRejectedError('stripe');
    expect(err.code).toBe('PROVIDER_REJECTED');
    expect(err.provider).toBe('stripe');
  });

  it('should create ProviderAuthenticationFailedError', () => {
    const err = new ProviderAuthenticationFailedError('supabase');
    expect(err.code).toBe('PROVIDER_AUTH_FAILED');
    expect(err.provider).toBe('supabase');
  });

  it('should create ProviderRateLimitedError', () => {
    const err = new ProviderRateLimitedError('openai');
    expect(err.code).toBe('PROVIDER_RATE_LIMITED');
    expect(err.provider).toBe('openai');
  });

  it('should pass through existing ProviderError instances', () => {
    const original = new ProviderTimeoutError('redis');
    const normalized = normalizeProviderError(original, 'redis');
    expect(normalized).toBe(original);
  });

  it('should wrap generic errors into ProviderError', () => {
    const generic = new Error('Connection refused');
    const normalized = normalizeProviderError(generic, 'postgres');
    expect(normalized).toBeInstanceOf(ProviderError);
    expect(normalized.code).toBe('PROVIDER_UNKNOWN');
    expect(normalized.provider).toBe('postgres');
    expect(normalized.message).toBe('Connection refused');
  });

  it('should wrap non-Error values', () => {
    const normalized = normalizeProviderError('something broke', 'redis');
    expect(normalized).toBeInstanceOf(ProviderError);
    expect(normalized.code).toBe('PROVIDER_UNKNOWN');
    expect(normalized.message).toBe('something broke');
  });
});
