import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import zlib from 'zlib';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';
import { getEnv } from '@/server/env';
import { resolveInside } from '@/server/validation';

/**
 * File storage rooted at DATA_DIR (a volume shared by web and worker containers).
 *
 *   backups/<userId>/<backupId>.json.gz   gzipped Contentful export
 *   archives/<userId>/<backupId>.zip      optional asset archive
 *   uploads/<userId>/<uploadId>/...       files uploaded for restore, removed after the job
 *   jobs/<jobId>/...                      per-job scratch space, removed after the job
 *
 * Every key is resolved with resolveInside() so a crafted id can never escape DATA_DIR,
 * and every path contains the owner's user id so users can never see each other's files.
 */

export function dataRoot(): string {
    return path.resolve(getEnv().DATA_DIR);
}

export function storagePath(...segments: string[]): string {
    return resolveInside(dataRoot(), ...segments);
}

export async function ensureDir(dir: string): Promise<string> {
    await fsp.mkdir(dir, { recursive: true, mode: 0o750 });
    return dir;
}

export const keys = {
    backup: (userId: string, backupId: string) => ['backups', userId, `${backupId}.json.gz`],
    archive: (userId: string, backupId: string) => ['archives', userId, `${backupId}.zip`],
    uploadDir: (userId: string) => ['uploads', userId],
    jobDir: (jobId: string) => ['jobs', jobId],
};

/** Write a JSON document gzipped. Returns the size on disk in bytes. */
export async function writeJsonGz(segments: string[], value: unknown): Promise<number> {
    const file = storagePath(...segments);
    await ensureDir(path.dirname(file));
    const tmp = `${file}.${process.pid}.tmp`;
    await pipeline(Readable.from([JSON.stringify(value)]), zlib.createGzip({ level: 6 }), fs.createWriteStream(tmp, { mode: 0o640 }));
    await fsp.rename(tmp, file);
    return (await fsp.stat(file)).size;
}

export async function readJsonGz<T = unknown>(segments: string[]): Promise<T> {
    const file = storagePath(...segments);
    const buf = await fsp.readFile(file);
    return JSON.parse(zlib.gunzipSync(buf).toString('utf8')) as T;
}

/** Stream a gzipped JSON document as plain JSON (for downloads). */
export function createJsonGzReadStream(segments: string[]): NodeJS.ReadableStream {
    return fs.createReadStream(storagePath(...segments)).pipe(zlib.createGunzip());
}

export function createReadStream(segments: string[]): fs.ReadStream {
    return fs.createReadStream(storagePath(...segments));
}

export async function exists(segments: string[]): Promise<boolean> {
    try {
        await fsp.access(storagePath(...segments));
        return true;
    } catch {
        return false;
    }
}

export async function fileSize(segments: string[]): Promise<number | null> {
    try {
        return (await fsp.stat(storagePath(...segments))).size;
    } catch {
        return null;
    }
}

export async function remove(segments: string[]): Promise<void> {
    await fsp.rm(storagePath(...segments), { recursive: true, force: true });
}

export async function moveInto(src: string, segments: string[]): Promise<void> {
    const dest = storagePath(...segments);
    await ensureDir(path.dirname(dest));
    try {
        await fsp.rename(src, dest);
    } catch (err) {
        if ((err as NodeJS.ErrnoException).code !== 'EXDEV') throw err;
        await fsp.copyFile(src, dest);
        await fsp.rm(src, { force: true });
    }
}

/** Delete files in a directory older than maxAgeMs (used by the cleanup job). */
export async function purgeOlderThan(segments: string[], maxAgeMs: number): Promise<number> {
    const dir = storagePath(...segments);
    let removed = 0;
    let entries: fs.Dirent[];
    try {
        entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
        return 0;
    }
    const cutoff = Date.now() - maxAgeMs;
    for (const entry of entries) {
        const full = path.join(dir, entry.name);
        const stat = await fsp.stat(full).catch(() => null);
        if (stat && stat.mtimeMs < cutoff) {
            await fsp.rm(full, { recursive: true, force: true });
            removed++;
        }
    }
    return removed;
}
