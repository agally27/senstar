/**
 * The platform's single background-job mechanism (ADR-0006).
 *
 * pg-boss is an implementation detail behind this interface. Modules import
 * `JobQueue` and never `pg-boss` (lint-enforced), so the engine can be
 * replaced by a superseding ADR without touching call sites.
 *
 * Payload rule (SECURITY_AND_PRIVACY.md): job payloads carry *references*
 * (ids), never child personal data bodies. Enforced by the JobPayload type —
 * a payload of ids and primitives is all the type system permits.
 */
import type { Logger } from '@senstar/observability';

/**
 * Permitted payload shape: flat-ish records of identifiers and primitives.
 * Deliberately narrow — if a job "needs" a child's name in its payload, the
 * job should fetch it from the database under an authorisation check instead.
 */
export type JobPayloadValue = string | number | boolean | null;
export interface JobPayload {
  readonly [key: string]: JobPayloadValue | readonly JobPayloadValue[];
}

/** Correlation is mandatory: a job's logs must join up with the request that caused it. */
export interface JobMeta {
  readonly correlationId: string;
  readonly organisationId?: string;
}

export interface JobRequest<P extends JobPayload = JobPayload> {
  readonly queue: string;
  readonly payload: P;
  readonly meta: JobMeta;
  /** Delay before the job becomes eligible to run. */
  readonly startAfterSeconds?: number;
}

export interface JobHandlerContext {
  readonly meta: JobMeta;
  readonly logger: Logger;
}

export type JobHandler<P extends JobPayload = JobPayload> = (
  payload: P,
  context: JobHandlerContext,
) => Promise<void>;

export interface JobRegistration<P extends JobPayload = JobPayload> {
  readonly queue: string;
  readonly handler: JobHandler<P>;
  /** Retry budget before the job is dead-lettered. */
  readonly retryLimit?: number;
  readonly retryDelaySeconds?: number;
}

/**
 * The contract every module uses. Implemented by the pg-boss adapter in
 * production and by an in-memory fake in tests.
 */
export interface JobQueue {
  start(): Promise<void>;
  stop(): Promise<void>;
  /** Enqueue work. Returns the job id, or null if the engine deduplicated it. */
  enqueue<P extends JobPayload>(request: JobRequest<P>): Promise<string | null>;
  /** Register a handler. Must be called before start() for workers. */
  register<P extends JobPayload>(registration: JobRegistration<P>): void;
}

/** Envelope actually persisted: payload plus correlation metadata. */
export interface JobEnvelope<P extends JobPayload = JobPayload> {
  readonly payload: P;
  readonly meta: JobMeta;
}
