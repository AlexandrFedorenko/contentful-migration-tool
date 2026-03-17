import { logger } from '../logger';
import { prisma } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';

// Mock Prisma
jest.mock('@/lib/db', () => ({
    prisma: {
        systemLog: {
            create: jest.fn(),
        },
    },
}));

// Mock FS and Path
jest.mock('fs');
jest.mock('path');

describe('logger utility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Default path.join implementation for convenience
        (path.join as jest.Mock).mockImplementation((...args) => args.join('/'));
        (process.cwd as jest.Mock) = jest.fn().mockReturnValue('/app');
    });

    describe('captureCliError', () => {
        it('should return undefined if no error log files exist', async () => {
            (fs.readdirSync as jest.Mock).mockReturnValue(['some-file.txt', 'other.json']);

            const result = await logger.captureCliError();

            expect(result).toBeUndefined();
            expect(fs.renameSync).not.toHaveBeenCalled();
        });

        it('should move the most recent error log and return its new path', async () => {
            const files = [
                'contentful-import-error-log-1.json',
                'contentful-import-error-log-2.json'
            ];
            (fs.readdirSync as jest.Mock).mockReturnValue(files);

            // Mock existsSync: true for files, but false for the logs dir initially
            (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
                if (p === '/app/backups/logs') return false;
                return true;
            });

            // Mock statSync to return different mtimes
            (fs.statSync as jest.Mock).mockImplementation((file: string) => ({
                mtimeMs: file.includes('2') ? 2000 : 1000
            }));

            const result = await logger.captureCliError();

            expect(result).toContain('backups/logs/error-');
            expect(result).toContain('contentful-import-error-log-2.json');
            expect(fs.renameSync).toHaveBeenCalled();
            expect(fs.mkdirSync).toHaveBeenCalledWith('/app/backups/logs', { recursive: true });
        });

        it('should handle errors gracefully', async () => {
            (fs.readdirSync as jest.Mock).mockImplementation(() => {
                throw new Error('Read error');
            });

            const result = await logger.captureCliError();

            expect(result).toBeUndefined();
        });
    });

    describe('logging methods', () => {
        const mockUser = { id: 'user_1', email: 'test@example.com' };

        it('log should call prisma.systemLog.create with all data including logFile', async () => {
            await logger.log('ERROR', 'TEST_ACTION', 'test message', { foo: 'bar' }, mockUser, 'some/path.json');

            expect(prisma.systemLog.create).toHaveBeenCalledWith({
                data: {
                    level: 'ERROR',
                    action: 'TEST_ACTION',
                    message: 'test message',
                    details: { foo: 'bar' },
                    status: 'FAILED',
                    userId: 'user_1',
                    userEmail: 'test@example.com',
                    logFile: 'some/path.json'
                }
            });
        });

        it('info shorthand should call log with correct level', async () => {
            const logSpy = jest.spyOn(logger, 'log');
            await logger.info('ACTION', 'msg', { d: 1 }, mockUser, 'path.json');

            expect(logSpy).toHaveBeenCalledWith('INFO', 'ACTION', 'msg', { d: 1 }, mockUser, 'path.json');
        });

        it('error shorthand should call log with correct level', async () => {
            const logSpy = jest.spyOn(logger, 'log');
            await logger.error('ACTION', 'msg', { d: 1 }, mockUser, 'path.json');

            expect(logSpy).toHaveBeenCalledWith('ERROR', 'ACTION', 'msg', { d: 1 }, mockUser, 'path.json');
        });
    });
});
