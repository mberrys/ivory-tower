// @ts-check
'use strict';

/**
 * Enforces the IV-19 reviewed third-party inventory: every direct production
 * dependency of an Ivory-owned package must be recorded with purpose, license,
 * version policy, and replacement path, and the technologies IV-19's
 * acceptance criteria name explicitly (LiqUIdify, Docling, PDF.js, AI SDK
 * provider adapters, pgvector, visualization libraries, model assets) must be
 * represented even before they are installed.
 * Run via: npm run inventory:policy:ivory-tower
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_STRING_FIELDS = ['purpose', 'owner', 'license', 'versionPolicy', 'replacementPath', 'nativeOrRuntimeRequirement'];
const REQUIRED_BOOLEAN_FIELDS = ['networkCapable', 'sourceContentCrossesBoundary'];
const VALID_KINDS = ['npm-dependency', 'represented-technology'];

const REQUIRED_REPRESENTED_TECHNOLOGIES = [
    'theia-platform',
    'liquidify-react',
    'docling',
    'pdfjs-dist',
    'ai-sdk-provider-adapters',
    'pgvector',
    'visualization-libraries',
    'model-assets',
];

// Direct dependencies that are internal (Ivory-owned) or governed as the single
// "theia-platform" represented-technology entry rather than individually.
function isExemptFromIndividualEntry(name) {
    return name.startsWith('@ivory-tower/') || name.startsWith('@theia/');
}

function readJson(relativePath) {
    return JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
}

function collectIvoryManifestPaths() {
    const manifestPaths = fs
        .readdirSync(path.join(root, 'packages'), { withFileTypes: true })
        .filter(entry => entry.isDirectory() && (entry.name.startsWith('ivory-tower-') || entry.name === 'ivory-identity'))
        .map(entry => path.join('packages', entry.name, 'package.json'));
    manifestPaths.push(path.join('examples', 'ivory-tower-browser', 'package.json'));
    return manifestPaths;
}

function collectDirectDependencyNames(manifestPaths) {
    const names = new Set();
    for (const manifestPath of manifestPaths) {
        const manifest = readJson(manifestPath);
        for (const name of Object.keys(manifest.dependencies ?? {})) {
            names.add(name);
        }
    }
    return names;
}

const violations = [];
const inventory = readJson(path.join('configs', 'ivory-third-party-inventory.json'));

if (!Array.isArray(inventory.entries)) {
    violations.push('configs/ivory-third-party-inventory.json must have an "entries" array.');
} else {
    const seenNames = new Set();
    for (const [index, entry] of inventory.entries.entries()) {
        const label = typeof entry.name === 'string' && entry.name.length > 0 ? entry.name : `entries[${index}]`;
        if (seenNames.has(entry.name)) {
            violations.push(`Duplicate inventory entry: ${label}.`);
        }
        seenNames.add(entry.name);
        if (typeof entry.name !== 'string' || entry.name.length === 0) {
            violations.push(`${label} is missing a non-empty "name".`);
        }
        if (!VALID_KINDS.includes(entry.kind)) {
            violations.push(`${label} has an invalid "kind" (expected one of ${VALID_KINDS.join(', ')}).`);
        }
        if (typeof entry.status !== 'string' || entry.status.length === 0) {
            violations.push(`${label} is missing a non-empty "status".`);
        }
        for (const field of REQUIRED_STRING_FIELDS) {
            if (typeof entry[field] !== 'string' || entry[field].length === 0) {
                violations.push(`${label} is missing required field "${field}".`);
            }
        }
        for (const field of REQUIRED_BOOLEAN_FIELDS) {
            if (typeof entry[field] !== 'boolean') {
                violations.push(`${label} is missing required boolean field "${field}".`);
            }
        }
        if (!Array.isArray(entry.usedBy) || entry.usedBy.length === 0) {
            violations.push(`${label} is missing a non-empty "usedBy" array.`);
        }
    }

    const inventoryNames = new Set(inventory.entries.map(entry => entry.name));

    const manifestPaths = collectIvoryManifestPaths();
    const directDependencyNames = collectDirectDependencyNames(manifestPaths);
    for (const name of directDependencyNames) {
        if (isExemptFromIndividualEntry(name)) {
            continue;
        }
        if (!inventoryNames.has(name)) {
            violations.push(
                `Direct dependency "${name}" is not recorded in configs/ivory-third-party-inventory.json. ` +
                    'Every direct dependency needs purpose, license, version policy, and replacement path before it can ship.',
            );
        }
    }

    for (const technology of REQUIRED_REPRESENTED_TECHNOLOGIES) {
        if (!inventoryNames.has(technology)) {
            violations.push(
                `Required represented technology "${technology}" is missing from configs/ivory-third-party-inventory.json ` +
                    '(IV-19 acceptance criteria require it to be represented even before installation).',
            );
        }
    }
}

if (violations.length > 0) {
    console.error('Ivory Tower third-party inventory violations:');
    for (const violation of violations) {
        console.error(`  - ${violation}`);
    }
    process.exit(1);
}
console.log(`Ivory Tower third-party inventory: ${inventory.entries.length} entries checked; every direct dependency and required technology is represented.`);
