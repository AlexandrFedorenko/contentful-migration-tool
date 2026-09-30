import type { JobContext } from '../context';
import type { JobType } from '../definitions';
import { runBackup } from './backup';
import { runLiveSync } from './live-sync';
import { runRestore } from './restore';
import { runVisualMigration } from './visual-migration';

/** Job implementations by type. Imported only by the runner (worker process). */
export const JOB_HANDLERS: Record<JobType, (ctx: JobContext<any>) => Promise<unknown>> = { // eslint-disable-line @typescript-eslint/no-explicit-any
    backup: runBackup,
    restore: runRestore,
    'live-migrate': runLiveSync('migrate'),
    'live-transfer': runLiveSync('transfer'),
    'visual-migration': runVisualMigration,
};
