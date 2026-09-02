/**
 * Development adapters — in-memory/mock implementations for testing.
 * NOT for production use.
 */

import type {
  DatabasePort,
  DatabaseTransactionPort,
  StoragePort,
  PaymentPort,
  EmailPort,
  QueuePort,
  CachePort,
  SearchPort,
  AIPort,
} from '@onera/domain';
import type { HealthStatus, Initializable, Disposable } from '@onera/core';

// ─── InMemoryCacheAdapter ───

interface CacheEntry {
  value: unknown;
  expiresAt?: number;
}

export class InMemoryCacheAdapter implements CachePort, Initializable, Disposable {
  private store = new Map<string, CacheEntry>();
  private initialized = false;

  async initialize(): Promise<void> { this.initialized = true; }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.store.get(key);
    if (!entry) return null;
    if (entry.expiresAt && Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return null;
    }
    return entry.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
    this.store.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined,
    });
  }

  async delete(key: string): Promise<void> { this.store.delete(key); }

  async invalidate(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    for (const key of this.store.keys()) {
      if (regex.test(key)) this.store.delete(key);
    }
  }

  async health(): Promise<HealthStatus> {
    return { state: 'healthy', details: { entries: this.store.size } };
  }

  dispose(): void { this.store.clear(); this.initialized = false; }
}

// ─── InMemoryDatabaseAdapter ───

export class InMemoryDatabaseAdapter implements DatabasePort, Initializable, Disposable {
  private tables = new Map<string, Record<string, unknown>[]>();
  private initialized = false;

  async initialize(): Promise<void> { this.initialized = true; }

  async query<T = unknown>(sql: string, _params?: unknown[]): Promise<T[]> {
    // Minimal stub — returns empty for SELECT, no-op for others
    if (sql.trim().toUpperCase().startsWith('SELECT')) return [] as T[];
    return [] as T[];
  }

  async transaction<T>(fn: (tx: DatabaseTransactionPort) => Promise<T>): Promise<T> {
    const tx: DatabaseTransactionPort = {
      query: <U = unknown>(sql: string, params?: unknown[]) => this.query<U>(sql, params),
    };
    return fn(tx);
  }

  async health(): Promise<HealthStatus> {
    return { state: 'healthy', details: { tables: this.tables.size, initialized: this.initialized } };
  }

  dispose(): void { this.tables.clear(); this.initialized = false; }
}

// ─── InMemoryStorageAdapter ───

export class InMemoryStorageAdapter implements StoragePort, Initializable, Disposable {
  private files = new Map<string, { data: Uint8Array; contentType: string }>();
  private baseUrl = 'http://localhost:3000/storage';
  private initialized = false;

  async initialize(): Promise<void> { this.initialized = true; }

  async upload(path: string, data: Uint8Array | string, contentType = 'application/octet-stream'): Promise<{ url: string }> {
    const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;
    this.files.set(path, { data: bytes, contentType });
    return { url: this.getPublicUrl(path) };
  }

  async download(path: string): Promise<Uint8Array> {
    const file = this.files.get(path);
    if (!file) throw new Error(`File not found: ${path}`);
    return file.data;
  }

  async delete(path: string): Promise<void> { this.files.delete(path); }

  getPublicUrl(path: string): string { return `${this.baseUrl}/${path}`; }

  async health(): Promise<HealthStatus> {
    return { state: 'healthy', details: { files: this.files.size } };
  }

  dispose(): void { this.files.clear(); this.initialized = false; }
}

// ─── MockPaymentAdapter ───

export class MockPaymentAdapter implements PaymentPort, Initializable, Disposable {
  private payments = new Map<string, { id: string; status: string; amount: number; currency: string }>();
  private initialized = false;

  async initialize(): Promise<void> { this.initialized = true; }

  async createPayment(data: { amount: number; currency: string; customerId?: string; metadata?: Record<string, unknown> }): Promise<{ id: string; status: string }> {
    const id = `pay_${crypto.randomUUID()}`;
    const payment = { id, status: 'pending', amount: data.amount, currency: data.currency };
    this.payments.set(id, payment);
    return { id, status: 'pending' };
  }

  async getPayment(paymentId: string): Promise<{ id: string; status: string; amount: number; currency: string }> {
    const payment = this.payments.get(paymentId);
    if (!payment) throw new Error(`Payment not found: ${paymentId}`);
    return payment;
  }

  async verifyWebhook(_payload: unknown, _signature: string): Promise<boolean> { return true; }

  async refund(paymentId: string): Promise<void> {
    const payment = this.payments.get(paymentId);
    if (payment) payment.status = 'refunded';
  }

  async health(): Promise<HealthStatus> {
    return { state: 'healthy', details: { payments: this.payments.size } };
  }

  dispose(): void { this.payments.clear(); this.initialized = false; }
}

// ─── InMemoryEmailAdapter ───

interface StoredEmail {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  sentAt: string;
}

