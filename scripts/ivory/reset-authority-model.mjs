import fs from 'node:fs';
import path from 'node:path';

/**
 * Validator for the V1 reset-authority header at release-evidence/cutline.json.
 *
 * This is NOT the historical docs/generated/v1-cutline.json (schemaVersion 1); the two files
 * have different shapes, different lifecycles, and different validators. Session 00 (IVS-1 /
 * IV1-1) freezes the `authority` block; Session 01 (IVS-2) later adds a sibling `reconciliation`
 * block, which this validator tolerates and ignores.
 */

export const CANONICAL_NOTION_URL = /^https:\/\/app\.notion\.com\/p\/[0-9a-f]{32}$/;

export const REQUIRED_NOTION_IDS = {
    roadmap: '3cb9cb079ddb811eb7c1e43a4ca80439',
    executionContract: '3cb9cb079ddb8135adf9db1d07786ed3',
    v1Issues: 'adde6f38aea34caab3117f50c7ec67ff',
    v1Sessions: '676cc270f3154536be0ee00a5ba93129',
    session00: '3cb9cb079ddb814ca0f1d663e2fdb3e7',
    historicalTracker: '3af9cb079ddb8001b65ed40b0b1ed594',
};

export const EXPECTED_LAYERS = ['Core', 'Compute', 'Studio', 'IDE Bridge'];
export const EXPECTED_BASE_HEAD = '1e45afd5182a58f12205472e4f05f02c5086d44d';
export const RECONCILIATION_ISSUES = ['IV1-3', 'IV1-4'];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;
const SHA1 = /^[0-9a-f]{40}$/;
const PLACEHOLDER = /<[^>]*>|FILL|TBD|TODO|PLACEHOLDER/i;

export function readCutline(cutlinePath) {
    return JSON.parse(fs.readFileSync(cutlinePath, 'utf8'));
}

function isNonEmptyString(value) {
    return typeof value === 'string' && value.trim().length > 0;
}

function collectUrls(value, found) {
    if (typeof value === 'string') {
        if (value.startsWith('http')) {
            found.push(value);
        }
        return;
    }
    if (Array.isArray(value)) {
        for (const item of value) {
            collectUrls(item, found);
        }
        return;
    }
    if (value && typeof value === 'object') {
        for (const item of Object.values(value)) {
            collectUrls(item, found);
        }
    }
}

/**
 * @param {unknown} doc parsed release-evidence/cutline.json
 * @param {{ repoRoot?: string }} options
 * @returns {{ errors: string[] }}
 */
