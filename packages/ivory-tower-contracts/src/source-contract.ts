// SPDX-License-Identifier: EPL-2.0 OR GPL-2.0-only WITH Classpath-exception-2.0

import { z } from 'zod';

export const sourceMetadataSchema = z.object({
    filename: z.string().min(1).max(255),
    contentType: z.string().min(1).max(255),
    license: z.string().min(1).max(255),
    authorizationEvidence: z.string().min(1).max(2000),
});

export const sourceUploadResponseSchema = z.object({
    sourceId: z.string().min(1),
    contentHash: z.string().regex(/^[a-f0-9]{64}$/),
    objectKey: z.string().min(1),
    admittedAt: z.string().datetime(),
});

export type SourceMetadata = z.infer<typeof sourceMetadataSchema>;
export type SourceUploadResponse = z.infer<typeof sourceUploadResponseSchema>;
