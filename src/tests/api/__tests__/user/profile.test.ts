import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/user/profile';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { BackupService } from '@/utils/backup-service';

jest.mock('@clerk/nextjs/server', () => ({
    getAuth: jest.fn(),
    clerkClient: jest.fn()
}));

jest.mock('@/lib/db', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
            update: jest.fn()
        },
        systemLog: {
            count: jest.fn()
        }
    }
}));

jest.mock('@/lib/encryption', () => ({
    encrypt: jest.fn((value: string) => `encrypted:${value}`)
}));

jest.mock('@/utils/backup-service', () => ({
    BackupService: {
        getTotalBackupsCount: jest.fn()
    }
}));

describe('API: user/profile', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_1' });
    });

    it('returns 401 when unauthenticated', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: null });

        const { req, res } = createMocks({ method: 'GET' });
        await handler(req, res);

        expect(res._getStatusCode()).toBe(401);
    });

    it('returns profile data even if Clerk sync fails', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            id: 'db_1',
            clerkId: 'user_1',
            email: 'local@example.com',
            role: 'ADMIN',
            displayName: 'Local User',
            contentfulToken: 'token',
            createdAt: new Date('2026-01-01T00:00:00.000Z')
        });
        (clerkClient as jest.Mock).mockRejectedValue(new Error('Clerk unavailable'));
        (prisma.systemLog.count as jest.Mock).mockResolvedValue(0);
        (BackupService.getTotalBackupsCount as jest.Mock).mockResolvedValue(2);

        const { req, res } = createMocks({ method: 'GET', query: { range: '7d' } });
        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toMatchObject({
            role: 'ADMIN',
            displayName: 'Local User',
            isContentfulTokenSet: true,
            backupCount: 2,
            stats: {
                totalActions: 0,
                successRate: 100
            }
        });
    });

    it('returns safe fallback stats if backup or log aggregation fails', async () => {
        const existingUser = {
            id: 'db_1',
            clerkId: 'user_1',
            email: 'local@example.com',
            role: 'MEMBER',
            displayName: 'Local User',
            contentfulToken: null,
            createdAt: new Date('2026-01-01T00:00:00.000Z')
        };

        (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);
        (clerkClient as jest.Mock).mockResolvedValue({
            users: {
                getUser: jest.fn().mockResolvedValue({
                    firstName: 'Test',
                    lastName: 'User',
                    primaryEmailAddressId: 'email_1',
                    emailAddresses: [{ id: 'email_1', emailAddress: 'test@example.com' }]
                })
            }
        });
        (prisma.user.update as jest.Mock).mockResolvedValue({
            ...existingUser,
            email: 'test@example.com',
            firstName: 'Test',
            lastName: 'User'
        });
        (prisma.systemLog.count as jest.Mock).mockRejectedValue(new Error('Stats failed'));
        (BackupService.getTotalBackupsCount as jest.Mock).mockRejectedValue(new Error('Backups failed'));

        const { req, res } = createMocks({ method: 'GET', query: { range: '7d' } });
        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(JSON.parse(res._getData())).toMatchObject({
            role: 'MEMBER',
            backupCount: 0,
            stats: {
                activity: [],
                totalActions: 0,
                successRate: 100
            }
        });
    });
});