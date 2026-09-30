import { createApiHandler, route } from '@/server/api';
import { destroySession } from '@/server/auth/session';

/** POST /api/auth/logout — ends the current session. */
export default createApiHandler({
    POST: route({
        auth: 'public',
        handler: async (req, res) => {
            await destroySession(req, res);
            return { ok: true };
        },
    }),
});
