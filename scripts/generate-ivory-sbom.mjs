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
// npm writes .package-lock.json on install; a bare (or cache-only) node_modules directory is
// not an installed tree, and treating it as one makes npm report every package as missing.
const installed = fs.existsSync(path.join(REPO_ROOT, 'node_modules', '.package-lock.json'));
const mode = installed ? 'resolved-tree' : 'package-lock-only';
const npmExecutable = process.platform === 'win32' ? 'npm.cmd' : 'npm';

/** Invalid dependency edges reported by npm while generating, recorded in the manifest. */
/** @type {string[]} */
const sbomProblems = [];

/** @param {string[]} args */
function runNpm(args) {
    return execFileSync(npmExecutable, args, {
        cwd: REPO_ROOT,
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
        stdio: ['ignore', 'pipe', 'pipe'],
    });
}

/**
 * `npm sbom` refuses to emit a document when the installed tree contains an invalid dependency
 * edge (ESBOMPROBLEMS) — for example a root `overrides` entry that violates a package's declared
 * range. That is a real defect in the tree, but it is not this generator's to fix, and silently
 * producing nothing would be worse than producing an SBOM with the defect recorded.
 *
 * So: attempt the resolved tree, and on ESBOMPROBLEMS fall back to the lockfile while recording
 * the exact npm diagnostic in the manifest and warning loudly. A degraded SBOM is never
 * indistinguishable from a clean one.
 *
 * @param {string[]} baseArgs
 * @returns {{ document: unknown, degraded?: string }}
 */
function generateDocument(baseArgs) {
    if (installed) {
        try {
            return { document: JSON.parse(runNpm(baseArgs)) };
        } catch (error) {
            const diagnostic = `${error.stdout ?? ''}${error.stderr ?? ''}`.trim();
            if (!diagnostic.includes('ESBOMPROBLEMS')) {
                throw error;
            }
            const problems = diagnostic
                .split('\n')
                .filter(line => line.includes('npm error') && !line.includes('ESBOMPROBLEMS') && !line.includes('debug-0.log'))
                .map(line => line.replace(/^npm error\s*/u, '').trim())
                .filter(Boolean);
            // `missing:` only means the tree is not fully installed. `invalid:` means an edge in
            // the tree violates a declared range — that is the defect worth recording.
            const invalid = problems.filter(problem => problem.startsWith('invalid:'));
            sbomProblems.push(...invalid);
            return {
                document: JSON.parse(runNpm([...baseArgs, '--package-lock-only'])),
                degraded: invalid.length > 0 ? invalid.join('; ') : undefined,
            };
        }
    }
    return { document: JSON.parse(runNpm([...baseArgs, '--package-lock-only'])) };
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

let degradedAny = false;
for (const target of targets) {
    const { document, degraded } = generateDocument(['sbom', '--sbom-format', 'cyclonedx', '--omit', 'dev', ...target.args]);
    degradedAny = degradedAny || degraded !== undefined;
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

const effectiveMode = degradedAny ? 'package-lock-only-degraded' : mode;
const manifest = {
    generatedAt: new Date().toISOString(),
    commit: currentCommit(),
    mode: effectiveMode,
    modeNote: degradedAny
        ? 'An installed tree was present, but npm refused to generate from it because the tree contains an invalid dependency edge (see dependencyTreeProblems). Generated from package-lock.json instead. This SBOM reflects the lockfile, not the resolved tree.'
        : installed
            ? 'Generated from an installed node_modules tree.'
            : 'Generated from package-lock.json without an install. Release evidence must be regenerated from an installed tree.',
    dependencyTreeProblems: [...new Set(sbomProblems)],
    toolchain: { node: process.versions.node, npm: runNpm(['--version']).trim() },
    policyVersion: policy.policyVersion,
    format: 'CycloneDX 1.5',
    files: generated,
};
fs.writeFileSync(path.join(outputDirectory, 'sbom-manifest.json'), `${JSON.stringify(manifest, undefined, 2)}\n`);

console.log(`Ivory Tower SBOM: ${generated.length} documents in ${path.relative(REPO_ROOT, outputDirectory)} (${effectiveMode}, commit ${manifest.commit.slice(0, 8)}).`);
if (!installed) {
    console.log('Note: generated without an install. Regenerate from an installed tree before attaching to a release.');
}
if (degradedAny) {
    console.warn('');
    console.warn('WARNING: the installed dependency tree contains an invalid edge, so npm would not');
    console.warn('generate an SBOM from it. These SBOMs describe package-lock.json instead:');
    for (const problem of new Set(sbomProblems)) {
        console.warn(`  - ${problem}`);
    }
    console.warn('This is a defect in the dependency tree, not in the SBOM tooling. Resolving it is a');
    console.warn('dependency-resolution decision (see the root "overrides" block); it is recorded in');
    console.warn('artifacts/sbom/sbom-manifest.json under dependencyTreeProblems until then.');
}
