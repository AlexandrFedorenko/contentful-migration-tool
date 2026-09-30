import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';
import { appendSetCookie, serializeCookie, SESSION_COOKIE } from '@/server/auth/session';
import { BackupService } from '@/utils/backup-service';
import { logger } from '@/utils/logger';

/**
 * DELETE /api/user/delete — delete the account: sessions, tokens, backups (DB rows and
 * files), templates and jobs are removed; activity logs are anonymised.
 */
export default createApiHandler({
    DELETE: route({
        rateLimit: { limit: 3, windowSeconds: 3600 },
        handler: async (_req, res, { user }) => {
            await BackupService.purgeUserFiles(user.id);
            await prisma.$transaction([
                prisma.systemLog.updateMany({ where: { userId: user.id }, data: { userEmail: null } }),
                prisma.user.delete({ where: { id: user.id } }),
            ]);
            await logger.info('ACCOUNT_DELETE', 'Account deleted by its owner', { userId: user.id });
            appendSetCookie(res, serializeCookie(SESSION_COOKIE, '', { maxAgeSeconds: 0 }));
            return { message: 'Account and all data deleted successfully' };
        },
    }),
});