export function validateResetAuthority(doc, { repoRoot = process.cwd() } = {}) {
    const errors = [];
    const fail = message => errors.push(message);

    if (!doc || typeof doc !== 'object') {
        return { errors: ['cutline: document is not an object'] };
    }
    if (doc.artifact !== 'v1-reset-cutline') {
        fail(`cutline: artifact must be "v1-reset-cutline" (got ${JSON.stringify(doc.artifact)})`);
    }
    if (doc.artifactVersion !== 1) {
        fail(`cutline: artifactVersion must be 1 (got ${JSON.stringify(doc.artifactVersion)})`);
    }

    const authority = doc.authority;
    if (!authority || typeof authority !== 'object') {
        return { errors: [...errors, 'cutline: authority block is missing or not an object'] };
    }

    // --- dates -------------------------------------------------------------
    if (!ISO_DATE.test(authority.decisionDate || '')) {
        fail('authority.decisionDate: must be an ISO calendar date (YYYY-MM-DD)');
    }
    if (authority.frozenAt !== authority.decisionDate) {
        fail('authority.frozenAt: must equal authority.decisionDate');
    }

    // --- roadmap ---------------------------------------------------------------
    const roadmap = authority.roadmap || {};
    if (roadmap.revision !== 4) {
        fail(`authority.roadmap.revision: must be 4 (got ${JSON.stringify(roadmap.revision)})`);
    }
    if (roadmap.revisionDate !== authority.decisionDate) {
        fail('authority.roadmap.revisionDate: must equal authority.decisionDate');
    }
    if (roadmap.releasePosture !== 'NO-GO') {
        fail(`authority.roadmap.releasePosture: must be "NO-GO" (got ${JSON.stringify(roadmap.releasePosture)})`);
    }
    if (!CANONICAL_NOTION_URL.test(roadmap.url || '')) {
        fail('authority.roadmap.url: must be a canonical https://app.notion.com/p/<32-hex> URL');
    }

    // --- authority chain -------------------------------------------------------
    const chain = Array.isArray(authority.authorityChain) ? authority.authorityChain : [];
    if (chain.length === 0) {
        fail('authority.authorityChain: must be a non-empty array');
    }
    chain.forEach((entry, index) => {
        if (entry.rank !== index + 1) {
            fail(`authority.authorityChain[${index}].rank: ranks must be contiguous and 1-based (expected ${index + 1})`);
        }
        if (!isNonEmptyString(entry.name)) {
            fail(`authority.authorityChain[${index}].name: required`);
        }
        if (!isNonEmptyString(entry.role)) {
            fail(`authority.authorityChain[${index}].role: required`);
        }
        if (!CANONICAL_NOTION_URL.test(entry.url || '')) {
            fail(`authority.authorityChain[${index}].url: must be a canonical Notion URL`);
        }
    });

    // --- every URL under authority must be canonical --------------------------
    const urls = [];
    collectUrls(authority, urls);
    for (const url of urls) {
        if (!CANONICAL_NOTION_URL.test(url)) {
            fail(`authority: non-canonical URL present: ${url}`);
        }
    }

    // --- every required Notion id must appear somewhere ----------------------
    const joinedUrls = urls.join(' ');
    for (const [name, id] of Object.entries(REQUIRED_NOTION_IDS)) {
        if (!joinedUrls.includes(id)) {
            fail(`authority: missing required Notion id for "${name}" (${id})`);
        }
    }

    // --- architecture subpages ----------------------------------------------
    const subpages = Array.isArray(authority.architectureSubpages) ? authority.architectureSubpages : [];
    if (subpages.length !== 6) {
        fail(`authority.architectureSubpages: must list exactly 6 entries (got ${subpages.length})`);
    }
    subpages.forEach((entry, index) => {
        if (!isNonEmptyString(entry.name) || PLACEHOLDER.test(entry.name)) {
            fail(`authority.architectureSubpages[${index}].name: required and must not be a placeholder`);
        }
        if (!CANONICAL_NOTION_URL.test(entry.url || '')) {
            fail(`authority.architectureSubpages[${index}].url: must be a canonical Notion URL (no placeholder)`);
        }
    });

    // --- layers -------------------------------------------------------------
    if (JSON.stringify(authority.layers) !== JSON.stringify(EXPECTED_LAYERS)) {
        fail(`authority.layers: must equal ${JSON.stringify(EXPECTED_LAYERS)}`);
    }

    // --- scope -------------------------------------------------------------
    const scope = authority.v1Scope || {};
    for (const key of ['included', 'excluded']) {
        const list = scope[key];
        if (!Array.isArray(list) || list.length === 0) {
            fail(`authority.v1Scope.${key}: must be a non-empty array`);
            continue;
        }
        list.forEach((item, index) => {
            if (!isNonEmptyString(item) || PLACEHOLDER.test(item)) {
                fail(`authority.v1Scope.${key}[${index}]: must be a non-placeholder string`);
            }
        });
    }

    // --- evidence rule ----------------------------------------------------
    const evidenceRule = authority.evidenceRule;
    if (!isNonEmptyString(evidenceRule) || evidenceRule.length < 120) {
        fail('authority.evidenceRule: must be a substantive string (>= 120 chars)');
    } else {
        for (const needle of ['release-evidence/', 'docs/sessions/']) {
            if (!evidenceRule.includes(needle)) {
                fail(`authority.evidenceRule: must reference ${needle}`);
            }
        }
        if (!/legacy|frozen/i.test(evidenceRule)) {
            fail('authority.evidenceRule: must state the legacy/frozen tracker posture');
        }
    }

    // --- ledgers ---------------------------------------------------------
    const ledgers = authority.ledgers || {};
    for (const key of ['activeIssues', 'activeSessions']) {
        if ((ledgers[key] || {}).role !== 'authoritative') {
            fail(`authority.ledgers.${key}.role: must be "authoritative"`);
        }
    }
    const historical = ledgers.historicalTracker || {};
    if (historical.role !== 'historical-backlog-metadata') {
        fail('authority.ledgers.historicalTracker.role: must be "historical-backlog-metadata"');
    }
    if (historical.mutationPolicy !== 'read-only') {
        fail('authority.ledgers.historicalTracker.mutationPolicy: must be "read-only"');
    }
    if (historical.notionId !== REQUIRED_NOTION_IDS.historicalTracker) {
        fail('authority.ledgers.historicalTracker.notionId: must be the historical tracker id');
    }
    const reconciliation = historical.reconciliation || {};
    if (reconciliation.ownedBySession !== 'IVS-2') {
        fail('authority.ledgers.historicalTracker.reconciliation.ownedBySession: must be "IVS-2"');
    }
    if (JSON.stringify(reconciliation.issues) !== JSON.stringify(RECONCILIATION_ISSUES)) {
        fail(`authority.ledgers.historicalTracker.reconciliation.issues: must equal ${JSON.stringify(RECONCILIATION_ISSUES)}`);
    }
    const legacySnapshot = ledgers.legacyRepoSnapshot || {};
    if (legacySnapshot.path !== 'docs/generated/v1-cutline.json') {
        fail('authority.ledgers.legacyRepoSnapshot.path: must be "docs/generated/v1-cutline.json"');
    } else if (!fs.existsSync(path.join(repoRoot, legacySnapshot.path))) {
        fail(`authority.ledgers.legacyRepoSnapshot.path: ${legacySnapshot.path} does not exist on disk`);
    }

    // --- supersedes -----------------------------------------------------
    const supersedes = authority.supersedes || {};
    if (!Array.isArray(supersedes.notion) || !supersedes.notion.includes(REQUIRED_NOTION_IDS.historicalTracker)) {
        fail('authority.supersedes.notion: must include the historical tracker id');
    }
    const repoDocs = Array.isArray(supersedes.repoDocs) ? supersedes.repoDocs : [];
    if (!repoDocs.includes('docs/v1-build-vs-open-source.md')) {
        fail('authority.supersedes.repoDocs: must include docs/v1-build-vs-open-source.md');
    }
    repoDocs.forEach(docPath => {
        if (!fs.existsSync(path.join(repoRoot, docPath))) {
            fail(`authority.supersedes.repoDocs: ${docPath} does not exist on disk`);
        }
    });

    // --- repository baseline -------------------------------------------
    const baseline = authority.repositoryBaseline || {};
    if (!isNonEmptyString(baseline.branch)) {
        fail('authority.repositoryBaseline.branch: required');
    }
    if (baseline.baseHeadAtSessionStart !== EXPECTED_BASE_HEAD) {
        fail(`authority.repositoryBaseline.baseHeadAtSessionStart: must be ${EXPECTED_BASE_HEAD}`);
    }
    if (!isNonEmptyString(baseline.report)) {
        fail('authority.repositoryBaseline.report: required');
    } else if (!fs.existsSync(path.join(repoRoot, baseline.report))) {
        fail(`authority.repositoryBaseline.report: ${baseline.report} does not exist on disk`);
    }
    if (baseline.frozenCommit !== undefined && !SHA1.test(baseline.frozenCommit)) {
        fail('authority.repositoryBaseline.frozenCommit: must be a 40-hex commit sha when present');
    }

    // --- known defects ------------------------------------------------
    const defects = Array.isArray(authority.knownBaselineDefects) ? authority.knownBaselineDefects : [];
    if (!defects.some(defect => defect.id === 'verify-ivory-tower-missing-scripts')) {
        fail('authority.knownBaselineDefects: must record "verify-ivory-tower-missing-scripts"');
    }

    // --- next session -----------------------------------------------
    const next = authority.nextSession || {};
    if (next.id !== 'IVS-2' || next.firstIssue !== 'IV1-3' || next.status !== 'Ready') {
        fail('authority.nextSession: must be { id: "IVS-2", firstIssue: "IV1-3", status: "Ready" }');
    }

    return { errors };
}

/**
 * Cross-reference: the human-readable manifest must actually point at this file and carry the
 * frozen decision facts. Defeats a stale or status-only manifest update.
 *
 * @returns {{ errors: string[] }}
 */
export function validateManifestCrossReference(manifestText) {
    const errors = [];
    if (typeof manifestText !== 'string' || manifestText.trim().length === 0) {
        return { errors: ['manifest: docs/v1-reset-manifest.md is missing or empty'] };
    }
    const required = [
        'release-evidence/cutline.json',
        '2026-08-29',
        'IV1-3',
        'Session 01',
    ];
    for (const needle of required) {
        if (!manifestText.includes(needle)) {
            errors.push(`manifest: docs/v1-reset-manifest.md must reference "${needle}"`);
        }
    }
    if (!/revision\s*4/i.test(manifestText)) {
        errors.push('manifest: docs/v1-reset-manifest.md must name roadmap revision 4');
    }
    return { errors };
}

export function formatErrors(errors) {
    return errors.map(error => `  - ${error}`).join('\n');
}
