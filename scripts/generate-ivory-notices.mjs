// @ts-check
'use strict';

/**
 * Generates a deterministic third-party notices artifact for the Ivory
 * Tower source tree, plus the currently recorded dependency-policy
 * exceptions (IV-19).
 *
 * Usage: node scripts/generate-ivory-notices.mjs [--out-dir artifacts]
 */

import fs from 'node:fs';
import path from 'node:path';
import { ROOT, IVORY_SOURCE_WORKSPACES, resolveDependencyClosure } from './shared/ivory-dependency-graph.mjs';

function outDirFromArgs(argv) {
    const flagIndex = argv.indexOf('--out-dir');
    if (flagIndex === -1) {
        return path.join(ROOT, 'artifacts');
    }
    const value = argv[flagIndex + 1];
    if (value === undefined) {
        throw new Error('--out-dir requires a path argument.');
    }
    return path.isAbsolute(value) ? value : path.join(ROOT, value);
}

function formatExceptions() {
    const policy = JSON.parse(fs.readFileSync(path.join(ROOT, 'configs', 'ivory-dependency-policy.json'), 'utf8'));
    if (policy.advisoryExceptions.length === 0) {
        return 'None currently recorded.';
    }
    return policy.advisoryExceptions
        .map(exception => `- ${exception.package}: ${exception.advisory} — ${exception.reason} (owner: ${exception.owner}, expires: ${exception.expires})`)
        .join('\n');
}

function main() {
    const outDir = outDirFromArgs(process.argv.slice(2));
    const closure = resolveDependencyClosure(IVORY_SOURCE_WORKSPACES);
    const dependencies = [...closure.values()].sort((a, b) => (a.name === b.name ? a.version.localeCompare(b.version) : a.name.localeCompare(b.name)));

    const lines = [
        '# Ivory Tower — third-party notices',
        '',
        `Generated ${new Date().toISOString()} from the resolved package-lock.json dependency graph of:`,
        ...IVORY_SOURCE_WORKSPACES.map(workspace => `  - ${workspace}`),
        '',
        `${dependencies.length} third-party packages.`,
        '',
        '## Recorded dependency-policy exceptions',
        '',
        formatExceptions(),
        '',
        '## Packages',
        '',
        ...dependencies.map(dependency => `- ${dependency.name}@${dependency.version} — ${dependency.license}${dependency.resolved ? ` — ${dependency.resolved}` : ''}`),
        '',
    ];

    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, 'ivory-third-party-notices.txt');
    fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
    console.log(`Ivory Tower third-party notices written: ${path.relative(ROOT, outPath)}`);
}

main();
