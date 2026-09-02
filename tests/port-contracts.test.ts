import { describe, it, expect } from 'vitest';
import {
  InMemoryCacheAdapter,
  InMemoryDatabaseAdapter,
  InMemoryStorageAdapter,
  MockPaymentAdapter,
  InMemoryEmailAdapter,
  InMemoryQueueAdapter,
  InMemorySearchAdapter,
  MockAIAdapter,
} from '@onera/adapter-dev';
import type {
  CachePort,
  DatabasePort,
  StoragePort,
  PaymentPort,
  EmailPort,
  QueuePort,
  SearchPort,
  AIPort,
} from '@onera/domain';

// Type-level contract verification — ensures adapters implement the port interface.
// If the assignment compiles, the contract is satisfied.

function assertCachePort(_adapter: CachePort): void {}
function assertDatabasePort(_adapter: DatabasePort): void {}
function assertStoragePort(_adapter: StoragePort): void {}
function assertPaymentPort(_adapter: PaymentPort): void {}
function assertEmailPort(_adapter: EmailPort): void {}
function assertQueuePort(_adapter: QueuePort): void {}
function assertSearchPort(_adapter: SearchPort): void {}
function assertAIPort(_adapter: AIPort): void {}

describe('Port Contract Compliance', () => {
  it('InMemoryCacheAdapter implements CachePort', () => {
    const adapter = new InMemoryCacheAdapter();
    assertCachePort(adapter);
    expect(typeof adapter.get).toBe('function');
    expect(typeof adapter.set).toBe('function');
    expect(typeof adapter.delete).toBe('function');
    expect(typeof adapter.invalidate).toBe('function');
    expect(typeof adapter.health).toBe('function');
  });

  it('InMemoryDatabaseAdapter implements DatabasePort', () => {
    const adapter = new InMemoryDatabaseAdapter();
    assertDatabasePort(adapter);
    expect(typeof adapter.query).toBe('function');
    expect(typeof adapter.transaction).toBe('function');
    expect(typeof adapter.health).toBe('function');
  });

  it('InMemoryStorageAdapter implements StoragePort', () => {
    const adapter = new InMemoryStorageAdapter();
    assertStoragePort(adapter);
    expect(typeof adapter.upload).toBe('function');
    expect(typeof adapter.download).toBe('function');
    expect(typeof adapter.delete).toBe('function');
    expect(typeof adapter.getPublicUrl).toBe('function');
    expect(typeof adapter.health).toBe('function');
  });

  it('MockPaymentAdapter implements PaymentPort', () => {
    const adapter = new MockPaymentAdapter();
    assertPaymentPort(adapter);
    expect(typeof adapter.createPayment).toBe('function');
    expect(typeof adapter.getPayment).toBe('function');
    expect(typeof adapter.verifyWebhook).toBe('function');
    expect(typeof adapter.refund).toBe('function');
    expect(typeof adapter.health).toBe('function');
  });

  it('InMemoryEmailAdapter implements EmailPort', () => {
    const adapter = new InMemoryEmailAdapter();
    assertEmailPort(adapter);
    expect(typeof adapter.send).toBe('function');
    expect(typeof adapter.sendBatch).toBe('function');
    expect(typeof adapter.health).toBe('function');
  });

  it('InMemoryQueueAdapter implements QueuePort', () => {
    const adapter = new InMemoryQueueAdapter();
    assertQueuePort(adapter);
    expect(typeof adapter.enqueue).toBe('function');
    expect(typeof adapter.dequeue).toBe('function');
    expect(typeof adapter.ack).toBe('function');
    expect(typeof adapter.health).toBe('function');
  });

  it('InMemorySearchAdapter implements SearchPort', () => {
    const adapter = new InMemorySearchAdapter();
    assertSearchPort(adapter);
    expect(typeof adapter.index).toBe('function');
    expect(typeof adapter.search).toBe('function');
    expect(typeof adapter.deleteDocuments).toBe('function');
    expect(typeof adapter.health).toBe('function');
  });

  it('MockAIAdapter implements AIPort', () => {
    const adapter = new MockAIAdapter();
    assertAIPort(adapter);
    expect(typeof adapter.complete).toBe('function');
    expect(typeof adapter.embed).toBe('function');
    expect(typeof adapter.health).toBe('function');
  });
});
