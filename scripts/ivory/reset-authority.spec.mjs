import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
    readCutline,
    validateManifestCrossReference,
    validateResetAuthority,
} from './reset-authority-model.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const FIXTURES = path.join(ROOT, 'scripts/ivory/fixtures/reset-authority');
const cutline = readCutline(path.join(ROOT, 'release-evidence/cutline.json'));

function clone() {
    return structuredClone(cutline);
}

function fixture(name) {
    return JSON.parse(fs.readFileSync(path.join(FIXTURES, name), 'utf8'));
}

function errorsOf(doc) {
    return validateResetAuthority(doc, { repoRoot: ROOT }).errors.join('\n');
}

// --- success ---------------------------------------------------------------

test('the committed reset-authority header is internally consistent', () => {
    assert.deepEqual(validateResetAuthority(cutline, { repoRoot: ROOT }).errors, []);
});

test('the committed manifest points at the frozen header and decision facts', () => {
    const manifestText = fs.readFileSync(path.join(ROOT, 'docs/v1-reset-manifest.md'), 'utf8');
    assert.deepEqual(validateManifestCrossReference(manifestText).errors, []);
});

// --- a no-op / status-only / stale artifact cannot pass -------------------

test('rejects an empty document (no-op)', () => {
    assert.match(errorsOf(fixture('empty.json')), /artifact must be "v1-reset-cutline"/);
});

test('rejects a status-only update', () => {
    const errors = errorsOf(fixture('status-only.json'));
    assert.match(errors, /artifact must be "v1-reset-cutline"/);
    assert.match(errors, /authority block is missing/);
});

test('rejects a document that still points only at the historical tracker', () => {
    const candidate = clone();
    candidate.authority.authorityChain = [
        {
            rank: 1,
            name: 'Ivory Tower Issue Tracker',
            url: 'https://app.notion.com/p/3af9cb079ddb8001b65ed40b0b1ed594',
            role: 'legacy',
        },
    ];
    assert.match(errorsOf(candidate), /missing required Notion id for "executionContract"/);
});

// --- field-level guards --------------------------------------------------

test('rejects a non-canonical Notion URL (workspace slug form)', () => {
    const candidate = clone();
    candidate.authority.authorityChain[0].url =
        'https://www.notion.so/berrymichael/Roadmap-3cb9cb079ddb811eb7c1e43a4ca80439';
    assert.match(errorsOf(candidate), /non-canonical URL present/);
});

test('rejects a missing decision date', () => {
    const candidate = clone();
    delete candidate.authority.decisionDate;
    assert.match(errorsOf(candidate), /decisionDate: must be an ISO calendar date/);
});

test('rejects the wrong roadmap revision', () => {
    const candidate = clone();
    candidate.authority.roadmap.revision = 3;
    assert.match(errorsOf(candidate), /roadmap\.revision: must be 4/);
});

test('rejects a GO release posture', () => {
    const candidate = clone();
    candidate.authority.roadmap.releasePosture = 'GO';
    assert.match(errorsOf(candidate), /releasePosture: must be "NO-GO"/);
});

test('rejects placeholder architecture subpages', () => {
    const candidate = clone();
    candidate.authority.architectureSubpages[0].url = 'https://app.notion.com/p/<FILL FROM ROADMAP>';
    assert.match(errorsOf(candidate), /architectureSubpages\[0\]\.url: must be a canonical Notion URL/);
});

test('rejects fewer than six architecture subpages', () => {
    const candidate = clone();
    candidate.authority.architectureSubpages = candidate.authority.architectureSubpages.slice(0, 4);
    assert.match(errorsOf(candidate), /must list exactly 6 entries/);
});

test('rejects a writable historical tracker', () => {
    const candidate = clone();
    candidate.authority.ledgers.historicalTracker.mutationPolicy = 'read-write';
    assert.match(errorsOf(candidate), /historicalTracker\.mutationPolicy: must be "read-only"/);
});

test('rejects the wrong reconciliation owner', () => {
    const candidate = clone();
    candidate.authority.ledgers.historicalTracker.reconciliation.ownedBySession = 'IVS-1';
    assert.match(errorsOf(candidate), /reconciliation\.ownedBySession: must be "IVS-2"/);
});

test('rejects a legacy snapshot path that is not on disk', () => {
    const candidate = clone();
    candidate.authority.ledgers.legacyRepoSnapshot.path = 'docs/generated/does-not-exist.json';
    assert.match(errorsOf(candidate), /legacyRepoSnapshot\.path: must be "docs\/generated\/v1-cutline\.json"/);
});

test('rejects a superseded repo doc that is not on disk', () => {
    const candidate = clone();
    candidate.authority.supersedes.repoDocs.push('docs/not-a-real-doc.md');
    assert.match(errorsOf(candidate), /docs\/not-a-real-doc\.md does not exist on disk/);
});

test('rejects a non-contiguous authority chain', () => {
    const candidate = clone();
    candidate.authority.authorityChain[2].rank = 9;
    assert.match(errorsOf(candidate), /ranks must be contiguous and 1-based/);
});

test('rejects the wrong session-start baseline commit', () => {
    const candidate = clone();
    candidate.authority.repositoryBaseline.baseHeadAtSessionStart = '0000000000000000000000000000000000000000';
    assert.match(errorsOf(candidate), /baseHeadAtSessionStart: must be 1e45afd5/);
});

test('rejects a thin evidence rule', () => {
    const candidate = clone();
    candidate.authority.evidenceRule = 'Trust the tracker.';
    assert.match(errorsOf(candidate), /evidenceRule: must be a substantive string/);
});

test('rejects an evidence rule that omits the repository-evidence locations', () => {
    const candidate = clone();
    candidate.authority.evidenceRule = candidate.authority.evidenceRule.replace('release-evidence/', 'somewhere');
    assert.match(errorsOf(candidate), /evidenceRule: must reference release-evidence\//);
});

test('rejects a next session that is not IVS-2 / IV1-3 / Ready', () => {
    const candidate = clone();
    candidate.authority.nextSession.status = 'Not started';
    assert.match(errorsOf(candidate), /nextSession: must be/);
});

test('rejects dropping the recorded verify:ivory-tower defect', () => {
    const candidate = clone();
    candidate.authority.knownBaselineDefects = [];
    assert.match(errorsOf(candidate), /must record "verify-ivory-tower-missing-scripts"/);
});

test('rejects a frozenCommit that is not a 40-hex sha', () => {
    const candidate = clone();
    candidate.authority.repositoryBaseline.frozenCommit = 'abc123';
    assert.match(errorsOf(candidate), /frozenCommit: must be a 40-hex commit sha/);
});

test('accepts a well-formed frozenCommit', () => {
    const candidate = clone();
    candidate.authority.repositoryBaseline.frozenCommit = 'a'.repeat(40);
    assert.deepEqual(validateResetAuthority(candidate, { repoRoot: ROOT }).errors, []);
});

// --- manifest cross-reference guards -----------------------------------

test('manifest cross-reference rejects a manifest that never names the cutline file', () => {
    assert.match(
        validateManifestCrossReference('# Reset\n\nRevision 4. Session 01. IV1-3. 2026-08-29.').errors.join('\n'),
        /must reference "release-evidence\/cutline\.json"/,
    );
});

test('manifest cross-reference rejects an empty manifest', () => {
    assert.match(validateManifestCrossReference('').errors.join('\n'), /is missing or empty/);
});
