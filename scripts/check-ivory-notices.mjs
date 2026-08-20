// @ts-check
'use strict';

/**
 * IV-19: proves THIRD-PARTY-NOTICES-ivory-tower.md is reproducible from
 * configs/ivory-third-party-inventory.json — regenerates it in memory and
 * fails if the committed file has drifted.
 * Run via: npm run notices:check:ivory-tower
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderNotices } from './generate-ivory-notices.mjs';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const outputPath = path.join(root, 'THIRD-PARTY-NOTICES-ivory-tower.md');

const expected = renderNotices();
const actual = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : undefined;

if (actual !== expected) {
    console.error(
        'THIRD-PARTY-NOTICES-ivory-tower.md is out of date with configs/ivory-third-party-inventory.json.\n' +
            'Run `npm run notices:generate:ivory-tower` and commit the result.',
    );
    process.exit(1);
}
console.log('Ivory Tower third-party notices: THIRD-PARTY-NOTICES-ivory-tower.md is reproducible from the inventory.');
