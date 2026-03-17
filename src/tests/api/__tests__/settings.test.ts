import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/settings';
import { prisma } from '@/lib/db';
import { getAuth } from '@clerk/nextjs/server';

jest.mock('@clerk/nextjs/server', () => ({
    getAuth: jest.fn()
}));

jest.mock('@/lib/db', () => ({
    prisma: {
        user: {
            findUnique: jest.fn()
        },
        appSettings: {
            findFirst: jest.fn(),
            upsert: jest.fn()
        }
    }
}));

describe('API: settings', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('GET: returns settings', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'u1' });
        (prisma.appSettings.findFirst as jest.Mock).mockResolvedValue({
            maxAssetSizeMB: 500
        });

        const { req, res } = createMocks({ method: 'GET' });
        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData()).data.maxAssetSizeMB).toBe(500);
    });

    it('POST: updates settings if admin', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'u1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'ADMIN', email: 'admin@test.com' });

        const { req, res } = createMocks({
            method: 'POST',
            body: { maxAssetSizeMB: 2048 }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(prisma.appSettings.upsert).toHaveBeenCalledWith(expect.objectContaining({
            update: expect.objectContaining({ maxAssetSizeMB: 2048 })
        }));
    });

    it('POST: returns 403 for non-admins', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'u1' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ role: 'MEMBER' });

        const { req, res } = createMocks({
            method: 'POST',
            body: { maxAssetSizeMB: 2048 }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(403);
    });
});
