import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/admin/error-log';
import { prisma } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';
import * as fs from 'fs';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
    getAuth: jest.fn(() => ({ userId: null }))
}));

jest.mock('@/lib/db', () => ({
    prisma: {
        user: {
            findUnique: jest.fn()
        }
    }
}));

jest.mock('fs');

describe('API: admin/error-log', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 405 for non-GET/DELETE methods', async () => {
        const { req, res } = createMocks({ method: 'POST' });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(405);
    });

    it('returns 401 if not authenticated', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: null });
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(401);
    });

    it('returns 403 if not an admin', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'u1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'MEMBER' });

        const { req, res } = createMocks({ method: 'GET' });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(403);
    });

    describe('GET method', () => {
        it('returns file content if path is safe and exists', async () => {
            (getAuth as jest.Mock).mockReturnValue({ userId: 'u1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN' });
            (fs.existsSync as jest.Mock).mockReturnValue(true);
            (fs.readFileSync as jest.Mock).mockReturnValue('{"error": "some cli error"}');

            const { req, res } = createMocks({
                method: 'GET',
                query: { file: 'backups/logs/error-123.json' }
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(200);
            expect(JSON.parse(res._getData()).content).toBe('{"error": "some cli error"}');
        });

        it('returns 403 if directory traversal attempted', async () => {
            (getAuth as jest.Mock).mockReturnValue({ userId: 'u1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN' });

            const { req, res } = createMocks({
                method: 'GET',
                query: { file: '../../etc/passwd' }
            });

            await handler(req, res);
            expect(res._getStatusCode()).toBe(403);
        });
    });

    describe('DELETE method', () => {
        it('deletes file if path is safe', async () => {
            (getAuth as jest.Mock).mockReturnValue({ userId: 'u1' });
            (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN' });
            (fs.existsSync as jest.Mock).mockReturnValue(true);

            const { req, res } = createMocks({
                method: 'DELETE',
                query: { file: 'backups/logs/error-123.json' }
            });

            await handler(req, res);

            expect(res._getStatusCode()).toBe(200);
            expect(fs.unlinkSync).toHaveBeenCalled();
        });
    });
});
