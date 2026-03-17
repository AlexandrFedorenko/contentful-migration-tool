import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/backups';
import { BackupService } from '@/utils/backup-service';
import { getAuth } from '@clerk/nextjs/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
    getAuth: jest.fn()
}));

jest.mock('@/utils/backup-service', () => ({
    BackupService: {
        getBackups: jest.fn()
    }
}));

describe('API: backups', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 405 for non-GET methods', async () => {
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

    it('returns 400 if spaceId is missing', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        const { req, res } = createMocks({ method: 'GET', query: {} });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toMatch(/Space ID is required/);
    });

    it('returns 200 and backups on success', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        const mockBackups = [
            { id: 'backup1', filename: 'backup1.json', timestamp: '2023-01-01' }
        ];
        (BackupService.getBackups as jest.Mock).mockResolvedValue(mockBackups);

        const { req, res } = createMocks({ method: 'GET', query: { spaceId: 'space1' } });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.backups).toEqual(mockBackups);
        expect(BackupService.getBackups).toHaveBeenCalledWith('space1', 'user_123');
    });

    it('returns 500 on service error', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (BackupService.getBackups as jest.Mock).mockRejectedValue(new Error('DB Error'));

        const { req, res } = createMocks({ method: 'GET', query: { spaceId: 'space1' } });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(500);
        expect(JSON.parse(res._getData()).error).toMatch(/DB Error/);
    });
});
