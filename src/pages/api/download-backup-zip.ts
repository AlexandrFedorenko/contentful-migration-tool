import archiver from 'archiver';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';
import { notFound } from '@/server/http-error';
import * as storage from '@/server/storage';
import { spaceId } from '@/server/validation';

export const config = { api: { responseLimit: false } };

/** GET /api/download-backup-zip?spaceId=<id>|all — all of the user's backups as one zip, streamed. */
export default createApiHandler({
    GET: route({
        query: z.object({ spaceId: z.union([spaceId, z.literal('all')]) }),
        rateLimit: { limit: 5, windowSeconds: 60 },
        handler: async (_req, res, { user, query }) => {
            const backups = await prisma.backupRecord.findMany({
                where: { userId: user.id, ...(query.spaceId === 'all' ? {} : { spaceId: query.spaceId }) },
                select: { id: true, name: true, spaceId: true, storageKey: true, content: true },
            });
            if (backups.length === 0) throw notFound('Backups');

            res.setHeader('Content-Type', 'application/zip');
            res.setHeader('Content-Disposition', `attachment; filename="backups-${query.spaceId}.zip"`);
            const archive = archiver('zip', { zlib: { level: 6 } });
            archive.pipe(res);
            const used = new Set<string>();
            for (const b of backups) {
                let name = `${b.spaceId}/${b.name.replace(/[^a-zA-Z0-9._-]+/g, '_')}`;
                if (used.has(name)) name = name.replace(/\.json$/, `-${b.id.slice(0, 8)}.json`);
                used.add(name);
                if (b.storageKey) archive.append(storage.createJsonGzReadStream(storage.keys.backup(user.id, b.id)) as never, { name });
                else if (b.content) archive.append(JSON.stringify(b.content), { name });
            }
            await archive.finalize();
        },
    }),
});
