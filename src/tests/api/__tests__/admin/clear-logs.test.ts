import { createMocks } from 'node-mocks-http';
import { getAuth } from '@clerk/nextjs/server';
import * as fs from 'fs';

var mockPrisma = {
    user: {
        findUnique: jest.fn()
    },
    systemLog: {
        findMany: jest.fn(),
        deleteMany: jest.fn()
    }
};

jest.mock('@clerk/nextjs/server', () => ({
    getAuth: jest.fn(() => ({ userId: null }))
}));

jest.mock('@prisma/client', () => ({
    PrismaClient: jest.fn().mockImplementation(() => mockPrisma),
    Prisma: {}
}));

jest.mock('fs');
jest.mock('path', () => ({
    join: jest.fn((...args) => args.join('/'))
}));

const handler = require('@/pages/api/admin/clear-logs').default;

describe('API: admin/clear-logs', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 405 for non-POST methods', async () => {
        const { req, res } = createMocks({ method: 'GET' });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(405);
    });

    it('returns 401 if not authenticated', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: null });
        const { req, res } = createMocks({ method: 'POST' });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(401);
    });

    it('returns 403 if user is not an admin', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_1' });
        mockPrisma.user.findUnique.mockResolvedValue({ role: 'MEMBER' });
        const { req, res } = createMocks({ method: 'POST' });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(403);
    });

    it('accepts 3m retention and clears matching logs', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'admin_1' });
        mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
        mockPrisma.systemLog.findMany.mockResolvedValue([
            { logFile: 'logs/error-1.json' }
        ]);
        mockPrisma.systemLog.deleteMany.mockResolvedValue({ count: 4 });

        const { req, res } = createMocks({
            method: 'POST',
            body: { retention: '3m' }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(mockPrisma.systemLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
            where: expect.objectContaining({
                logFile: { not: null },
                timestamp: expect.objectContaining({ lt: expect.any(Date) })
            }),
            select: { logFile: true }
        }));
        expect(mockPrisma.systemLog.deleteMany).toHaveBeenCalledWith({
            where: expect.objectContaining({
                timestamp: expect.objectContaining({ lt: expect.any(Date) })
            })
        });
        expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining('logs/error-1.json'), { force: true });

        const data = JSON.parse(res._getData());
        expect(data.success).toBe(true);
        expect(data.data.count).toBe(4);
    });

    it('rejects unsupported retention values', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'admin_1' });
        mockPrisma.user.findUnique.mockResolvedValue({ role: 'ADMIN' });
        const { req, res } = createMocks({
            method: 'POST',
            body: { retention: '2m' }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData())).toEqual({
            success: false,
            error: 'Invalid retention policy'
        });
    });
});