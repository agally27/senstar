/**
 * In-memory JobQueue for unit tests and local domain work — proves the
 * interface is genuinely engine-agnostic (ADR-0006: pg-boss is swappable).
 * Never used in preview or production.
 */
import type { JobPayload, JobQueue, JobRegistration, JobRequest } from './queue';

export interface MemoryQueue extends JobQueue {
  /** Run every enqueued job through its handler, in order. */
  drain(): Promise<void>;
  readonly enqueued: readonly JobRequest[];
}

export function createMemoryQueue(): MemoryQueue {
  const handlers = new Map<string, JobRegistration<never>>();
  const queued: JobRequest[] = [];
  let nextId = 1;

  return {
    enqueued: queued,
    async start(): Promise<void> {},
    async stop(): Promise<void> {},
    async enqueue<P extends JobPayload>(request: JobRequest<P>): Promise<string | null> {
      queued.push(request as unknown as JobRequest);
      const id = `mem-${nextId}`;
      nextId += 1;
      return id;
    },
    register<P extends JobPayload>(registration: JobRegistration<P>): void {
      handlers.set(registration.queue, registration as unknown as JobRegistration<never>);
    },
    async drain(): Promise<void> {
      const pending = queued.splice(0, queued.length);
      for (const request of pending) {
        const registration = handlers.get(request.queue);
        if (registration === undefined) {
          throw new Error(`No handler registered for queue '${request.queue}'`);
        }
        await (registration.handler as unknown as (p: unknown, c: unknown) => Promise<void>)(
          request.payload,
          { meta: request.meta, logger: silentLogger },
        );
      }
    },
  };
}

const noop = (): void => {};
const silentLogger = {
  debug: noop,
  info: noop,
  warn: noop,
  error: noop,
  child: () => silentLogger,
};
