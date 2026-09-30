import { z } from 'zod';
import { prisma } from '@/lib/db';
import { createApiHandler, route } from '@/server/api';
import { notFound } from '@/server/http-error';

/** DELETE /api/visual-builder/templates/:id — delete one of the user's templates. */
export default createApiHandler({
    DELETE: route({
        query: z.object({ id: z.string().uuid() }),
        handler: async (_req, _res, { user, query }) => {
            const { count } = await prisma.visualBuilderTemplate.deleteMany({ where: { id: query.id, userId: user.id } });
            if (count === 0) throw notFound('Template');
            return { deleted: true };
        },
    }),
});
