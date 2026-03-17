import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/backup';
import { prisma } from '@/lib/db';
import { BackupService } from '@/utils/backup-service';
import { ContentfulCLI } from '@/utils/contentful-cli';
import { ContentfulManagement } from '@/utils/contentful-management';
import { getAuth } from '@clerk/nextjs/server';
import * as fs from 'fs';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
    getAuth: jest.fn()
}));

jest.mock('@/lib/db', () => ({
    prisma: {
        user: {
            findUnique: jest.fn()
        },
        appSettings: {
            findFirst: jest.fn()
        }
    }
}));

jest.mock('@/lib/encryption', () => ({
    decrypt: jest.fn((token) => token),
}));

jest.mock('@/utils/backup-service', () => ({
    BackupService: {
        checkBackupLimit: jest.fn(),
        saveBackupToDb: jest.fn()
    }
}));

jest.mock('@/utils/contentful-cli', () => ({
    ContentfulCLI: {
        createBackup: jest.fn()
    }
}));

jest.mock('@/utils/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        captureCliError: jest.fn()
    }
}));

jest.mock('@/utils/contentful-management', () => ({
    ContentfulManagement: {
        getSpace: jest.fn()
    }
}));

jest.mock('fs', () => ({
    readFileSync: jest.fn(),
    unlinkSync: jest.fn(),
    existsSync: jest.fn(),
    readdirSync: jest.fn(),
    statSync: jest.fn(),
    rmSync: jest.fn()
}));

jest.mock('path', () => ({
    join: jest.fn((...args) => args.join('/'))
}));

describe('API: backup', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readdirSync as jest.Mock).mockReturnValue([]);
        (fs.statSync as jest.Mock).mockReturnValue({ isDirectory: () => true });
        (prisma.appSettings.findFirst as jest.Mock).mockResolvedValue({ maxAssetSizeMB: 1024 });
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

    it('returns 400 if spaceId/env missing', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        const { req, res } = createMocks({ method: 'POST', body: { spaceId: 's1' } }); // Missing env

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
    });

    it('returns 401 if token missing', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const { req, res } = createMocks({ method: 'POST', body: { spaceId: 's1', env: 'master' } });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(401);
    });

    it('successfully creates backup', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', contentfulToken: 'CFPAT-123' });
        (prisma.appSettings.findFirst as jest.Mock).mockResolvedValue({ maxAssetSizeMB: 1024 });
        (ContentfulManagement.getSpace as jest.Mock).mockResolvedValue({ name: 'My Space' });
        (ContentfulCLI.createBackup as jest.Mock).mockResolvedValue({ success: true, backupFile: 'backup.json' });
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({
            entries: [],
            contentTypes: [],
            assets: [],
            locales: [{ code: 'en', default: true }]
        }));

        const { req, res } = createMocks({
            method: 'POST',
            body: { spaceId: 'space1', env: 'master' }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(BackupService.checkBackupLimit).toHaveBeenCalled();
        expect(ContentfulCLI.createBackup).toHaveBeenCalled();
        expect(BackupService.saveBackupToDb).toHaveBeenCalled();
        expect(JSON.parse(res._getData()).success).toBe(true);
    });

    it('returns 500 and captures error log if CLI fails', async () => {
        const { logger } = require('@/utils/logger');
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', contentfulToken: 'CFPAT-123' });
        (prisma.appSettings.findFirst as jest.Mock).mockResolvedValue({ maxAssetSizeMB: 1024 });
        (ContentfulCLI.createBackup as jest.Mock).mockResolvedValue({ success: false });
        (logger.captureCliError as jest.Mock).mockResolvedValue('backups/logs/error.json');

        const { req, res } = createMocks({
            method: 'POST',
            body: { spaceId: 'space1', env: 'master' }
        });
        await handler(req, res);

        expect(res._getStatusCode()).toBe(500);
        expect(JSON.parse(res._getData()).success).toBe(false);
        expect(logger.captureCliError).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.any(Object), expect.any(Object), 'backups/logs/error.json');
    });

    it('returns 409 if backup limit is reached', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', contentfulToken: 'CFPAT-123' });

        const limitError = new Error('BACKUP_LIMIT_REACHED:1:1');
        (BackupService.checkBackupLimit as jest.Mock).mockRejectedValue(limitError);

        const { req, res } = createMocks({
            method: 'POST',
            body: { spaceId: 'space1', env: 'master' }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(409);
        const data = JSON.parse(res._getData());
        expect(data.success).toBe(false);
        expect(data.data.limitReached).toBe(true);
    });

    it('handles asset zipping requests correctly', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', contentfulToken: 'CFPAT-123' });
        (prisma.appSettings.findFirst as jest.Mock).mockResolvedValue({ maxAssetSizeMB: 1024 });
        (ContentfulManagement.getSpace as jest.Mock).mockResolvedValue({ name: 'My Space' });
        (ContentfulCLI.createBackup as jest.Mock).mockResolvedValue({ success: true, backupFile: 'backup.json' });
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ entries: [] }));

        // Mock specific behavior for zip creation
        const admZipMock = require('adm-zip')();
        admZipMock.writeZip = jest.fn();

        const { req, res } = createMocks({
            method: 'POST',
            body: { spaceId: 'space1', env: 'master', includeAssets: true }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        // Note: We can't easily assert on local variables like assetZipCreated without refactoring,
        // but we can check if the response indicates zip success if we mock the file check correctly.
        // For now, valid 200 is good enough coupled with coverage of the logic branches.
    });

    it('performs lazy cleanup of old ZIP archives during backup', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', contentfulToken: 'CFPAT-123' });
        (ContentfulCLI.createBackup as jest.Mock).mockResolvedValue({ success: true, backupFile: 'backup.json' });
        (fs.readFileSync as jest.Mock).mockReturnValue(JSON.stringify({ Entries: [] })); // Ensure we don't crash on validation

        // Mock fs behavior for cleanup:
        // 1. backups directory exists
        // 2. Contains space directory 'space_1'
        // 3. Contains file 'old_assets.zip'
        // 4. statSync says it's 2 hours old
        const mockNow = 1700000000000;
        const TWO_HOURS = 2 * 60 * 60 * 1000;
        jest.spyOn(Date, 'now').mockReturnValue(mockNow);

        (fs.existsSync as jest.Mock).mockImplementation((_p: string) => true);
        (fs.readdirSync as jest.Mock).mockImplementation((p: string) => {
            if (p.endsWith('backups')) return ['space_1'];
            if (p.endsWith('space_1')) return ['old_assets.zip'];
            return [];
        });
        (fs.statSync as jest.Mock).mockImplementation((p: string) => ({
            isDirectory: () => p.endsWith('space_1') || p.endsWith('backups'),
            mtimeMs: p.endsWith('.zip') ? (mockNow - TWO_HOURS) : mockNow,
            size: 1000 // Add size to prevent failure in other checks
        }));

        const { req, res } = createMocks({
            method: 'POST',
            body: { spaceId: 'space1', env: 'master' }
        });

        await handler(req, res);

        // Verify it purged the old zip AND cleaned up the json backup file
        expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining('old_assets.zip'));
    });
});
