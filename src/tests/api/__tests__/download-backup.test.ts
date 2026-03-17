import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/download-backup';
import { BackupService } from '@/utils/backup-service';
import { getAuth } from '@clerk/nextjs/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
    getAuth: jest.fn()
}));

jest.mock('@/utils/backup-service', () => ({
    BackupService: {
        getBackupContent: jest.fn()
    }
}));

describe('API: download-backup', () => {
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

    it('returns 400 if backupId is missing', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        const { req, res } = createMocks({ method: 'GET', query: {} });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toMatch(/Backup ID is required/);
    });

    it('returns 200 and correct headers on success', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        const mockContent = { some: 'json content' };
        (BackupService.getBackupContent as jest.Mock).mockResolvedValue(mockContent);

        const { req, res } = createMocks({
            method: 'GET',
            query: { backupId: 'backup_1', fileName: 'custom.json' }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(res.getHeader('Content-Type')).toBe('application/json');
        expect(res.getHeader('Content-Disposition')).toContain('filename="custom.json"');

        // Check body is the JSON string
        const body = res._getData();
        expect(JSON.parse(body)).toEqual(mockContent);

        expect(BackupService.getBackupContent).toHaveBeenCalledWith('backup_1', 'user_123');
    });

    it('returns 500 on service error', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (BackupService.getBackupContent as jest.Mock).mockRejectedValue(new Error('File not found'));

        const { req, res } = createMocks({
            method: 'GET',
            query: { backupId: 'backup_1' }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(500);
        expect(JSON.parse(res._getData()).error).toMatch(/File not found/);
    });
});
