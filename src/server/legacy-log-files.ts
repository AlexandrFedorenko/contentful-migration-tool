import fsp from 'fs/promises';
import path from 'path';
import { prisma } from '@/lib/db';
import { forbidden, notFound } from '@/server/http-error';
import { resolveInside } from '@/server/validation';

/**
 * Error log files written by the old CLI-based implementation (backups/logs/*.json).
 * New operations keep their log in the database, so this only serves history.
 */
const LOG_DIR = () => path.join(process.cwd(), 'backups', 'logs');

export async function resolveLegacyLogFile(file: string, ownerId?: string): Promise<string> {
    const entry = await prisma.systemLog.findFirst({
        where: { logFile: file, ...(ownerId ? { userId: ownerId } : {}) },
        select: { id: true },
    });
    if (!entry) throw forbidden();
    return resolveInside(LOG_DIR(), path.basename(file));
}

export async function readLegacyLogFile(file: string, ownerId?: string): Promise<string> {
    const full = await resolveLegacyLogFile(file, ownerId);
    try {
        return await fsp.readFile(full, 'utf8');
    } catch {
        throw notFound('Log file');
    }
}

export async function deleteLegacyLogFile(file: string, ownerId?: string): Promise<void> {
    const full = await resolveLegacyLogFile(file, ownerId);
    await fsp.rm(full, { force: true });
}
