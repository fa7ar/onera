import { describe, it, expect } from 'vitest';
import { normalizeRequestId, generateRequestId, createRequestContext } from '@onera/core';

describe('Request ID Handling', () => {
  it('should generate a valid request ID', () => {
    const id = generateRequestId();
    expect(id).toMatch(/^req_[a-f0-9-]{36}$/);
  });

  it('should accept a valid X-Request-ID header', () => {
    const id = normalizeRequestId('my-custom-id-123');
    expect(id).toBe('my-custom-id-123');
  });

  it('should reject empty string and generate a new ID', () => {
    const id = normalizeRequestId('');
    expect(id).toMatch(/^req_/);
  });

  it('should reject null and generate a new ID', () => {
    const id = normalizeRequestId(null);
    expect(id).toMatch(/^req_/);
  });

  it('should reject IDs with special characters', () => {
    const id = normalizeRequestId('id with spaces!');
    expect(id).toMatch(/^req_/);
  });

  it('should reject overly long IDs', () => {
    const longId = 'a'.repeat(200);
    const id = normalizeRequestId(longId);
    expect(id).toMatch(/^req_/);
  });

  it('should accept IDs with hyphens and underscores', () => {
    const id = normalizeRequestId('valid_id-with-dashes');
    expect(id).toBe('valid_id-with-dashes');
  });
});

describe('createRequestContext', () => {
  it('should create context from a Request', () => {
    const request = new Request('https://example.com/api/health?foo=bar', {
      method: 'GET',
      headers: { 'X-Request-ID': 'test-id-123' },
    });
    const ctx = createRequestContext(request);
    expect(ctx.requestId).toBe('test-id-123');
    expect(ctx.method).toBe('GET');
    expect(ctx.url).toBe('/api/health?foo=bar');
    expect(ctx.timestamp).toBeInstanceOf(Date);
  });

  it('should generate request ID when header is missing', () => {
    const request = new Request('https://example.com/api/health');
    const ctx = createRequestContext(request);
    expect(ctx.requestId).toMatch(/^req_/);
  });
});
