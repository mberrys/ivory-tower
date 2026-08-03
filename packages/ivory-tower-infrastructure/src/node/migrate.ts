// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

import { readdir, readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { Pool } from 'pg';
import { runMigrations as runGraphileMigrations } from 'graphile-worker';

const packageRoot = join(dirname(__dirname), '..');

export async function runIvoryMigrations(connectionString: string, migrationsDirectory = join(packageRoot, 'migrations')): Promise<void> {
    const pool = new Pool({ connectionString });
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        await client.query('SELECT pg_advisory_xact_lock(hashtext(\'ivory-tower-schema\'))');
        await client.query('CREATE TABLE IF NOT EXISTS ivory_schema_migrations (version TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())');
        const applied = new Set((await client.query<{ version: string }>('SELECT version FROM ivory_schema_migrations')).rows.map(row => row.version));
        const migrations = (await readdir(migrationsDirectory)).filter(file => file.endsWith('.sql')).sort();
        for (const migration of migrations) {
            if (applied.has(migration)) {
                continue;
            }
            await client.query(await readFile(join(migrationsDirectory, migration), 'utf8'));
            await client.query('INSERT INTO ivory_schema_migrations (version) VALUES ($1)', [migration]);
        }
        await client.query('COMMIT');
    } catch (error) {
        await client.query('ROLLBACK');
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
    await runGraphileMigrations({ connectionString, schema: 'graphile_worker', taskList: {} });
}

if (process.argv[1] && process.argv[1].endsWith('migrate.js')) {
    const connectionString = process.env.DATABASE_URL;
    if (connectionString === undefined || connectionString.length === 0) {
        throw new Error('DATABASE_URL is required for ivory-migrate.');
    }
    runIvoryMigrations(connectionString).catch(error => {
        console.error(error);
        process.exitCode = 1;
    });
}
