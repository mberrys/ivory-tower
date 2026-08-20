// @ts-check
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'configs', 'ivory-dependency-policy.json'), 'utf8'));

/**
 * Pure policy evaluation over one package manifest, independent of the
 * filesystem, so it can be exercised against real Ivory Tower manifests and
 * against synthetic adversarial fixtures with the same logic (IV-19
 * verification: "inject a known policy-violating test dependency ... and
 * confirm the gate fails").
 *
 * @param {{ license?: string, dependencies?: Record<string, string>, devDependencies?: Record<string, string>, peerDependencies?: Record<string, string> }} manifest
 * @param {string} label
 */
export function evaluateManifest(manifest, label) {
    const violations = [];
    if (!policy.allowedLicenseExpressions.includes(manifest.license)) {
        violations.push(`${label} uses unapproved license expression ${manifest.license}.`);
    }
    const dependencies = { ...manifest.dependencies, ...manifest.devDependencies, ...manifest.peerDependencies };
    for (const [name, version] of Object.entries(dependencies)) {
        const allowed = policy.allowedDependencyPrefixes.some(prefix => name.startsWith(prefix))
            || policy.approvedNetworkDependencies.includes(name)
            || ['tslib', 'zod'].includes(name);
        if (!allowed) {
            violations.push(`${label} has an unapproved dependency ${name}.`);
        }
        if (policy.highRiskExactDependencies.includes(name) && !/^\d+\.\d+\.\d+$/u.test(version)) {
            violations.push(`${label} must pin high-risk dependency ${name}; found ${version}.`);
        }
    }
    return violations;
}

export function evaluateExceptions(exceptions) {
    const violations = [];
    for (const exception of exceptions) {
        if (typeof exception.package !== 'string' || typeof exception.advisory !== 'string'
            || typeof exception.reason !== 'string' || typeof exception.owner !== 'string' || typeof exception.expires !== 'string') {
            violations.push('Every advisory exception requires package, advisory, reason, owner, and expires fields.');
        }
    }
    return violations;
}

/** Ivory-owned package directories that MUST be audited; nothing may be silently dropped from scope. */
function auditedPackagePaths() {
    const ivoryDirectories = fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true })
        .filter(entry => entry.isDirectory() && (entry.name.startsWith('ivory-tower-') || entry.name === 'ivory-identity'))
        .map(entry => entry.name);
    const packagePaths = ivoryDirectories.map(name => path.join(root, 'packages', name, 'package.json'));
    packagePaths.push(path.join(root, 'examples', 'ivory-tower-browser', 'package.json'));
    return { ivoryDirectories, packagePaths };
}

/** Docling is not an npm dependency; its pin is enforced by digest regex, checked here against the real pin plus a floating-tag fixture. */
function checkDoclingPin() {
    const violations = [];
    const digestPin = /^.+@sha256:[0-9a-f]{64}$/u;
    const environmentSource = fs.readFileSync(
        path.join(root, 'packages', 'ivory-tower-infrastructure', 'src', 'environment.ts'), 'utf8',
    );
    const match = environmentSource.match(/DEFAULT_DOCLING_IMAGE\s*=\s*\n?\s*'([^']+)'/u);
    if (match === undefined || match === null) {
        violations.push('Could not locate DEFAULT_DOCLING_IMAGE in environment.ts to verify the digest pin.');
    } else if (!digestPin.test(match[1])) {
        violations.push(`DEFAULT_DOCLING_IMAGE is not pinned by an immutable sha256 digest: ${match[1]}`);
    }
    const floatingTagFixture = 'quay.io/docling-project/docling-serve:v1.21.0';
    if (digestPin.test(floatingTagFixture)) {
        violations.push('Docling digest-pin regex incorrectly accepts a floating tag fixture; the pinning gate cannot be trusted to catch it.');
    }
    return violations;
}

function runAdversarialFixtures() {
    const fixturesPath = path.join(root, 'configs', 'ivory-dependency-policy-fixtures.json');
    const fixtures = JSON.parse(fs.readFileSync(fixturesPath, 'utf8'));
    const violations = [];
    for (const fixture of fixtures) {
        const found = evaluateManifest(fixture.manifest, `fixture:${fixture.description}`);
        const matched = found.some(violation => violation.includes(fixture.expectSubstring));
        if (!matched) {
            violations.push(`Adversarial fixture "${fixture.description}" did not trigger the expected policy violation `
                + `(expected a message containing "${fixture.expectSubstring}"); the dependency-policy gate cannot be trusted to catch it.`);
        }
    }
    return violations;
}

function main() {
    const { ivoryDirectories, packagePaths } = auditedPackagePaths();
    const violations = [];

    for (const packagePath of packagePaths) {
        const manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        violations.push(...evaluateManifest(manifest, path.relative(root, packagePath)));
    }

    violations.push(...evaluateExceptions(policy.advisoryExceptions));
    violations.push(...runAdversarialFixtures());
    violations.push(...checkDoclingPin());

    if (violations.length > 0) {
        console.error('Ivory Tower dependency policy violations:');
        for (const violation of violations) {
            console.error(`  - ${violation}`);
        }
        process.exit(1);
    }
    console.log(`Ivory Tower dependency policy: ${packagePaths.length} manifests checked (${ivoryDirectories.join(', ')}, `
        + 'example-browser); no unapproved dependencies, licenses, or exceptions; adversarial fixtures confirmed catchable.');
}

if (import.meta.url === `file://${process.argv[1]}`) {
    main();
}
