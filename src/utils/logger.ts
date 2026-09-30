import { prisma } from '@/lib/db';

const SECRET_KEY = /token|authorization|password|secret|cookie/i;

export type LogLevel = 'INFO' | 'WARN' | 'ERROR';

export const logger = {
    async log(level: LogLevel, action: string, message: string, details?: unknown, user?: { id?: string; email?: string }, logFile?: string) {
        try {
            const safeDetails = details ? JSON.parse(JSON.stringify(details, (key, value) => {
                // Never persist credentials, even if a caller passes them by mistake
                if (SECRET_KEY.test(key)) return '[redacted]';
                if (value instanceof Error) {
                    return { message: value.message, name: value.name };
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
    }
};
