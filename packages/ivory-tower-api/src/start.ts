// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

import { Pool } from 'pg';
import { ExecutionService } from '@ivory-tower/application';
import {
    ContentAwareAllowlistedEgressPolicy,
    ContentRightsAdmissionPolicy,
    FailClosedEgressPolicy,
    FilesystemObjectStore,
    PostgresExecutionStore,
    S3CompatibleObjectStore,
    SystemClockAdapter,
    SystemExecutionIdAdapter,
    isIvoryRuntimeReady,
    readDeploymentTopologyFromEnvironment,
    readEgressAllowedHostsFromEnvironment,
    readIvoryTowerEnvironment,
    validateIvoryTowerEnvironment,
} from '@ivory-tower/infrastructure';
import { createApiServer } from './api-server';

export async function startApi(): Promise<void> {
    const environment = readIvoryTowerEnvironment();
    validateIvoryTowerEnvironment(environment);
    const connectionString = process.env.DATABASE_URL;
    if (connectionString === undefined || connectionString.length === 0) {
        throw new Error('DATABASE_URL is required for ivory-api.');
    }
    const pool = new Pool({ connectionString });
    const clock = new SystemClockAdapter();
    const store = new PostgresExecutionStore(pool);
    const s3Bucket = process.env.IVORY_S3_BUCKET?.trim();
    const objectStore = s3Bucket === undefined || s3Bucket.length === 0
        ? new FilesystemObjectStore(process.env.IVORY_OBJECT_STORE_DIR ?? '.ivory-tower/objects')
        : new S3CompatibleObjectStore(s3Bucket, {
            endpoint: process.env.IVORY_S3_ENDPOINT,
            region: process.env.IVORY_S3_REGION,
            accessKeyId: process.env.IVORY_S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.IVORY_S3_SECRET_ACCESS_KEY,
            forcePathStyle: process.env.IVORY_S3_FORCE_PATH_STYLE !== 'false',
        });
    const allowedHosts = readEgressAllowedHostsFromEnvironment();
    const egress = allowedHosts.size > 0
        ? new ContentAwareAllowlistedEgressPolicy(allowedHosts, store)
        : new FailClosedEgressPolicy();
    const server = createApiServer({
        executionService: new ExecutionService(store, store, new SystemExecutionIdAdapter(), clock),
        executionStore: store,
        sourceRecords: store,
        objectStore,
        admission: new ContentRightsAdmissionPolicy(readDeploymentTopologyFromEnvironment()),
        egress,
        ids: new SystemExecutionIdAdapter(),
        clock,
        readiness: async () => {
            try {
                await pool.query('SELECT 1');
                return await isIvoryRuntimeReady(pool);
            } catch {
                return false;
            }
        },
    });
    const port = Number(process.env.PORT ?? 4100);
    await new Promise<void>((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '0.0.0.0', () => resolve());
    });
    const shutdown = async () => {
        await new Promise<void>(resolve => server.close(() => resolve()));
        await pool.end();
    };
    process.once('SIGTERM', () => { shutdown().catch(error => console.error(error)); });
    process.once('SIGINT', () => { shutdown().catch(error => console.error(error)); });
}

if (require.main === module) {
    startApi().catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}
