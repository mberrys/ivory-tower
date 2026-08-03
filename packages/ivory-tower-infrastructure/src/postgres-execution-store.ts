// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

import { Pool, PoolClient } from 'pg';
import {
    ExecutionEvent,
    ExecutionFailure,
    ExecutionRecord,
    ExecutionStatus,
    assertExecutionTransition,
} from '@ivory-tower/domain';
import { ExecutionJob, ExecutionStorePort, ExecutionTransactionPort, SourceRecord, SourceRecordPort } from '@ivory-tower/adapters';

interface ExecutionRow {
    id: string;
    kind: ExecutionRecord['kind'];
    status: ExecutionStatus;
    contract_version: number;
    idempotency_key: string;
    attempt: number;
    lease_token: string | null;
    lease_until: Date | null;
    progress: number;
    created_at: Date;
    updated_at: Date;
    result: unknown;
    failure: ExecutionFailure | null;
}

interface EventRow {
    id: string;
    execution_id: string;
    sequence: number;
    type: ExecutionEvent['type'];
    payload: unknown;
    occurred_at: Date;
}

function toRecord(row: ExecutionRow): ExecutionRecord {
    return {
        id: row.id,
        kind: row.kind,
        status: row.status,
        contractVersion: row.contract_version,
        idempotencyKey: row.idempotency_key,
        attempt: row.attempt,
        leaseToken: row.lease_token ?? undefined,
        leaseUntil: row.lease_until?.toISOString(),
        progress: Number(row.progress),
        createdAt: row.created_at.toISOString(),
        updatedAt: row.updated_at.toISOString(),
        result: row.result ?? undefined,
        failure: row.failure ?? undefined,
    };
}

function toEvent(row: EventRow): ExecutionEvent {
    return {
        id: row.id,
        executionId: row.execution_id,
        sequence: Number(row.sequence),
        type: row.type,
        payload: row.payload,
        occurredAt: row.occurred_at.toISOString(),
    };
}

export class PostgresExecutionStore implements ExecutionStorePort, ExecutionTransactionPort, SourceRecordPort {
    constructor(private readonly pool: Pool) {}

    async createAndEnqueue(record: ExecutionRecord, job: ExecutionJob): Promise<ExecutionRecord> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            await client.query(
                `INSERT INTO ivory_executions (id, kind, status, contract_version, idempotency_key, attempt, progress, created_at, updated_at, result, failure)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9, $10)`,
                [record.id, record.kind, record.status, record.contractVersion, record.idempotencyKey, record.attempt, record.progress, record.createdAt, undefined, undefined],
            );
            await this.appendEventWithClient(client, record.id, 'status', { status: record.status });
            await client.query(
                'SELECT graphile_worker.add_job($1, $2::json, job_key := $3, max_attempts := $4)',
                ['ivory-execution', JSON.stringify(job), job.jobKey, 25],
            );
            await client.query('COMMIT');
            return record;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async findByIdempotencyKey(idempotencyKey: string): Promise<ExecutionRecord | undefined> {
        const result = await this.pool.query<ExecutionRow>('SELECT * FROM ivory_executions WHERE idempotency_key = $1', [idempotencyKey]);
        return result.rows[0] === undefined ? undefined : toRecord(result.rows[0]);
    }

    async persistSource(record: SourceRecord): Promise<void> {
        await this.pool.query(
            `INSERT INTO ivory_sources (id, content_hash, object_key, content_type, license, authorization_evidence, admission_policy_version, admitted_at)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             ON CONFLICT (content_hash) DO NOTHING`,
            [record.id, record.contentHash, record.objectKey, record.contentType, record.license, record.authorizationEvidence, record.admissionPolicyVersion, record.admittedAt],
        );
    }

    async get(executionId: string): Promise<ExecutionRecord | undefined> {
        const result = await this.pool.query<ExecutionRow>('SELECT * FROM ivory_executions WHERE id = $1', [executionId]);
        return result.rows[0] === undefined ? undefined : toRecord(result.rows[0]);
    }

    async listEvents(executionId: string, afterSequence = 0): Promise<readonly ExecutionEvent[]> {
        const result = await this.pool.query<EventRow>(
            'SELECT * FROM ivory_execution_events WHERE execution_id = $1 AND sequence > $2 ORDER BY sequence ASC',
            [executionId, afterSequence],
        );
        return result.rows.map(toEvent);
    }

    async appendEvent(executionId: string, type: ExecutionEvent['type'], payload: unknown): Promise<ExecutionEvent> {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const event = await this.appendEventWithClient(client, executionId, type, payload);
            await client.query('COMMIT');
            return event;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    }

