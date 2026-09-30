import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';
import { HttpError, notFound } from '@/server/http-error';
import { logger } from '@/utils/logger';

/** The oldest administrator cannot be demoted or suspended by other admins. */
async function primaryAdminId(): Promise<string | undefined> {
    return (await prisma.user.findFirst({ where: { role: 'ADMIN' }, orderBy: { createdAt: 'asc' }, select: { id: true } }))?.id;
}

export default createApiHandler({
    GET: route({
        auth: 'admin',
        handler: async () => {
            const [users, primaryId] = await Promise.all([
                prisma.user.findMany({
                    orderBy: { createdAt: 'desc' },
                    take: 1000,
                    select: {
                        id: true, email: true, firstName: true, lastName: true, displayName: true, role: true,
                        createdAt: true, lastLoginAt: true, suspendedAt: true,
                        _count: { select: { backups: true, jobs: true, tokens: true } },
                    },
                }),
                primaryAdminId(),
            ]);
            return users.map((u) => ({ ...u, isBanned: Boolean(u.suspendedAt), isPrimaryAdmin: u.id === primaryId }));
        },
    }),
    PUT: route({
        auth: 'admin',
        body: z.discriminatedUnion('action', [
            z.object({ id: z.string().uuid(), action: z.literal('change_role'), role: z.enum(['ADMIN', 'MEMBER']) }),
            z.object({ id: z.string().uuid(), action: z.literal('suspend') }),
            z.object({ id: z.string().uuid(), action: z.literal('unsuspend') }),
        ]),
        handler: async (_req, _res, { user, body }) => {
            const target = await prisma.user.findUnique({ where: { id: body.id }, select: { id: true, email: true } });
            if (!target) throw notFound('User');
            if (target.id === user.id) throw new HttpError(400, 'SELF_MODIFY', 'Cannot modify your own account via this endpoint');
            if (target.id === (await primaryAdminId())) throw new HttpError(403, 'PRIMARY_ADMIN', 'Cannot modify the primary admin account');

            if (body.action === 'change_role') {
                const updated = await prisma.user.update({ where: { id: target.id }, data: { role: body.role }, select: { id: true, role: true } });
                await logger.info('ADMIN_ROLE_CHANGE', `Role of ${target.email} set to ${body.role}`, { targetId: target.id }, user);
                return updated;
            }
            const suspend = body.action === 'suspend';
            await prisma.$transaction([
                prisma.user.update({ where: { id: target.id }, data: { suspendedAt: suspend ? new Date() : null } }),
                ...(suspend ? [prisma.session.deleteMany({ where: { userId: target.id } })] : []),
            ]);
            await logger.info(suspend ? 'ADMIN_SUSPEND' : 'ADMIN_UNSUSPEND', `${target.email} ${suspend ? 'suspended' : 'unsuspended'}`, { targetId: target.id }, user);
            return { message: suspend ? 'User suspended successfully' : 'User unsuspended successfully' };
        },
    }),
});
