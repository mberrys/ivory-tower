// @ts-check
'use strict';

// Shared npm-workspace dependency resolution for Ivory Tower SBOM and notices
// generation (IV-19). Walks package-lock.json (lockfileVersion 3) the same
// way Node module resolution would, starting from a workspace's own
// production `dependencies` and following the resolved graph transitively.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

/** @typedef {{ name: string, version: string, license: string, resolved?: string }} ResolvedDependency */

export function loadLockfile(root = ROOT) {
    return JSON.parse(fs.readFileSync(path.join(root, 'package-lock.json'), 'utf8'));
}

/**
 * Resolves the installed package entry for `name` as seen from `consumerPath`
 * (a key into lockfile.packages, e.g. "packages/ivory-tower-api"), walking up
 * through nested node_modules the way Node's resolver would.
 */
function resolveInstalledEntry(lockfile, consumerPath, name) {
    const segments = consumerPath.length === 0 ? [] : consumerPath.split('/');
    for (let depth = segments.length; depth >= 0; depth -= 1) {
        const base = segments.slice(0, depth).join('/');
        const candidate = base.length === 0 ? `node_modules/${name}` : `${base}/node_modules/${name}`;
        const entry = lockfile.packages[candidate];
        if (entry !== undefined) {
            return { path: candidate, entry };
        }
    }
    return undefined;
}

/**
 * Returns the transitive production dependency closure for one or more
 * workspace root paths (keys into lockfile.packages), as a Map keyed by
 * `${name}@${version}` so distinct resolved versions of the same package are
 * both retained.
 *
 * @param {string[]} workspacePaths
 * @returns {Map<string, ResolvedDependency>}
 */
export function resolveDependencyClosure(workspacePaths, root = ROOT) {
    const lockfile = loadLockfile(root);
    /** @type {Map<string, ResolvedDependency>} */
    const closure = new Map();
    /** @type {Set<string>} */
    const visitedInstallPaths = new Set();

    const queue = [];
    for (const workspacePath of workspacePaths) {
        const workspace = lockfile.packages[workspacePath];
        if (workspace === undefined) {
            throw new Error(`Unknown workspace in package-lock.json: ${workspacePath}`);
        }
        for (const name of Object.keys(workspace.dependencies ?? {})) {
            queue.push({ consumerPath: workspacePath, name });
        }
    }

    while (queue.length > 0) {
        const { consumerPath, name } = queue.shift();
        const resolved = resolveInstalledEntry(lockfile, consumerPath, name);
        if (resolved === undefined) {
            continue;
        }

        if (resolved.entry.link === true) {
            // An Ivory-owned workspace dependency (e.g. @ivory-tower/domain):
            // not third-party, but its own dependencies must still be walked.
            const workspacePath = resolved.entry.resolved;
            if (visitedInstallPaths.has(workspacePath)) {
                continue;
            }
            visitedInstallPaths.add(workspacePath);
            const workspaceEntry = lockfile.packages[workspacePath];
            for (const dependencyName of Object.keys(workspaceEntry?.dependencies ?? {})) {
                queue.push({ consumerPath: workspacePath, name: dependencyName });
            }
            continue;
        }

        if (visitedInstallPaths.has(resolved.path)) {
            continue;
        }
        visitedInstallPaths.add(resolved.path);

        const version = resolved.entry.version ?? 'unknown';
        closure.set(`${name}@${version}`, {
            name,
            version,
            license: resolved.entry.license ?? 'UNKNOWN',
            resolved: resolved.entry.resolved,
        });

        for (const dependencyName of Object.keys(resolved.entry.dependencies ?? {})) {
            queue.push({ consumerPath: resolved.path, name: dependencyName });
        }
    }

    return closure;
}

export const IVORY_SOURCE_WORKSPACES = [
    'packages/ivory-tower-contracts',
    'packages/ivory-tower-domain',
    'packages/ivory-tower-content-policy',
    'packages/ivory-tower-adapters',
    'packages/ivory-tower-application',
    'packages/ivory-tower-infrastructure',
    'packages/ivory-tower-health',
    'packages/ivory-tower-api',
    'packages/ivory-tower-worker',
    'packages/ivory-identity',
];

export const IVORY_DEPLOYABLE_WORKSPACES = {
    api: ['packages/ivory-tower-api', 'packages/ivory-tower-adapters', 'packages/ivory-tower-application',
        'packages/ivory-tower-contracts', 'packages/ivory-tower-domain', 'packages/ivory-tower-infrastructure',
        'packages/ivory-tower-content-policy'],
    worker: ['packages/ivory-tower-worker', 'packages/ivory-tower-adapters', 'packages/ivory-tower-contracts',
        'packages/ivory-tower-domain', 'packages/ivory-tower-infrastructure', 'packages/ivory-tower-content-policy'],
};
