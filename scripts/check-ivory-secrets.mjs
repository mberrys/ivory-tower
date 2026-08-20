// @ts-check
'use strict';

/**
 * Sentinel secret scan over Ivory-owned source and configuration (IV-19).
 * Each pattern is self-tested against a synthetic, non-functional sample
 * before the real scan runs, so a broken pattern cannot silently pass CI.
 *
 * Run via: npm run secret:scan
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const SCAN_ROOTS = [
    'packages/ivory-tower-contracts/src',
    'packages/ivory-tower-domain/src',
    'packages/ivory-tower-content-policy/src',
    'packages/ivory-tower-adapters/src',
    'packages/ivory-tower-application/src',
    'packages/ivory-tower-infrastructure/src',
    'packages/ivory-tower-health/src',
    'packages/ivory-tower-api/src',
    'packages/ivory-tower-worker/src',
    'packages/ivory-identity/src',
    'configs',
    '.env.example',
];

const PATTERNS = [
    { name: 'aws-access-key-id', pattern: /AKIA[0-9A-Z]{16}/u, sample: 'AKIA0000000000000000' },
    {
        name: 'private-key-block',
        pattern: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |)PRIVATE KEY-----/u,
        sample: '-----BEGIN RSA PRIVATE KEY-----',
    },
    { name: 'anthropic-api-key', pattern: /sk-ant-[A-Za-z0-9_-]{20,}/u, sample: `sk-ant-${'x'.repeat(24)}` },
    { name: 'openai-style-api-key', pattern: /sk-[A-Za-z0-9]{20,}/u, sample: `sk-${'x'.repeat(24)}` },
    { name: 'slack-token', pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/u, sample: `xoxb-${'1'.repeat(12)}` },
    {
        name: 'inline-secret-assignment',
        pattern: /(?:SECRET|TOKEN|API_KEY)\s*=\s*['"][A-Za-z0-9_.-]{20,}['"]/u,
        sample: `API_KEY='${'a'.repeat(24)}'`,
    },
];

function selfTest() {
    const failures = [];
    for (const { name, pattern, sample } of PATTERNS) {
        if (!pattern.test(sample)) {
            failures.push(`Sentinel pattern "${name}" failed its own self-test sample; the secret-scan gate cannot be trusted.`);
        }
    }
    return failures;
}

function collectFiles(entryPath) {
    const stats = fs.statSync(entryPath);
    if (stats.isFile()) {
        return [entryPath];
    }
    const files = [];
    for (const entry of fs.readdirSync(entryPath, { withFileTypes: true })) {
        const fullPath = path.join(entryPath, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectFiles(fullPath));
        } else if (/\.(ts|tsx|mjs|js|json|example)$/u.test(entry.name) || entry.name === '.env.example') {
            files.push(fullPath);
        }
    }
    return files;
}

function scan() {
    const findings = [];
    for (const scanRoot of SCAN_ROOTS) {
        const fullRoot = path.join(ROOT, scanRoot);
        if (!fs.existsSync(fullRoot)) {
            continue;
        }
        for (const file of collectFiles(fullRoot)) {
            const content = fs.readFileSync(file, 'utf8');
            const lines = content.split('\n');
            for (const { name, pattern } of PATTERNS) {
                lines.forEach((line, index) => {
                    if (pattern.test(line)) {
                        findings.push(`${path.relative(ROOT, file)}:${index + 1} matched sentinel pattern "${name}".`);
                    }
                });
            }
        }
    }
    return findings;
}

function main() {
    const selfTestFailures = selfTest();
    if (selfTestFailures.length > 0) {
        console.error('Ivory Tower secret scan self-test failures:');
        for (const failure of selfTestFailures) {
            console.error(`  - ${failure}`);
        }
        process.exit(1);
    }

    const findings = scan();
    if (findings.length > 0) {
        console.error('Ivory Tower secret scan found sentinel-pattern matches (content redacted):');
        for (const finding of findings) {
            console.error(`  - ${finding}`);
        }
        process.exit(1);
    }
    console.log(`Ivory Tower secret scan: ${PATTERNS.length} sentinel patterns self-verified; no matches in scanned source/config.`);
}

main();
