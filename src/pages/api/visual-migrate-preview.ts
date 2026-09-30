import { z } from 'zod';
import { createApiHandler, route } from '@/server/api';
import { getActiveToken } from '@/server/contentful/credentials';
import { environmentId, spaceId } from '@/server/validation';
import { MigrationStepsSchema } from '@/server/visual-migration';
import { ContentfulManagement } from '@/utils/contentful-management';

const Body = z.object({
    spaceId,
    targetEnv: environmentId,
    contentType: z.string().optional(),
    steps: z.unknown(),
});

/**
 * POST /api/visual-migrate-preview
 * Dry run: validates the steps exactly like execution would and counts the entries
 * that data transformations will touch.
 */
export default createApiHandler({
    POST: route({
        body: Body,
        rateLimit: { limit: 30, windowSeconds: 60 },
        handler: async (_req, _res, { user, body }) => {
            const parsed = MigrationStepsSchema.safeParse(body.steps);
            if (!parsed.success) {
                return {
                    valid: false,
                    error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
                    warnings: [],
                };
            }
            const steps = parsed.data;
            const warnings: string[] = [];
            if (steps.some((s) => s.operation === 'deleteContentType' || s.operation === 'deleteField')) {
                warnings.push('This migration deletes content model elements. Data in them will be lost.');
            }

            const transformCts = new Set(steps.filter((s) => s.type === 'transformation').map((s) => String(s.params.contentType)));
            let affectedEntries = 0;
            if (transformCts.size > 0) {
                const token = await getActiveToken(user.id);
                const env = await (await ContentfulManagement.getClient(token).getSpace(body.spaceId)).getEnvironment(body.targetEnv);
                for (const ct of transformCts) {
                    try {
                        affectedEntries += (await env.getEntries({ content_type: ct, limit: 0 })).total;
                    } catch {
                        warnings.push(`Content type "${ct}" was not found in ${body.targetEnv}.`);
                    }
                }
            }

            return {
                valid: true,
                affectedEntries,
                estimatedTime: `${Math.max(1, Math.ceil(affectedEntries / 5))} seconds`,
                warnings,
            };
        },
    }),
});
