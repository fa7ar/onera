import type { EventBusPort } from '@/domain/ports/services';

type Handler = (payload: Record<string, unknown>) => void;

export class InMemoryEventBus implements EventBusPort {
  private handlers = new Map<string, Set<Handler>>();

  publish(event: { type: string; payload: Record<string, unknown> }): void {
    const handlers = this.handlers.get(event.type);
    if (handlers) {
      handlers.forEach((h) => h(event.payload));
    }
    const wildcard = this.handlers.get('*');
    if (wildcard) {
      wildcard.forEach((h) => h(event.payload));
    }
  }

  subscribe(type: string, handler: Handler): () => void {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, new Set());
    }
    this.handlers.get(type)!.add(handler);
    return () => {
      this.handlers.get(type)?.delete(handler);
    };
  }
}
