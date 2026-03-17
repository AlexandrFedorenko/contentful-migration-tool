import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/admin/force-cleanup';
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
jest.mock('path', () => ({
    join: jest.fn((...args) => args.join('/')),
    resolve: jest.fn((...args) => args.join('/')),
    basename: jest.fn((p) => p.split('/').pop()),
    dirname: jest.fn((p) => p.split('/').slice(0, -1).join('/'))
}));

jest.mock('@/utils/logger', () => ({
    logger: {
        info: jest.fn().mockResolvedValue({})
    }
}));

describe('API: admin/force-cleanup', () => {
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
        (getAuth as jest.Mock).mockReturnValue({ userId: 'u1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'MEMBER' });

        const { req, res } = createMocks({ method: 'POST' });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(403);
    });

    it('performs full cleanup if user is admin', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'admin_1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'id_1',
            role: 'ADMIN',
            email: 'admin@test.com'
        });

        // Mock fs behavior: 
        // 1. images.ctfassets.net exists
        // 2. backups dir exists
        // 3. One space dir exists
        // 4. One zip file exists in that space dir
        (fs.existsSync as jest.Mock).mockImplementation((p: string) => {
            if (p.includes('images.ctfassets.net')) return true;
            if (p.includes('backups')) return true;
            return true;
        });

        (fs.readdirSync as jest.Mock).mockImplementation((p: string) => {
            if (p.endsWith('backups')) return ['space_1', 'some_file.txt'];
            if (p.endsWith('space_1')) return ['backup.json', 'assets.zip'];
            return [];
        });

        (fs.statSync as jest.Mock).mockImplementation((p: string) => ({
            isDirectory: () => p.endsWith('space_1') || p.endsWith('backups')
        }));

        const { req, res } = createMocks({ method: 'POST' });
        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.success).toBe(true);
        expect(data.data.stats.foldersDeleted).toBe(1); // images.ctfassets.net
        expect(data.data.stats.filesDeleted).toBe(1); // assets.zip

        // Verify deletions
        expect(fs.rmSync).toHaveBeenCalledWith(expect.stringContaining('images.ctfassets.net'), expect.any(Object));
        expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('assets.zip'));
    });

    it('handles missing directories gracefully', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'admin_1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN' });

        (fs.existsSync as jest.Mock).mockReturnValue(false);

        const { req, res } = createMocks({ method: 'POST' });
        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.data.stats.foldersDeleted).toBe(0);
        expect(data.data.stats.filesDeleted).toBe(0);
    });
});
