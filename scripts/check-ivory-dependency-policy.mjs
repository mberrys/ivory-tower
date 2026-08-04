// @ts-check
'use strict';

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const policy = JSON.parse(fs.readFileSync(path.join(root, 'configs', 'ivory-dependency-policy.json'), 'utf8'));
const packagePaths = fs.readdirSync(path.join(root, 'packages'), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && entry.name.startsWith('ivory-tower-'))
    .map(entry => path.join(root, 'packages', entry.name, 'package.json'));
packagePaths.push(path.join(root, 'examples', 'ivory-tower-browser', 'package.json'));
const violations = [];

for (const packagePath of packagePaths) {
    const manifest = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
    if (!policy.allowedLicenseExpressions.includes(manifest.license)) {
        violations.push(`${path.relative(root, packagePath)} uses unapproved license expression ${manifest.license}.`);
    }
    const dependencies = { ...manifest.dependencies, ...manifest.devDependencies, ...manifest.peerDependencies };
    for (const [name, version] of Object.entries(dependencies)) {
        const allowed = policy.allowedDependencyPrefixes.some(prefix => name.startsWith(prefix))
            || policy.approvedNetworkDependencies.includes(name)
            || ['tslib', 'zod'].includes(name);
        if (!allowed) {
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

if (violations.length > 0) {
    console.error('Ivory Tower dependency policy violations:');
    for (const violation of violations) {
        console.error(`  - ${violation}`);
    }
    process.exit(1);
}
console.log(`Ivory Tower dependency policy: ${packagePaths.length} manifests checked; no unapproved dependencies, licenses, or exceptions.`);
