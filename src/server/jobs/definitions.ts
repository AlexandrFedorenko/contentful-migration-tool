import type { ZodType } from 'zod';
import { BackupParams, LiveSyncParams, RestoreParams, VisualMigrationParams } from './schemas';

/**
 * Job types: validation, locking and wire format. The implementations live in
 * ./handlers and are only loaded by the worker (see runner.ts).
 */

export interface JobDefinition<P = any> { // eslint-disable-line @typescript-eslint/no-explicit-any
    title: string;
    schema: ZodType<P>;
    /** Exclusive lock key: at most one job per key runs at a time (e.g. per target environment). */
    lockKey?: (params: P) => string | null;
    /** Shape of progress lines on the wire, matching what each UI screen already parses. */
    formatLog?: (message: string, level: 'info' | 'error' | 'success') => unknown;
    /** Final event sent when the job fails, in the screen's wire format. */
    formatError?: (message: string) => unknown;
}

const envLock = (space: string, env: string) => `env:${space}:${env}`;

/** SSE format used by Smart Migration / Smart Restore: { type: 'log' | 'done' | 'error', payload } */
const typedLog = (message: string) => ({ type: 'log', payload: message });
const typedError = (message: string) => ({ type: 'error', payload: message });

/** SSE format used by the Visual Builder: { message, type: 'info' | 'error' | 'success' } */
const plainLog = (message: string, level: 'info' | 'error' | 'success') => ({ message, type: level });

export const JOBS = {
    backup: {
        title: 'Backup',
        schema: BackupParams,
        formatLog: plainLog,
    } satisfies JobDefinition<BackupParams>,

    restore: {
        title: 'Restore',
        schema: RestoreParams,
        lockKey: (p) => envLock(p.spaceId, p.targetEnvironment),
        formatLog: plainLog,
    } satisfies JobDefinition<RestoreParams>,

    'live-migrate': {
        title: 'Smart migration',
        schema: LiveSyncParams,
        lockKey: (p) => envLock(p.targetSpaceId, p.targetEnvironmentId),
        formatLog: typedLog,
        formatError: typedError,
    } satisfies JobDefinition<LiveSyncParams>,

    'live-transfer': {
        title: 'Live transfer',
        schema: LiveSyncParams,
        lockKey: (p) => envLock(p.targetSpaceId, p.targetEnvironmentId),
        formatLog: typedLog,
        formatError: typedError,
    } satisfies JobDefinition<LiveSyncParams>,

    'visual-migration': {
        title: 'Visual migration',
        schema: VisualMigrationParams,
        lockKey: (p) => envLock(p.spaceId, p.environmentId),
        formatLog: plainLog,
    } satisfies JobDefinition<VisualMigrationParams>,
} as const;

export type JobType = keyof typeof JOBS;

export function isJobType(value: string): value is JobType {
    return Object.prototype.hasOwnProperty.call(JOBS, value);
}

export function getJobDefinition(type: string): JobDefinition {
    if (!isJobType(type)) throw new Error(`Unknown job type: ${type}`);
    return JOBS[type] as JobDefinition;
}
