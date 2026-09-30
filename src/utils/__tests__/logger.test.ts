import { logger } from '../logger';
import { prisma } from '@/lib/db';

// Mock Prisma
jest.mock('@/lib/db', () => ({
    prisma: {
        systemLog: {
            create: jest.fn(),
        },
    },
}));

describe('logger utility', () => {
    beforeEach(() => {
        jest.clearAllMocks();
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

        it('redacts secrets from details', async () => {
            await logger.info('ACTION', 'msg', { token: 'CFPAT-secret', nested: { authorization: 'Bearer x', ok: 1 } });
            const details = (prisma.systemLog.create as jest.Mock).mock.calls[0][0].data.details;
            expect(details).toEqual({ token: '[redacted]', nested: { authorization: '[redacted]', ok: 1 } });
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
