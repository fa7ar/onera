import type { ErrorCode } from '@onera/core';

export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id: string) {
    super(`${resource} not found: ${id}`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message = 'Unauthorized') {
    super(message, 'AUTHENTICATION_ERROR');
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = 'Forbidden') {
    super(message, 'AUTHORIZATION_ERROR');
    this.name = 'ForbiddenError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class RateLimitedError extends DomainError {
  constructor(message = 'Rate limited') {
    super(message, 'RATE_LIMITED');
    this.name = 'RateLimitedError';
  }
}

export class InternalError extends DomainError {
  constructor(message = 'An unexpected error occurred') {
    super(message, 'INTERNAL_ERROR');
    this.name = 'InternalError';
  }
}
