import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { ConsoleLogger } from '@onera/core';

describe('ConsoleLogger', () => {
  let output: { level: string; msg: string }[];

  beforeEach(() => {
    output = [];
    console.log = (msg: string) => { output.push({ level: 'log', msg }); };
    console.warn = (msg: string) => { output.push({ level: 'warn', msg }); };
    console.error = (msg: string) => { output.push({ level: 'error', msg }); };
  });

  afterEach(() => {
    // Restore originals — vitest handles this automatically between tests
  });

  it('should log info messages as JSON', () => {
    const logger = new ConsoleLogger('req_test', 'info');
    logger.info('Test message', { key: 'value' });

    expect(output).toHaveLength(1);
    const entry = JSON.parse(output[0].msg);
    expect(entry.level).toBe('info');
    expect(entry.message).toBe('Test message');
    expect(entry.requestId).toBe('req_test');
    expect(entry.meta).toEqual({ key: 'value' });
    expect(entry.timestamp).toBeDefined();
  });

  it('should log error messages to console.error', () => {
    const logger = new ConsoleLogger('req_test', 'info');
    logger.error('Something went wrong');

    expect(output).toHaveLength(1);
    expect(output[0].level).toBe('error');
    const entry = JSON.parse(output[0].msg);
    expect(entry.level).toBe('error');
  });

  it('should respect minimum log level', () => {
    const logger = new ConsoleLogger('req_test', 'warn');
    logger.info('Should be suppressed');
    logger.warn('Should appear');

    expect(output).toHaveLength(1);
    expect(output[0].level).toBe('warn');
    const entry = JSON.parse(output[0].msg);
    expect(entry.level).toBe('warn');
  });

  it('should create child logger with requestId', () => {
    const logger = new ConsoleLogger(undefined, 'info');
    const child = logger.child('req_child');
    child.info('Child message');

    expect(output).toHaveLength(1);
    const entry = JSON.parse(output[0].msg);
    expect(entry.requestId).toBe('req_child');
  });
});
