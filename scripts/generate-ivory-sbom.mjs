// @ts-check
'use strict';

/**
 * Generates CycloneDX-shaped SBOMs for the Ivory Tower source tree and for
 * each deployable artifact (api, worker), from the resolved npm-workspace
 * dependency graph in package-lock.json (IV-19).
 *
 * Usage: node scripts/generate-ivory-sbom.mjs [--out-dir artifacts]
 */

import fs from 'node:fs';
import path from 'node:path';
import {
    ROOT,
    IVORY_DEPLOYABLE_WORKSPACES,
    IVORY_SOURCE_WORKSPACES,
    resolveDependencyClosure,
} from './shared/ivory-dependency-graph.mjs';

function outDirFromArgs(argv) {
    const flagIndex = argv.indexOf('--out-dir');
    if (flagIndex === -1) {
        return path.join(ROOT, 'artifacts');
    }
    const value = argv[flagIndex + 1];
    if (value === undefined) {
        throw new Error('--out-dir requires a path argument.');
    }
    return path.isAbsolute(value) ? value : path.join(ROOT, value);
}

function rootPackageVersion() {
    const rootManifest = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
    return rootManifest.version ?? '0.0.0';
}

function buildBom(componentName, closure) {
    const components = [...closure.values()]
        .sort((a, b) => (a.name === b.name ? a.version.localeCompare(b.version) : a.name.localeCompare(b.name)))
        .map(dependency => ({
            type: 'library',
            name: dependency.name,
            version: dependency.version,
            purl: `pkg:npm/${dependency.name.replace('@', '%40')}@${dependency.version}`,
            licenses: [{ license: { id: dependency.license } }],
            ...(dependency.resolved !== undefined ? { externalReferences: [{ type: 'distribution', url: dependency.resolved }] } : {}),
        }));

    return {
        bomFormat: 'CycloneDX',
        specVersion: '1.5',
        version: 1,
        metadata: {
            timestamp: new Date().toISOString(),
            component: {
                type: 'application',
                name: componentName,
                version: rootPackageVersion(),
            },
        },
        components,
    };
}

function writeBom(outDir, fileName, bom) {
    if (bom.components.length === 0) {
        throw new Error(`Refusing to write an empty SBOM for ${fileName}; the dependency graph resolved to zero components.`);
    }
    fs.mkdirSync(outDir, { recursive: true });
    const outPath = path.join(outDir, fileName);
    fs.writeFileSync(outPath, `${JSON.stringify(bom, undefined, 2)}\n`, 'utf8');
    return outPath;
}

function main() {
    const outDir = outDirFromArgs(process.argv.slice(2));
    const written = [];

    const sourceClosure = resolveDependencyClosure(IVORY_SOURCE_WORKSPACES);
    written.push(writeBom(outDir, 'sbom-ivory-source.cdx.json', buildBom('ivory-tower-source', sourceClosure)));

    for (const [artifact, workspaces] of Object.entries(IVORY_DEPLOYABLE_WORKSPACES)) {
        const closure = resolveDependencyClosure(workspaces);
        written.push(writeBom(outDir, `sbom-ivory-${artifact}.cdx.json`, buildBom(`ivory-tower-${artifact}`, closure)));
    }

    for (const file of written) {
        console.log(`Ivory Tower SBOM written: ${path.relative(ROOT, file)}`);
    }
}

main();