    async markRunning(executionId: string, leaseToken: string, leaseUntil: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE ivory_executions
             SET status = 'running', lease_token = $2, lease_until = $3, attempt = attempt + 1, updated_at = NOW()
             WHERE id = $1 AND status = 'queued'
             RETURNING id`,
            [executionId, leaseToken, leaseUntil],
        );
        if (result.rowCount !== 1) {
            return false;
        }
        await this.appendEvent(executionId, 'status', { status: 'running' });
        return true;
    }

    async updateProgress(executionId: string, leaseToken: string, progress: number, payload?: unknown): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE ivory_executions SET progress = $3, updated_at = NOW()
             WHERE id = $1 AND lease_token = $2 AND status = 'running'`,
            [executionId, leaseToken, Math.min(1, Math.max(0, progress))],
        );
        if (result.rowCount !== 1) {
            return false;
        }
        await this.appendEvent(executionId, 'progress', payload ?? { progress });
        return true;
    }

    complete(executionId: string, leaseToken: string, result: unknown): Promise<boolean> {
        return this.finish(executionId, leaseToken, 'succeeded', result);
    }

    fail(executionId: string, leaseToken: string, failure: ExecutionFailure): Promise<boolean> {
        return this.finish(executionId, leaseToken, 'failed', undefined, failure);
    }

    async retry(executionId: string, leaseToken: string, failure: ExecutionFailure): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE ivory_executions SET status = 'queued', failure = $3, lease_token = NULL, lease_until = NULL, updated_at = NOW()
             WHERE id = $1 AND lease_token = $2 AND status = 'running'`,
            [executionId, leaseToken, JSON.stringify(failure)],
        );
        if (result.rowCount !== 1) {
            return false;
        }
        await this.appendEvent(executionId, 'error', failure);
        await this.appendEvent(executionId, 'status', { status: 'queued' });
        return true;
    }

    async cancelRunning(executionId: string, leaseToken: string): Promise<boolean> {
        const result = await this.pool.query(
            `UPDATE ivory_executions SET status = 'cancelled', lease_token = NULL, lease_until = NULL, updated_at = NOW()
             WHERE id = $1 AND lease_token = $2 AND status IN ('running', 'cancelling')`,
            [executionId, leaseToken],
        );
        if (result.rowCount !== 1) {
            return false;
        }
        await this.appendEvent(executionId, 'status', { status: 'cancelled' });
        return true;
    }

    async cancel(executionId: string): Promise<ExecutionRecord | undefined> {
        const current = await this.get(executionId);
        if (current === undefined || ['succeeded', 'failed', 'cancelled'].includes(current.status)) {
            return current;
        }
        const next: ExecutionStatus = current.status === 'queued' ? 'cancelled' : 'cancelling';
        assertExecutionTransition(current.status, next);
        await this.pool.query('UPDATE ivory_executions SET status = $2, updated_at = NOW() WHERE id = $1', [executionId, next]);
        await this.appendEvent(executionId, 'status', { status: next });
        return this.get(executionId);
    }

    private async finish(executionId: string, leaseToken: string, status: 'succeeded' | 'failed', result: unknown, failure?: ExecutionFailure): Promise<boolean> {
        const updated = await this.pool.query(
            `UPDATE ivory_executions SET status = $3, result = $4, failure = $5, progress = CASE WHEN $3 = 'succeeded' THEN 1 ELSE progress END,
             lease_token = NULL, lease_until = NULL, updated_at = NOW()
             WHERE id = $1 AND lease_token = $2 AND status = 'running'`,
            [executionId, leaseToken, status, result === undefined ? undefined : JSON.stringify(result), failure === undefined ? undefined : JSON.stringify(failure)],
        );
        if (updated.rowCount !== 1) {
            return false;
        }
        await this.appendEvent(executionId, status === 'succeeded' ? 'complete' : 'error', status === 'succeeded' ? { result } : failure);
        return true;
    }

    private async appendEventWithClient(client: PoolClient, executionId: string, type: ExecutionEvent['type'], payload: unknown): Promise<ExecutionEvent> {
        const sequence = await client.query<{ next_event_sequence: number }>(
            'UPDATE ivory_executions SET next_event_sequence = next_event_sequence + 1, updated_at = NOW() WHERE id = $1 RETURNING next_event_sequence',
            [executionId],
        );
        if (sequence.rows[0] === undefined) {
            throw new Error(`Execution not found: ${executionId}`);
        }
        const sequenceNumber = Number(sequence.rows[0].next_event_sequence);
        const eventId = `${executionId}:${sequenceNumber}`;
        const result = await client.query<EventRow>(
            `INSERT INTO ivory_execution_events (id, execution_id, sequence, type, payload, occurred_at)
             VALUES ($1, $2, $3, $4, $5, NOW()) RETURNING *`,
            [eventId, executionId, sequenceNumber, type, JSON.stringify(payload)],
        );
        return toEvent(result.rows[0]);
    }
}
