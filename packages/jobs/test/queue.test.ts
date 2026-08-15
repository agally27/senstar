import { describe, expect, it, vi } from 'vitest';
import { createMemoryQueue, type JobHandler, type JobPayload } from '../src/index';

interface GenerateContentPayload extends JobPayload {
  readonly learnerId: string;
  readonly objectiveId: string;
  readonly attempt: number;
}

describe('JobQueue contract (via the in-memory implementation)', () => {
  it('enqueues and runs a job through its registered handler', async () => {
    const queue = createMemoryQueue();
    const seen: GenerateContentPayload[] = [];
    queue.register<GenerateContentPayload>({
      queue: 'content.generate',
      handler: async (payload) => {
        seen.push(payload);
      },
    });

    await queue.enqueue<GenerateContentPayload>({
      queue: 'content.generate',
      payload: { learnerId: 'lrn-1', objectiveId: 'obj-1', attempt: 1 },
      meta: { correlationId: 'corr-1', organisationId: 'org-1' },
    });
    await queue.drain();

    expect(seen).toHaveLength(1);
    expect(seen[0]?.learnerId).toBe('lrn-1');
  });

  it('passes correlation metadata to the handler so logs join up', async () => {
    const queue = createMemoryQueue();
    const handler = vi.fn<JobHandler>(async () => {});
    queue.register({ queue: 'reports.build', handler });
    await queue.enqueue({
      queue: 'reports.build',
      payload: { learnerId: 'lrn-2' },
      meta: { correlationId: 'corr-2' },
    });
    await queue.drain();
    expect(handler.mock.calls[0]?.[1]).toMatchObject({ meta: { correlationId: 'corr-2' } });
  });

  it('fails loudly when a queue has no registered handler', async () => {
    const queue = createMemoryQueue();
    await queue.enqueue({
      queue: 'nobody.listening',
      payload: {},
      meta: { correlationId: 'corr-3' },
    });
    await expect(queue.drain()).rejects.toThrowError(/No handler registered/);
  });

  it('propagates handler failures so the engine can apply its retry policy', async () => {
    const queue = createMemoryQueue();
    queue.register({
      queue: 'flaky',
      handler: async () => {
        throw new Error('downstream unavailable');
      },
    });
    await queue.enqueue({ queue: 'flaky', payload: {}, meta: { correlationId: 'corr-4' } });
    await expect(queue.drain()).rejects.toThrowError(/downstream unavailable/);
  });

  it('records what was enqueued, for assertions in domain tests', async () => {
    const queue = createMemoryQueue();
    await queue.enqueue({ queue: 'a', payload: { x: 1 }, meta: { correlationId: 'c' } });
    expect(queue.enqueued).toHaveLength(1);
    expect(queue.enqueued[0]?.queue).toBe('a');
  });
});