export class InMemoryEmailAdapter implements EmailPort, Initializable, Disposable {
  private sent: StoredEmail[] = [];
  private initialized = false;

  async initialize(): Promise<void> { this.initialized = true; }

  async send(data: { to: string; subject: string; html?: string; text?: string; from?: string }): Promise<void> {
    this.sent.push({ ...data, sentAt: new Date().toISOString() });
  }

  async sendBatch(emails: Array<{ to: string; subject: string; html?: string; text?: string }>): Promise<void> {
    for (const email of emails) {
      this.sent.push({ ...email, sentAt: new Date().toISOString() });
    }
  }

  getSentEmails(): StoredEmail[] { return [...this.sent]; }

  async health(): Promise<HealthStatus> {
    return { state: 'healthy', details: { sent: this.sent.length } };
  }

  dispose(): void { this.sent = []; this.initialized = false; }
}

// ─── InMemoryQueueAdapter ───

interface QueuedMessage {
  id: string;
  data: unknown;
  acked: boolean;
}

export class InMemoryQueueAdapter implements QueuePort, Initializable, Disposable {
  private queues = new Map<string, QueuedMessage[]>();
  private initialized = false;

  async initialize(): Promise<void> { this.initialized = true; }

  async enqueue(queue: string, message: unknown): Promise<string> {
    const id = `msg_${crypto.randomUUID()}`;
    if (!this.queues.has(queue)) this.queues.set(queue, []);
    this.queues.get(queue)!.push({ id, data: message, acked: false });
    return id;
  }

  async dequeue(queue: string): Promise<{ id: string; data: unknown } | null> {
    const messages = this.queues.get(queue);
    if (!messages || messages.length === 0) return null;
    const msg = messages.find((m) => !m.acked);
    if (!msg) return null;
    return { id: msg.id, data: msg.data };
  }

  async ack(queue: string, messageId: string): Promise<void> {
    const messages = this.queues.get(queue);
    if (messages) {
      const msg = messages.find((m) => m.id === messageId);
      if (msg) msg.acked = true;
    }
  }

  async health(): Promise<HealthStatus> {
    return { state: 'healthy', details: { queues: this.queues.size } };
  }

  dispose(): void { this.queues.clear(); this.initialized = false; }
}

// ─── InMemorySearchAdapter ───

export class InMemorySearchAdapter implements SearchPort, Initializable, Disposable {
  private indices = new Map<string, Record<string, unknown>[]>();
  private initialized = false;

  async initialize(): Promise<void> { this.initialized = true; }

  async index(indexName: string, documents: Record<string, unknown>[]): Promise<void> {
    if (!this.indices.has(indexName)) this.indices.set(indexName, []);
    this.indices.get(indexName)!.push(...documents);
  }

  async search(indexName: string, query: string, options?: {
    limit?: number; offset?: number; filters?: Record<string, unknown>;
  }): Promise<{ hits: Record<string, unknown>[]; total: number }> {
    const docs = this.indices.get(indexName) ?? [];
    const lowerQuery = query.toLowerCase();
    let hits = docs.filter((doc) =>
      Object.values(doc).some((val) => String(val).toLowerCase().includes(lowerQuery))
    );

    if (options?.filters) {
      for (const [key, value] of Object.entries(options.filters)) {
        hits = hits.filter((doc) => doc[key] === value);
      }
    }

    const offset = options?.offset ?? 0;
    const limit = options?.limit ?? 20;
    const total = hits.length;
    hits = hits.slice(offset, offset + limit);

    return { hits, total };
  }

  async deleteDocuments(indexName: string, ids: string[]): Promise<void> {
    const docs = this.indices.get(indexName);
    if (docs) {
      const filtered = docs.filter((doc) => !ids.includes(String(doc.id)));
      this.indices.set(indexName, filtered);
    }
  }

  async health(): Promise<HealthStatus> {
    return { state: 'healthy', details: { indices: this.indices.size } };
  }

  dispose(): void { this.indices.clear(); this.initialized = false; }
}

// ─── MockAIAdapter ───

export class MockAIAdapter implements AIPort, Initializable, Disposable {
  private initialized = false;
  private callCount = 0;

  async initialize(): Promise<void> { this.initialized = true; }

  async complete(data: { prompt: string; system?: string }): Promise<{ text: string }> {
    this.callCount++;
    return { text: `[Mock AI response to: "${data.prompt.slice(0, 50)}..."]` };
  }

  async embed(text: string): Promise<number[]> {
    this.callCount++;
    // Deterministic mock embedding based on text length
    const dim = 128;
    const embedding: number[] = [];
    for (let i = 0; i < dim; i++) {
      embedding.push((text.charCodeAt(i % text.length) % 100) / 100);
    }
    return embedding;
  }

  async health(): Promise<HealthStatus> {
    return { state: 'healthy', details: { calls: this.callCount } };
  }

  dispose(): void { this.callCount = 0; this.initialized = false; }
}
