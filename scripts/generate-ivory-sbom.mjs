// @ts-check
'use strict';

/**
 * IV-19: generates a CycloneDX SBOM for the Ivory Tower source tree, then
 * derives a deployable-artifact SBOM for each service package (api, worker)
 * by filtering the source SBOM's dependency graph down to that package's own
 * transitive closure. Deriving from one authoritative lockfile-based scan
 * (rather than re-running cdxgen inside each workspace subdirectory) avoids
 * npm-workspaces resolution failures when no per-package lockfile exists.
 * Evidence is written outside normal source-authoring paths (artifacts/) and
 * is not committed; CI uploads it as a build artifact.
 * Run via: npm run sbom:generate:ivory-tower
 */

import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const artifactsDir = path.join(root, 'artifacts');

// Kept in lockstep with .github/workflows/generate-sbom.yml's CDXGEN_VERSION
// so the upstream Theia SBOM and the Ivory Tower SBOM come from one tool version.
const CDXGEN_VERSION = '11.7.0';

const sourceOutput = path.join(artifactsDir, 'sbom-ivory-source.cdx.json');
const deployableTargets = [
    { label: 'api', rootPurlName: '@ivory-tower/api', output: path.join(artifactsDir, 'sbom-ivory-api.cdx.json') },
    { label: 'worker', rootPurlName: '@ivory-tower/worker', output: path.join(artifactsDir, 'sbom-ivory-worker.cdx.json') },
];

fs.mkdirSync(artifactsDir, { recursive: true });

const commitSha = (() => {
    try {
        return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
    } catch {
        return 'unknown';
    }
})();

function stampProvenance(manifest, label) {
    manifest.metadata = manifest.metadata ?? {};
    manifest.metadata.properties = [
        ...(manifest.metadata.properties ?? []).filter(property => !String(property.name).startsWith('ivory-tower:')),
        { name: 'ivory-tower:commit', value: commitSha },
        { name: 'ivory-tower:target', value: label },
        { name: 'ivory-tower:cdxgen-version', value: CDXGEN_VERSION },
    ];
    return manifest;
}

console.log(`Generating source SBOM for commit ${commitSha}...`);
execFileSync(
    'npx',
    // --no-install-deps: resolve from package-lock.json only. CI already ran
    // `npm ci`; this keeps the scan deterministic and avoids a redundant install.
    ['--yes', `@cyclonedx/cdxgen@${CDXGEN_VERSION}`, '-t', 'npm', '--no-install-deps', root, '-o', sourceOutput],
    { cwd: root, stdio: 'inherit' },
);

const sourceManifest = JSON.parse(fs.readFileSync(sourceOutput, 'utf8'));
fs.writeFileSync(sourceOutput, `${JSON.stringify(stampProvenance(sourceManifest, 'source'), undefined, 2)}\n`);

const componentsByRef = new Map((sourceManifest.components ?? []).map(component => [component['bom-ref'], component]));
const dependenciesByRef = new Map((sourceManifest.dependencies ?? []).map(entry => [entry.ref, entry.dependsOn ?? []]));

for (const target of deployableTargets) {
    console.log(`Deriving ${target.label} deployable-artifact SBOM from the source scan...`);
    const rootComponent = [...componentsByRef.values()].find(
        component => `${component.group ? `${component.group}/` : ''}${component.name}` === target.rootPurlName,
    );
    if (rootComponent === undefined) {
        throw new Error(`Could not find a "${target.rootPurlName}" component in the source SBOM to root the ${target.label} SBOM on.`);
    }

    const reachable = new Set();
    const queue = [rootComponent['bom-ref']];
    while (queue.length > 0) {
        const ref = queue.pop();
        if (reachable.has(ref)) {
            continue;
        }
        reachable.add(ref);
        for (const dependsOnRef of dependenciesByRef.get(ref) ?? []) {
            queue.push(dependsOnRef);
        }
    }

    const deployableManifest = {
        ...sourceManifest,
        metadata: {
            ...sourceManifest.metadata,
            component: rootComponent,
        },
        components: (sourceManifest.components ?? []).filter(component => reachable.has(component['bom-ref'])),
        dependencies: (sourceManifest.dependencies ?? []).filter(entry => reachable.has(entry.ref)),
    };
    fs.writeFileSync(target.output, `${JSON.stringify(stampProvenance(deployableManifest, target.label), undefined, 2)}\n`);
    console.log(`  ${target.label}: ${deployableManifest.components.length} components in the transitive closure.`);
}

console.log(`Ivory Tower SBOMs written to ${path.relative(root, artifactsDir)}/ for commit ${commitSha}.`);
