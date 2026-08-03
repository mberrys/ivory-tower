// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

import { Pool } from 'pg';
import { ExecutionHandlerRegistry, ExecutionProcessor } from './execution-processor';
import { PostgresExecutionStore, assertIvoryRuntimeReady, flushIvorySentry, initIvorySentry, readIvoryTowerEnvironment, readSentryConfigFromEnvironment, startGraphileWorker, validateIvoryTowerEnvironment } from '@ivory-tower/infrastructure';

export async function startWorker(handlers: ExecutionHandlerRegistry = new Map()): Promise<void> {
    const environment = readIvoryTowerEnvironment();
    validateIvoryTowerEnvironment(environment);
    initIvorySentry(readSentryConfigFromEnvironment('ivory-worker'));
    const connectionString = process.env.DATABASE_URL;
    if (connectionString === undefined || connectionString.length === 0) {
        throw new Error('DATABASE_URL is required for ivory-worker.');
    }
    const pool = new Pool({ connectionString });
    await assertIvoryRuntimeReady(pool);
    const store = new PostgresExecutionStore(pool);
    const runner = await startGraphileWorker(connectionString, new ExecutionProcessor(store, handlers));
    const shutdown = async () => {
        await runner.stop();
        await pool.end();
        await flushIvorySentry();
    };
    process.once('SIGTERM', () => { shutdown().catch(error => console.error(error)); });
    process.once('SIGINT', () => { shutdown().catch(error => console.error(error)); });
}

if (require.main === module) {
    startWorker().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}
