import fsp from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';
import formidable, { type File } from 'formidable';
import type { NextApiRequest } from 'next';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';
import { HttpError, badRequest } from '@/server/http-error';
import { UPLOAD_ASSETS_FILE, UPLOAD_CONTENT_FILE } from '@/server/jobs/schemas';
import { enqueueJob } from '@/server/jobs/queue';
import { awaitJob } from '@/server/jobs/sse';
import * as storage from '@/server/storage';
import { resolveInside } from '@/server/validation';

// Body is parsed here: multipart uploads are streamed to disk, JSON is size-capped.
export const config = { api: { bodyParser: false } };

const MAX_JSON_BODY = 100 * 1024 * 1024;
const MAX_UPLOAD_JSON = 1024 * 1024 * 1024;

async function readJsonBody(req: NextApiRequest): Promise<Record<string, unknown>> {
    let size = 0;
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
        size += chunk.length;
        if (size > MAX_JSON_BODY) throw new HttpError(413, 'PAYLOAD_TOO_LARGE', 'Request is too large. Upload the backup as a file instead.');
        chunks.push(chunk as Buffer);
    }
    try {
        return JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}');
    } catch {
        throw badRequest('Invalid JSON body');
    }
}

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
const jsonField = (v: string | undefined) => {
    if (!v) return undefined;
    try {
        return JSON.parse(v);
    } catch {
        throw badRequest('Invalid form field');
    }
};

/**
 * POST /api/restore — restore a stored backup or an uploaded Contentful export
 * (+ optional asset zip) into an environment. Runs as a background job; the target
 * is snapshotted first. Accepts multipart/form-data or JSON.
 */
export default createApiHandler({
    POST: route({
        rateLimit: { limit: 10, windowSeconds: 60, bucket: 'jobs' },
        handler: async (req, res, { user }) => {
            const uploadId = randomUUID();
            const uploadDir = resolveInside(storage.storagePath(...storage.keys.uploadDir(user.id)), uploadId);
            let hasUpload = false;
            let params: Record<string, unknown>;

            try {
                if ((req.headers['content-type'] || '').includes('multipart/form-data')) {
                    const settings = await prisma.appSettings.findFirst();
                    const maxZip = (settings?.maxAssetSizeMB ?? 1024) * 1024 * 1024;
                    await storage.ensureDir(uploadDir);
                    const form = formidable({
                        uploadDir,
                        maxFiles: 2,
                        maxFileSize: Math.max(maxZip, MAX_UPLOAD_JSON),
                        maxTotalFileSize: maxZip + MAX_UPLOAD_JSON,
                        maxFieldsSize: 50 * 1024 * 1024,
                        filter: ({ name }) => name === 'backupFile' || name === 'assetZip',
                    });
                    const [fields, files] = await form.parse(req);
                    const backupFile = files.backupFile?.[0] as File | undefined;
                    const assetZip = files.assetZip?.[0] as File | undefined;
                    if (backupFile) {
                        await fsp.rename(backupFile.filepath, path.join(uploadDir, UPLOAD_CONTENT_FILE));
                        hasUpload = true;
                    } else if (first(fields.backupContent)) {
                        await fsp.writeFile(path.join(uploadDir, UPLOAD_CONTENT_FILE), first(fields.backupContent)!);
                        hasUpload = true;
                    }
                    if (assetZip) await fsp.rename(assetZip.filepath, path.join(uploadDir, UPLOAD_ASSETS_FILE));

                    params = {
                        spaceId: first(fields.spaceId),
                        targetEnvironment: first(fields.targetEnvironment),
                        backupId: first(fields.backupId) || undefined,
                        fileName: first(fields.fileName),
                        localeMapping: jsonField(first(fields.localeMapping)),
                        options: jsonField(first(fields.options)) ?? {},
                    };
                } else {
                    const body = await readJsonBody(req);
                    if (body.backupContent) {
                        await storage.ensureDir(uploadDir);
                        await fsp.writeFile(path.join(uploadDir, UPLOAD_CONTENT_FILE), JSON.stringify(body.backupContent));
                        hasUpload = true;
                    }
                    params = {
                        spaceId: body.spaceId,
                        targetEnvironment: body.targetEnvironment,
                        backupId: body.backupId || undefined,
                        fileName: body.fileName,
                        localeMapping: body.localeMapping,
                        options: { ...(body.options as object ?? {}), ...(body.clearEnvironment !== undefined ? { clearEnvironment: body.clearEnvironment } : {}) },
                    };
                }

                if (hasUpload) {
                    params.uploadId = uploadId;
                    delete params.backupId;
                }
                if (params.options && typeof params.options === 'object') {
                    const o = params.options as Record<string, unknown>;
                    delete o.backupFile;
                    delete o.assetFile;
                }

                const jobId = await enqueueJob(user.id, 'restore', params);
                res.setHeader('X-Job-Id', jobId);
                const end = await awaitJob(req, jobId);
                if (!end) return;
                if (end.status !== 'SUCCEEDED') throw new HttpError(500, 'RESTORE_FAILED', end.error || 'Restore failed');
                return {};
            } catch (error) {
                // The job removes the upload when it runs; clean up here if it never started.
                if (!res.getHeader('X-Job-Id')) await fsp.rm(uploadDir, { recursive: true, force: true }).catch(() => undefined);
                throw error;
            }
        },
    }),
});
