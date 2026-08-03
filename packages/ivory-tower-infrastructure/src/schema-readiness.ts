// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

import { Pool } from 'pg';

export const IVORY_RUNTIME_MIGRATION = '001_runtime_topology.sql';

export async function isIvoryRuntimeReady(pool: Pool): Promise<boolean> {
    const migration = await pool.query<{ present: boolean }>(
        'SELECT EXISTS (SELECT 1 FROM ivory_schema_migrations WHERE version = $1) AS present',
        [IVORY_RUNTIME_MIGRATION],
    );
    const queue = await pool.query<{ present: boolean }>(
        'SELECT to_regclass(\'graphile_worker.jobs\') IS NOT NULL AS present',
    );
    return migration.rows[0]?.present === true && queue.rows[0]?.present === true;
}

export async function assertIvoryRuntimeReady(pool: Pool): Promise<void> {
    if (!await isIvoryRuntimeReady(pool)) {
        throw new Error(`Ivory Tower schema is incompatible or not migrated (${IVORY_RUNTIME_MIGRATION}).`);
    }
}
