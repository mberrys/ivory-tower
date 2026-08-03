// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

import { expect } from 'chai';
import { ExecutionService } from '@ivory-tower/application';
import { CONTRACT_VERSION } from '@ivory-tower/contracts';
import { InMemoryExecutionStore, SystemClockAdapter, SystemExecutionIdAdapter } from '@ivory-tower/infrastructure';
import { createApiServer } from './api-server';

describe('@ivory-tower/api package', () => {
    it('serves versioned idempotent execution commands and replayable events', async () => {
        const store = new InMemoryExecutionStore();
        const server = createApiServer({
            executionService: new ExecutionService(store, store, new SystemExecutionIdAdapter(), new SystemClockAdapter()),
            executionStore: store,
        });
        expect(server).to.be.an('object');
        expect(CONTRACT_VERSION).to.equal(1);
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
        const address = server.address();
        if (!(address instanceof Object) || typeof address === 'string') {
            throw new Error('Test server did not expose a TCP address.');
        }
        const baseUrl = `http://127.0.0.1:${address.port}`;
        const create = await fetch(`${baseUrl}/v1/executions`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'idempotency-key': 'api-test-1' },
            body: JSON.stringify({ kind: 'convert', input: { sourceId: 'source-1' } }),
        });
        expect(create.status).to.equal(202);
        const execution = await create.json() as { id: string };
        const replay = await fetch(`${baseUrl}/v1/executions`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'idempotency-key': 'api-test-1' },
            body: JSON.stringify({ kind: 'convert', input: { sourceId: 'source-1' } }),
        });
        expect(replay.status).to.equal(200);
        const invalid = await fetch(`${baseUrl}/v1/executions`, {
            method: 'POST',
            headers: { 'content-type': 'application/json', 'idempotency-key': 'api-test-2' },
            body: JSON.stringify({ kind: 'unknown', input: {} }),
        });
        expect(invalid.status).to.equal(400);
        const cancelled = await fetch(`${baseUrl}/v1/executions/${execution.id}`, { method: 'DELETE' });
        expect(cancelled.status).to.equal(202);
        const events = await fetch(`${baseUrl}/v1/executions/${execution.id}/events`).then(response => response.text());
        expect(events).to.contain('event: status');
        await new Promise<void>(resolve => server.close(() => resolve()));
    });

    it('returns the canonical source record when persistence deduplicates content', async () => {
        const store = new InMemoryExecutionStore();
        const admittedAt = '2026-08-02T12:00:00.000Z';
        const server = createApiServer({
            executionService: new ExecutionService(store, store, new SystemExecutionIdAdapter(), new SystemClockAdapter()),
            executionStore: store,
            objectStore: {
                putImmutable: async key => ({ key, etag: 'etag' }),
                get: async () => new Uint8Array(),
            },
            sourceRecords: {
                persistSource: async record => ({
                    ...record,
                    id: 'canonical-source',
                    objectKey: 'sources/canonical',
                    admittedAt,
                }),
            },
            admission: { admit: async () => ({ allowed: true, reason: 'approved' }) },
            ids: { next: () => 'requested-source' },
            clock: { now: () => new Date(admittedAt) },
        });
        await new Promise<void>(resolve => server.listen(0, '127.0.0.1', () => resolve()));
        const address = server.address();
        if (!(address instanceof Object) || typeof address === 'string') {
            throw new Error('Test server did not expose a TCP address.');
        }

        try {
            const response = await fetch(`http://127.0.0.1:${address.port}/v1/sources`, {
                method: 'POST',
                headers: {
                    'content-type': 'application/octet-stream',
                    'x-source-filename': 'paper.pdf',
                    'x-source-content-type': 'application/pdf',
                    'x-source-license': 'CC-BY-4.0',
                    'x-source-authorization-evidence': 'open license',
                },
                body: 'source bytes',
            });
            expect(response.status).to.equal(201);
            expect(await response.json()).to.deep.equal({
                sourceId: 'canonical-source',
                contentHash: '4d4823794cbed3c4ee0bbc684c8f66e1dfd5afa6f078d494ce254ec5a4671753',
                objectKey: 'sources/canonical',
                admittedAt,
            });
        } finally {
            await new Promise<void>(resolve => server.close(() => resolve()));
        }
    });
});
