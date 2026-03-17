import { prisma } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export const logger = {
    async log(level: LogLevel, action: string, message: string, details?: unknown, user?: { id?: string; email?: string }, logFile?: string) {
        try {
            const safeDetails = details ? JSON.parse(JSON.stringify(details, (key, value) => {
                if (value instanceof Error) {
                    return { message: value.message, name: value.name, stack: value.stack };
                }
                return value;
            })) : undefined;

            await prisma.systemLog.create({
                data: {
                    level,
                    action,
                    message,
                    details: safeDetails,
                    status: level === 'ERROR' ? 'FAILED' : 'SUCCESS',
                    userId: user?.id,
                    userEmail: user?.email,
                    logFile
                }
            });
        } catch (error) {
            console.error('Failed to write system log:', error);
        }
    },

    async info(action: string, message: string, details?: unknown, user?: { id?: string; email?: string }, logFile?: string) {
        return this.log('INFO', action, message, details, user, logFile);
    },

    async warn(action: string, message: string, details?: unknown, user?: { id?: string; email?: string }, logFile?: string) {
        return this.log('WARN', action, message, details, user, logFile);
    },

    async error(action: string, message: string, details?: unknown, user?: { id?: string; email?: string }, logFile?: string) {
        return this.log('ERROR', action, message, details, user, logFile);
    },

    /**
     * Scans cwd for any contentful-import-error-log*.json files,
     * reads their content into memory, deletes the files from disk,
     * and returns the parsed JSON content (to be stored in DB).
     *
     * Returns undefined if no log file was found.
     */
    async captureCliError(): Promise<string | undefined> {
        try {
            const logsDir = path.join(process.cwd(), 'backups', 'logs');
            if (!fs.existsSync(logsDir)) return undefined;
            const files = fs.readdirSync(logsDir);

            const logFiles = files
                .filter(f => f.startsWith('contentful-import-error-log') && f.endsWith('.json'))
                .sort((a, b) =>
                    fs.statSync(path.join(logsDir, b)).mtimeMs -
                    fs.statSync(path.join(logsDir, a)).mtimeMs
                );

            if (logFiles.length === 0) return undefined;

            // Read all error log files and combine their content
            const allContent: unknown[] = [];
            for (const logFile of logFiles) {
                const filePath = path.join(logsDir, logFile);
                try {
                    const raw = fs.readFileSync(filePath, 'utf8');
                    const parsed = JSON.parse(raw);
                    allContent.push({ file: logFile, content: parsed });
                } catch {
                    allContent.push({ file: logFile, content: 'Failed to parse' });
                } finally {
                    // Always delete the file regardless of parse success
                    try { fs.unlinkSync(filePath); } catch { /* ignore */ }
                }
            }

            // Return the combined content as a JSON string to store in DB
            return JSON.stringify(allContent.length === 1 ? allContent[0] : allContent, null, 2);
        } catch (e) {
            console.error('Failed to capture CLI error log:', e);
        }
        return undefined;
    }
};

