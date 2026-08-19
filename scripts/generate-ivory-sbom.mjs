// @ts-check
'use strict';

/**
 * Generates CycloneDX SBOMs for the Ivory Tower source tree and each deployable (IV-19 step 3).
 *
 * Uses npm's built-in generator rather than adding a scanner dependency. When `node_modules` is
 * absent the generator falls back to `--package-lock-only`; the mode is recorded in the manifest
 * so an SBOM produced without an install is never mistaken for one produced from a resolved tree.
 *
 * Release evidence is written outside the source authoring paths, into `artifacts/sbom/`.
 *
 * Flags:
 *   --out <dir>   write somewhere other than artifacts/sbom
 */

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.join(SCRIPT_DIR, '..');

const argv = process.argv.slice(2);
const outIndex = argv.indexOf('--out');
const outputDirectory = outIndex === -1
    ? path.join(REPO_ROOT, 'artifacts', 'sbom')
    : path.resolve(argv[outIndex + 1]);

const policy = JSON.parse(fs.readFileSync(path.join(REPO_ROOT, 'configs', 'ivory-dependency-policy.json'), 'utf8'));
const installed = fs.existsSync(path.join(REPO_ROOT, 'node_modules'));
const mode = installed ? 'resolved-tree' : 'package-lock-only';
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/** @param {string[]} args */
function runNpm(args) {
    return execFileSync(npmExecutable, args, {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
}

/** @param {string} value */
function digest(value) {
    return `sha256:${crypto.createHash('sha256').update(value).digest('hex')}`;
}

function currentCommit() {
    try {
        return execFileSync('git', ['-C', REPO_ROOT, 'rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
    } catch {
        return 'unknown';
    }
}

fs.mkdirSync(outputDirectory, { recursive: true });

const targets = [
    { label: 'source', file: 'sbom-source.cdx.json', args: [] },
    ...Object.entries(policy.deployables ?? {}).map(([label, deployable]) => ({
        label,
        file: `sbom-${label}.cdx.json`,
        args: ['-w', deployable.package],
    })),
];

/** @type {{ label: string, file: string, components: number, sha256: string }[]} */
const generated = [];

for (const target of targets) {
    const args = ['sbom', '--sbom-format', 'cyclonedx', '--omit', 'dev', ...target.args];
    if (!installed) {
        args.push('--package-lock-only');
    }
    const output = runNpm(args);
    const document = JSON.parse(output);
    const serialized = `${JSON.stringify(document, undefined, 2)}\n`;
    fs.writeFileSync(path.join(outputDirectory, target.file), serialized);
    generated.push({
        label: target.label,
        file: target.file,
        components: Array.isArray(document.components) ? document.components.length : 0,
        sha256: digest(serialized),
    });
    console.log(`  ${target.label.padEnd(14)} ${String(generated.at(-1)?.components).padStart(5)} components -> ${target.file}`);
}

const manifest = {
    generatedAt: new Date().toISOString(),
    commit: currentCommit(),
    mode,
    modeNote: installed
        ? 'Generated from an installed node_modules tree.'
        : 'Generated from package-lock.json without an install. Release evidence must be regenerated from an installed tree.',
    toolchain: { node: process.versions.node, npm: runNpm(['--version']).trim() },
    policyVersion: policy.policyVersion,
    format: 'CycloneDX 1.5',
    files: generated,
};
fs.writeFileSync(path.join(outputDirectory, 'sbom-manifest.json'), `${JSON.stringify(manifest, undefined, 2)}\n`);

console.log(`Ivory Tower SBOM: ${generated.length} documents in ${path.relative(REPO_ROOT, outputDirectory)} (${mode}, commit ${manifest.commit.slice(0, 8)}).`);
if (!installed) {
    console.log('Note: generated without an install. Regenerate from an installed tree before attaching to a release.');
}
