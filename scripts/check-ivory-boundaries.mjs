// @ts-check
'use strict';

/**
 * Enforces Ivory Tower module-boundary import rules (IV-15).
 * Run via: npm run check:ivory-boundaries
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

const LAYERS = [
    {
        name: '@ivory-tower/domain',
        dir: 'packages/ivory-tower-domain/src',
        forbidden: [
            '@theia/',
            '@ivory-tower/application',
            '@ivory-tower/infrastructure',
            '@ivory-tower/health',
            'liquidify-react',
        ],
    },
    {
        name: '@ivory-tower/adapters',
        dir: 'packages/ivory-tower-adapters/src',
        forbidden: [
            '@theia/',
            '@ivory-tower/application',
            '@ivory-tower/infrastructure',
            '@ivory-tower/health',
            'liquidify-react',
        ],
    },
    {
        name: '@ivory-tower/application',
        dir: 'packages/ivory-tower-application/src',
        forbidden: [
            '@theia/',
            '@ivory-tower/infrastructure',
            '@ivory-tower/health',
            'liquidify-react',
        ],
    },
    {
        name: '@ivory-tower/infrastructure',
        dir: 'packages/ivory-tower-infrastructure/src',
        forbidden: [
            '@theia/',
            '@ivory-tower/application',
            '@ivory-tower/health',
            'liquidify-react',
        ],
    },
    {
        name: '@ivory-tower/health',
        dir: 'packages/ivory-tower-health/src',
        forbidden: [
            'liquidify-react',
        ],
    },
];

const IMPORT_PATTERN = /(?:import|export)\s+(?:type\s+)?(?:[\w*{}\s,]+\s+from\s+)?['"]([^'"]+)['"]/g;

function collectSourceFiles(dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    const files = [];
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            files.push(...collectSourceFiles(fullPath));
        } else if (/\.(ts|tsx)$/.test(entry.name) && !entry.name.endsWith('.d.ts')) {
            files.push(fullPath);
        }
    }
    return files;
}

function findViolations(layer) {
    const layerDir = path.join(ROOT, layer.dir);
    if (!fs.existsSync(layerDir)) {
        return [`missing layer directory: ${layer.dir}`];
    }

    const violations = [];
    for (const file of collectSourceFiles(layerDir)) {
        const content = fs.readFileSync(file, 'utf8');
        let match;
        while ((match = IMPORT_PATTERN.exec(content)) !== null) {
            const specifier = match[1];
            for (const forbidden of layer.forbidden) {
                if (specifier.includes(forbidden)) {
                    violations.push(`${layer.name}: ${path.relative(ROOT, file)} imports "${specifier}" (forbidden: ${forbidden})`);
                }
            }
        }
    }
    return violations;
}

const allViolations = LAYERS.flatMap(findViolations);

if (allViolations.length > 0) {
    console.error('Ivory Tower module boundary violations:');
    for (const violation of allViolations) {
        console.error(`  - ${violation}`);
    }
    process.exit(1);
}

console.log('Ivory Tower module boundaries: OK');
