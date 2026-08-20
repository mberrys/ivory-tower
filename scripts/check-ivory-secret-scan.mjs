// @ts-check
'use strict';

/**
 * IV-19 sentinel secret scan: rejects committed secret-shaped values in
 * Ivory-owned source, config, infra, and docs. This is a mechanical sentinel,
 * not a substitute for a hosted secret-scanning service; it exists so a
 * committed credential fails the same local/CI gate as a license or
 * dependency violation.
 * Run via: npm run secret:scan:ivory-tower
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const SCAN_ROOTS = [
    'packages/ivory-tower-adapters',
    'packages/ivory-tower-api',
    'packages/ivory-tower-application',
    'packages/ivory-tower-content-policy',
    'packages/ivory-tower-contracts',
    'packages/ivory-tower-domain',
    'packages/ivory-tower-health',
    'packages/ivory-tower-infrastructure',
    'packages/ivory-tower-worker',
    'packages/ivory-identity',
    'examples/ivory-tower-browser',
    'configs',
    'infra',
    'docs',
];

const SCAN_EXTENSIONS = new Set(['.ts', '.tsx', '.mjs', '.js', '.json', '.yml', '.yaml', '.md', '.env.example']);
const EXCLUDED_DIRECTORY_NAMES = new Set(['node_modules', 'lib', 'build', 'src-gen', '.git']);

// [label, pattern, allowlistPattern?] — allowlistPattern exempts known-safe
// placeholders (e.g. .env.example's empty assignments, this file's own fixtures).
const SENTINEL_PATTERNS = [
    ['AWS access key ID', /AKIA[0-9A-Z]{16}/u],
    ['generic private key block', /-----BEGIN (?:RSA |EC |OPENSSH |DSA |)PRIVATE KEY-----/u],
    [
        'credential-shaped assignment',
        /\b(?:SECRET|PASSWORD|API[_-]?KEY|ACCESS[_-]?TOKEN|PRIVATE[_-]?KEY)\s*[:=]\s*['"][A-Za-z0-9+/=_-]{16,}['"]/iu,
    ],
    [
        'non-placeholder Postgres credential URL',
        /postgres(?:ql)?:\/\/[^:\s'"]+:(?!ivory\b|secret\b|password\b|changeme\b|test\b|development\b|ivory-development-only\b)[^@\s'"]{6,}@/u,
    ],
];

function collectScannableFiles(startDir) {
    const files = [];
    const entries = fs.existsSync(startDir) ? fs.readdirSync(startDir, { withFileTypes: true }) : [];
    for (const entry of entries) {
        if (EXCLUDED_DIRECTORY_NAMES.has(entry.name)) {
            continue;
        }
        const fullPath = path.join(startDir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectScannableFiles(fullPath));
        } else if (entry.name === '.env.example' || SCAN_EXTENSIONS.has(path.extname(entry.name))) {
            files.push(fullPath);
        }
    }
    return files;
}

function findHits(content) {
    const hits = [];
    for (const [label, pattern] of SENTINEL_PATTERNS) {
        if (pattern.test(content)) {
            hits.push(label);
        }
    }
    return hits;
}

// Self-test: prove each sentinel pattern actually matches its own adversarial
// fixture, in memory, without ever writing a real secret-shaped value to a
// tracked file (IV-19 verification: confirm the gate fails on a known case).
const SELF_TEST_FIXTURES = [
    ['AWS access key ID', 'const key = "AKIAABCDEFGHIJKLMNOP";'],
    ['generic private key block', '-----BEGIN RSA PRIVATE KEY-----\nMIIBOgIBAAJBAK...\n-----END RSA PRIVATE KEY-----'],
    ['credential-shaped assignment', 'API_KEY: "sk-adversarialFixtureValue123"'],
    ['non-placeholder Postgres credential URL', 'postgres://ivory:not-a-placeholder-secret@db.internal/ivory_tower'],
];

const violations = [];

for (const [label, fixture] of SELF_TEST_FIXTURES) {
    if (!findHits(fixture).includes(label)) {
        violations.push(`Self-test failed: sentinel "${label}" does not match its own adversarial fixture.`);
    }
}

let scannedCount = 0;
for (const scanRoot of SCAN_ROOTS) {
    for (const file of collectScannableFiles(path.join(root, scanRoot))) {
        scannedCount += 1;
        const content = fs.readFileSync(file, 'utf8');
        const hits = findHits(content);
        for (const label of hits) {
            violations.push(`${path.relative(root, file)} matches sentinel pattern "${label}".`);
        }
    }
}

if (violations.length > 0) {
    console.error('Ivory Tower secret scan violations:');
    for (const violation of violations) {
        console.error(`  - ${violation}`);
    }
    process.exit(1);
}
console.log(`Ivory Tower secret scan: ${scannedCount} files checked across ${SCAN_ROOTS.length} roots; self-test fixtures matched; no sentinel secrets found.`);
