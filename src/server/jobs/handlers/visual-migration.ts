import fsp from 'fs/promises';
import path from 'path';
import type { runMigration as runMigrationType } from 'contentful-migration';
import { getActiveToken } from '@/server/contentful/credentials';
import * as storage from '@/server/storage';
import { generateMigrationCode } from '@/utils/code-generator';
import type { MigrationStep } from '@/templates/migration-templates';
import type { JobContext } from '../context';
import type { VisualMigrationParams } from '../schemas';
import { createSafetyBackup, errorText } from './shared';

// Loaded with require(): the package's ESM build does not resolve under Node's ESM loader.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { runMigration }: { runMigration: typeof runMigrationType } = require('contentful-migration');


/**
 * Run Visual Builder steps with the contentful-migration library in-process.
 * Steps were validated against an allow-list and the generator escapes every value,
 * so the executed script contains no user-controlled code.
 */
export async function runVisualMigration(ctx: JobContext<VisualMigrationParams>) {
    const p = ctx.params;
    const token = await getActiveToken(ctx.userId);
    const workDir = await storage.ensureDir(storage.storagePath(...storage.keys.jobDir(ctx.jobId)));

    await ctx.log('Generating migration script from validated steps...');
    const code = generateMigrationCode(p.steps as unknown as MigrationStep[], '');
    const file = path.join(workDir, 'migration.js');
    await fsp.writeFile(file, code, { mode: 0o600 });

    await createSafetyBackup(ctx, token, p.spaceId, p.environmentId, 'pre-visual-migration');
    await ctx.throwIfCancelled();

    await ctx.log(`Running ${p.steps.length} step(s) on ${p.spaceId}/${p.environmentId}...`);
    try {
        await runMigration({
            filePath: file,
            spaceId: p.spaceId,
            environmentId: p.environmentId,
            accessToken: token,
            yes: true,
        });
    } catch (err) {
        const errors = (err as { errors?: Array<{ message?: string; details?: { step?: { type?: string } } }> }).errors;
        for (const e of errors?.slice(0, 10) ?? []) await ctx.log(e.message ?? String(e), 'error');
        throw new Error(`Migration failed: ${errorText(err)}`);
    }

    await ctx.log('Migration completed successfully!', 'success');
    return { steps: p.steps.length };
}
