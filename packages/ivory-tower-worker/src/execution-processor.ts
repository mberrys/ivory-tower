// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

import { randomUUID } from 'node:crypto';
import { ExecutionJob, ExecutionStorePort } from '@ivory-tower/adapters';
import { ExecutionFailure } from '@ivory-tower/domain';

export interface ExecutionHandlerContext {
    readonly signal: AbortSignal;
    reportProgress(progress: number, payload?: unknown): Promise<void>;
}

export type ExecutionHandler = (job: ExecutionJob, context: ExecutionHandlerContext) => Promise<unknown>;

export type ExecutionHandlerRegistry = ReadonlyMap<ExecutionJob['kind'], ExecutionHandler>;

export class ExecutionProcessor {
    constructor(
        private readonly store: ExecutionStorePort,
        private readonly handlers: ExecutionHandlerRegistry,
        private readonly leaseDurationMs = 60_000,
    ) {}

    async process(job: ExecutionJob, signal: AbortSignal): Promise<void> {
        const leaseToken = randomUUID();
        const leaseUntil = new Date(Date.now() + this.leaseDurationMs).toISOString();
        if (!await this.store.markRunning(job.executionId, leaseToken, leaseUntil)) {
            return;
        }
        if (signal.aborted) {
            await this.store.cancelRunning(job.executionId, leaseToken);
            return;
        }
        const handler = this.handlers.get(job.kind);
        if (handler === undefined) {
            await this.store.fail(job.executionId, leaseToken, {
                code: 'handler_unavailable',
                message: `No handler is registered for ${job.kind}.`,
                retryable: false,
            });
            return;
        }
        try {
            const result = await handler(job, {
                signal,
                reportProgress: async (progress, payload) => {
                    if (!await this.store.updateProgress(job.executionId, leaseToken, progress, payload)) {
                        throw new Error('Execution lease was lost while reporting progress.');
                    }
                },
            });
            if (signal.aborted) {
                await this.store.cancelRunning(job.executionId, leaseToken);
                return;
            }
            await this.store.complete(job.executionId, leaseToken, result);
        } catch (error) {
            const failure = classifyFailure(error);
            if (failure.retryable) {
                await this.store.retry(job.executionId, leaseToken, failure);
                throw error;
            }
            await this.store.fail(job.executionId, leaseToken, failure);
        }
    }
}

function classifyFailure(error: unknown): ExecutionFailure {
    if (error instanceof Error) {
        const retryable = 'retryable' in error && typeof error.retryable === 'boolean' ? error.retryable : true;
        return { code: 'worker_failure', message: error.message, retryable };
    }
    return { code: 'worker_failure', message: 'Worker failed with an unknown error.', retryable: true };
}
