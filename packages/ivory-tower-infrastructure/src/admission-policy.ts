// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

import { SourceAdmissionPort } from '@ivory-tower/adapters';
import { SourceMetadata } from '@ivory-tower/contracts';

export class FailClosedAdmissionPolicy implements SourceAdmissionPort {
    async admit(_metadata: SourceMetadata, _contentHash: string): Promise<{ allowed: boolean; reason: string }> {
        return { allowed: false, reason: 'No supported-content policy has authorized this source.' };
    }
}

export class SafeOpenAdmissionPolicy implements SourceAdmissionPort {
    constructor(private readonly acceptedLicenses: ReadonlySet<string>) {}

    async admit(metadata: SourceMetadata, _contentHash: string): Promise<{ allowed: boolean; reason: string }> {
        if (!['application/pdf', 'text/plain', 'text/markdown'].includes(metadata.contentType)) {
            return { allowed: false, reason: 'The content type is outside the V1 safe-open allowlist.' };
        }
        if (!this.acceptedLicenses.has(metadata.license)) {
            return { allowed: false, reason: 'The source license is not an approved V1 reuse term.' };
        }
        if (metadata.authorizationEvidence.trim().length === 0) {
            return { allowed: false, reason: 'Authorization evidence is required before processing.' };
        }
        return { allowed: true, reason: 'Source admitted by the versioned safe-open policy.' };
    }
}
