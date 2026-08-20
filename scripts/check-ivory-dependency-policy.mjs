// @ts-check
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'configs', 'ivory-dependency-policy.json'), 'utf8'));

// Package-directory match rule that decides quality-gate scope. Kept as a single
// predicate so the fixture check below can prove new Ivory-owned packages are
// picked up automatically instead of needing to be added to a hardcoded list.
function isIvoryOwnedPackageDirectory(name) {
    return name.startsWith('ivory-tower-') || name === 'ivory-identity';
}

const packagePaths = fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && isIvoryOwnedPackageDirectory(entry.name))
    .map(entry => path.join(root, 'packages', entry.name, 'package.json'));
packagePaths.push(path.join(root, 'examples', 'ivory-tower-browser', 'package.json'));
const violations = [];

function isDependencyAllowed(name) {
    return policy.allowedDependencyPrefixes.some(prefix => name.startsWith(prefix))
        || policy.approvedNetworkDependencies.includes(name)
        || ['tslib', 'zod'].includes(name);
}

for (const packagePath of packagePaths) {
    const manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (!policy.allowedLicenseExpressions.includes(manifest.license)) {
        violations.push(`${path.relative(root, packagePath)} uses unapproved license expression ${manifest.license}.`);
    }
    const dependencies = { ...manifest.dependencies, ...manifest.devDependencies, ...manifest.peerDependencies };
    for (const [name, version] of Object.entries(dependencies)) {
        if (!isDependencyAllowed(name)) {
            violations.push(`${path.relative(root, packagePath)} has an unapproved dependency ${name}.`);
        }
        if (policy.highRiskExactDependencies.includes(name) && !/^\d+\.\d+\.\d+$/u.test(version)) {
            violations.push(`${path.relative(root, packagePath)} must pin high-risk dependency ${name}; found ${version}.`);
        }
    }
}

for (const exception of policy.advisoryExceptions) {
    if (typeof exception.package !== 'string' || typeof exception.advisory !== 'string'
        || typeof exception.reason !== 'string' || typeof exception.owner !== 'string' || typeof exception.expires !== 'string') {
        violations.push('Every advisory exception requires package, advisory, reason, owner, and expires fields.');
    }
}

// Adversarial fixtures (IV-19 verification: "inject a known policy-violating
// dependency ... and confirm the gate fails"). Each fixture proves the current
// policy rules WOULD reject the violating case, without injecting it for real.
const fixtures = JSON.parse(fs.readFileSync(path.join(root, 'configs', 'ivory-dependency-policy-fixtures.json'), 'utf8'));
for (const fixture of fixtures) {
    switch (fixture.case) {
        case 'unapproved-network-dependency':
            if (isDependencyAllowed(fixture.dependency)) {
                violations.push(`fixture "${fixture.case}" is stale: ${fixture.dependency} would now be allowed.`);
            }
            break;
        case 'prohibited-license':
            if (policy.allowedLicenseExpressions.includes(fixture.license)) {
                violations.push(`fixture "${fixture.case}" is stale: license ${fixture.license} would now be allowed.`);
            }
            break;
        case 'floating-high-risk-version':
            if (!policy.highRiskExactDependencies.includes(fixture.dependency)) {
                violations.push(`fixture "${fixture.case}" is stale: ${fixture.dependency} is no longer high-risk.`);
            } else if (/^\d+\.\d+\.\d+$/u.test(fixture.version)) {
                violations.push(`fixture "${fixture.case}" is stale: version ${fixture.version} would now pass the exact-pin check.`);
            }
            break;
        case 'package-omitted-from-quality-scope': {
            const impliedDirectoryName = path.basename(path.dirname(fixture.manifest));
            if (!isIvoryOwnedPackageDirectory(impliedDirectoryName)) {
                violations.push(`fixture "${fixture.case}" is stale: ${impliedDirectoryName} would not be picked up by isIvoryOwnedPackageDirectory.`);
            }
            break;
        }
        default:
            violations.push(`Unrecognized dependency-policy fixture case: ${fixture.case}.`);
    }
}

if (violations.length > 0) {
    console.error('Ivory Tower dependency policy violations:');
    for (const violation of violations) {
        console.error(`  - ${violation}`);
    }
    process.exit(1);
}
console.log(`Ivory Tower dependency policy: ${packagePaths.length} manifests checked; no unapproved dependencies, licenses, or exceptions.`);
