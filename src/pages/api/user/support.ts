import fsp from 'fs/promises';
import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';
import { badRequest } from '@/server/http-error';
import * as storage from '@/server/storage';

export const config = { api: { bodyParser: { sizeLimit: '8mb' } } };

const MAX_SCREENSHOT_BYTES = 5 * 1024 * 1024;
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47]);
const JPEG = Buffer.from([0xff, 0xd8, 0xff]);

/** POST /api/user/support — create a support ticket with an optional PNG/JPEG screenshot. */
export default createApiHandler({
    POST: route({
        body: z.object({
            message: z.string().trim().min(1).max(5000),
            email: z.string().trim().email().max(200),
            name: z.string().trim().max(100).optional(),
            screenshot: z.string().max(8 * 1024 * 1024).optional(),
        }),
        rateLimit: { limit: 5, windowSeconds: 3600 },
        handler: async (_req, res, { user, body }) => {
            let image: { data: Buffer; ext: 'png' | 'jpg' } | null = null;
            if (body.screenshot) {
                const match = body.screenshot.match(/^data:image\/(png|jpe?g);base64,([A-Za-z0-9+/=]+)$/);
                if (!match) throw badRequest('Only PNG and JPEG screenshots are allowed');
                const data = Buffer.from(match[2], 'base64');
                const isPng = data.subarray(0, 4).equals(PNG);
                const isJpeg = data.subarray(0, 3).equals(JPEG);
                if (data.length > MAX_SCREENSHOT_BYTES || (!isPng && !isJpeg)) throw badRequest('Invalid screenshot');
                image = { data, ext: isPng ? 'png' : 'jpg' };
            }

            const ticket = await prisma.supportRequest.create({
                data: { userId: user.id, email: body.email, name: body.name || null, message: body.message, status: 'OPEN' },
            });
            if (image) {
                const segments = ['support', `${ticket.id}.${image.ext}`];
                const file = storage.storagePath(...segments);
                await storage.ensureDir(storage.storagePath('support'));
                await fsp.writeFile(file, image.data, { mode: 0o640 });
                await prisma.supportRequest.update({ where: { id: ticket.id }, data: { screenshotUrl: `/api/support/screenshot?id=${ticket.id}` } });
            }
            res.status(201);
            return prisma.supportRequest.findUnique({ where: { id: ticket.id } });
        },
    }),
});
