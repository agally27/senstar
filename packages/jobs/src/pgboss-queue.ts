/**
 * pg-boss adapter (ADR-0006). The only file in the platform that imports
 * pg-boss. Everything else depends on the JobQueue interface.
 */
import { PgBoss, type Job } from 'pg-boss';
import type { Logger } from '@senstar/observability';
import type { JobEnvelope, JobPayload, JobQueue, JobRegistration, JobRequest } from './queue';

export interface PgBossQueueOptions {
  readonly databaseUrl: string;
  readonly logger: Logger;
  /** Worker mode registers handlers and polls; omit for enqueue-only (e.g. web requests). */
  readonly asWorker?: boolean;
  /** pg-boss keeps its job history in its own schema, away from domain tables. */
  readonly schema?: string;
}

const DEFAULT_RETRY_LIMIT = 3;
const DEFAULT_RETRY_DELAY_SECONDS = 30;

export function createPgBossQueue(options: PgBossQueueOptions): JobQueue {
  const boss = new PgBoss({
    connectionString: options.databaseUrl,
    schema: options.schema ?? 'jobs',
  });
  const registrations = new Map<string, JobRegistration<JobPayload>>();
  const logger = options.logger;

  boss.on('error', (error: Error) => {
    logger.error('job engine error', { operation: 'jobs.engine' }, { message: error.message });
  });

  return {
    async start(): Promise<void> {
      await boss.start();
      if (options.asWorker !== true) return;

      for (const registration of registrations.values()) {
        await boss.createQueue(registration.queue);
        await boss.work(
          registration.queue,
          { batchSize: 1 },
          async (jobs: Job<JobEnvelope>[]): Promise<void> => {
            const job = jobs[0];
            if (job === undefined) return;
            const { payload, meta } = job.data;
            const jobLogger = logger.child({
              correlationId: meta.correlationId,
              ...(meta.organisationId === undefined ? {} : { organisationId: meta.organisationId }),
              operation: `jobs.${registration.queue}`,
            });
            jobLogger.info('job started');
            try {
              await registration.handler(payload, { meta, logger: jobLogger });
              jobLogger.info('job completed');
            } catch (error) {
              jobLogger.error(
                'job failed',
                { outcome: 'handler_threw' },
                { message: error instanceof Error ? error.message : 'unknown' },
              );
              throw error; // let pg-boss apply the retry policy
            }
          },
        );
      }
    },

    async stop(): Promise<void> {
      await boss.stop({ graceful: true });
    },

    async enqueue<P extends JobPayload>(request: JobRequest<P>): Promise<string | null> {
      await boss.createQueue(request.queue);
      const registration = registrations.get(request.queue);
      const envelope: JobEnvelope<P> = { payload: request.payload, meta: request.meta };
      return boss.send(request.queue, envelope, {
        retryLimit: registration?.retryLimit ?? DEFAULT_RETRY_LIMIT,
        retryDelay: registration?.retryDelaySeconds ?? DEFAULT_RETRY_DELAY_SECONDS,
        ...(request.startAfterSeconds === undefined
          ? {}
          : { startAfter: request.startAfterSeconds }),
      });
    },

    register<P extends JobPayload>(registration: JobRegistration<P>): void {
      registrations.set(registration.queue, registration as unknown as JobRegistration<JobPayload>);
    },
  };
}
