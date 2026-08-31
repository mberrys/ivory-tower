#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
    formatErrors,
    readCutline,
    validateManifestCrossReference,
    validateResetAuthority,
} from './reset-authority-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const cutlineArgument = process.argv.slice(2).find(argument => !argument.startsWith('--'));
const cutlinePath = path.resolve(ROOT, cutlineArgument || 'release-evidence/cutline.json');
const manifestPath = path.join(ROOT, 'docs/v1-reset-manifest.md');

const errors = [];

let cutline;
try {
    cutline = readCutline(cutlinePath);
} catch (error) {
    console.error(`FAIL  cannot read ${path.relative(ROOT, cutlinePath)}: ${error.message}`);
    process.exit(1);
}

errors.push(...validateResetAuthority(cutline, { repoRoot: ROOT }).errors);

const manifestText = fs.existsSync(manifestPath) ? fs.readFileSync(manifestPath, 'utf8') : '';
errors.push(...validateManifestCrossReference(manifestText).errors);

if (errors.length > 0) {
    console.error(`FAIL  reset-authority header is incomplete or inconsistent:\n${formatErrors(errors)}`);
    process.exit(1);
}

console.log(`PASS  ${path.relative(ROOT, cutlinePath)} - authority chain, scope, evidence rule, ledger roles, and baseline verified`);
console.log(`PASS  ${path.relative(ROOT, manifestPath)} - points at the frozen cutline header and decision facts`);
