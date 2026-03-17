import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/restore';
import { prisma } from '@/lib/db';
import { BackupService } from '@/utils/backup-service';
import { ContentfulCLI } from '@/utils/contentful-cli';
import { ContentfulManagement } from '@/utils/contentful-management';
import { getAuth } from '@clerk/nextjs/server';
import * as fs from 'fs';

// Mocks
jest.mock('@clerk/nextjs/server', () => ({ getAuth: jest.fn() }));
jest.mock('@/lib/db', () => ({
    prisma: {
        user: { findUnique: jest.fn() },
        appSettings: { findFirst: jest.fn() }
    }
}));
jest.mock('@/lib/encryption', () => ({ decrypt: jest.fn((t) => t) }));
jest.mock('@/utils/backup-service', () => ({ BackupService: { getBackupContent: jest.fn() } }));
jest.mock('@/utils/contentful-cli', () => ({ ContentfulCLI: { restoreBackup: jest.fn() } }));
jest.mock('@/utils/contentful-management', () => ({ ContentfulManagement: { getLocales: jest.fn() } }));
jest.mock('@/utils/logger', () => ({ logger: { info: jest.fn(), error: jest.fn(), captureCliError: jest.fn() } }));
jest.mock('fs', () => ({
    existsSync: jest.fn(),
    mkdirSync: jest.fn(),
    writeFileSync: jest.fn(),
    unlinkSync: jest.fn()
}));
jest.mock('path', () => ({ join: jest.fn((...args) => args.join('/')) }));

// Mock contentful-management createClient for clearEnvironment
const mockEnvironment = {
    getEntries: jest.fn().mockResolvedValue({ items: [] }),
    getAssets: jest.fn().mockResolvedValue({ items: [] }),
    getContentTypes: jest.fn().mockResolvedValue({ items: [] }),
};
const mockSpace = {
    getEnvironment: jest.fn().mockResolvedValue(mockEnvironment)
};
const mockClient = {
    getSpace: jest.fn().mockResolvedValue(mockSpace)
};
jest.mock('contentful-management', () => ({
    createClient: jest.fn(() => mockClient)
}));

describe('API: restore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (fs.existsSync as jest.Mock).mockReturnValue(true); // Assume dir exists by default
        (prisma.appSettings.findFirst as jest.Mock).mockResolvedValue({ maxAssetSizeMB: 1024 });
        (ContentfulManagement.getLocales as jest.Mock).mockResolvedValue([{ code: 'en-US', default: true }]);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        jest.spyOn(global, 'setTimeout').mockImplementation((cb: any) => cb() as any);
        jest.spyOn(console, 'warn').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
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

    it('returns 400 if params are missing', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        const { req, res } = createMocks({
            method: 'POST',
            headers: { 'content-type': 'application/json' }
        });

        // Mock the stream behavior manually for node-mocks-http so getRawBody resolves
        const bodyStr = JSON.stringify({
            spaceId: 's1'
        });
        req.on = jest.fn((event, callback) => {
            if (event === 'data') callback(bodyStr);
            if (event === 'end') callback();
            return req;
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(400);
    });

    it('successfully restores backup', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ contentfulToken: 'CFPAT-123', email: 'test@example.com' });
        (BackupService.getBackupContent as jest.Mock).mockResolvedValue({ entries: [] });
        (ContentfulCLI.restoreBackup as jest.Mock).mockResolvedValue(undefined);

        const { req, res } = createMocks({
            method: 'POST',
            headers: { 'content-type': 'application/json' }
        });

        const bodyStr = JSON.stringify({
            spaceId: 'space1',
            backupId: 'backup1',
            targetEnvironment: 'master'
        });
        req.on = jest.fn((event, callback) => {
            if (event === 'data') callback(bodyStr);
            if (event === 'end') callback();
            return req;
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        expect(BackupService.getBackupContent).toHaveBeenCalledWith('backup1', 'user_123');
        expect(fs.writeFileSync).toHaveBeenCalled(); // Should write temp file
        expect(ContentfulCLI.restoreBackup).toHaveBeenCalled();
        expect(fs.unlinkSync).toHaveBeenCalled(); // Should cleanup
    });

    it('clears environment if requested', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ contentfulToken: 'CFPAT-123' });
        (BackupService.getBackupContent as jest.Mock).mockResolvedValue({});

        // Setup mock items to be deleted
        const mockEntry = { sys: { id: 'mock-1' }, isPublished: () => true, unpublish: jest.fn(), delete: jest.fn() };
        mockEnvironment.getEntries.mockResolvedValueOnce({ items: [mockEntry] });

        const { req, res } = createMocks({
            method: 'POST',
            headers: { 'content-type': 'application/json' }
        });

        const bodyStr = JSON.stringify({
            spaceId: 'space1',
            backupId: 'backup1',
            targetEnvironment: 'master',
            clearEnvironment: true
        });
        req.on = jest.fn((event, callback) => {
            if (event === 'data') callback(bodyStr);
            if (event === 'end') callback();
            return req;
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        // Verify clear logic was triggered
        expect(mockClient.getSpace).toHaveBeenCalledWith('space1');
        expect(mockSpace.getEnvironment).toHaveBeenCalledWith('master');
        expect(mockEnvironment.getEntries).toHaveBeenCalled();
        expect(mockEntry.unpublish).toHaveBeenCalled();
        expect(mockEntry.delete).toHaveBeenCalled();
    });

    it('bails out of clear environment if items cannot be deleted to prevent infinite loop', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ contentfulToken: 'CFPAT-123' });
        (BackupService.getBackupContent as jest.Mock).mockResolvedValue({});

        // Mock an entry that throws an error when attempting to delete
        const mockFailedEntry = { sys: { id: 'mock-fail' }, isPublished: () => false, delete: jest.fn().mockRejectedValue(new Error('Cannot delete')) };

        // It will fetch this item repeatedly
        mockEnvironment.getEntries.mockResolvedValue({ items: [mockFailedEntry] });
        mockEnvironment.getAssets.mockResolvedValue({ items: [] });
        mockEnvironment.getContentTypes.mockResolvedValue({ items: [] });

        const { req, res } = createMocks({
            method: 'POST',
            headers: { 'content-type': 'application/json' }
        });

        const bodyStr = JSON.stringify({
            spaceId: 'space1',
            backupId: 'backup1',
            targetEnvironment: 'master',
            clearEnvironment: true
        });
        req.on = jest.fn((event, callback) => {
            if (event === 'data') callback(bodyStr);
            if (event === 'end') callback();
            return req;
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        // It should try up to 5 times (stuckCount < 5) before giving up and moving on
        // Actually since it's testing Entries, it will be 5 times
        expect(mockEnvironment.getEntries).toHaveBeenCalledTimes(5);
        expect(mockFailedEntry.delete).toHaveBeenCalledTimes(5);
    });

    it('returns 500 and captures error log on failure', async () => {
        const { logger } = require('@/utils/logger');
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', contentfulToken: 'CFPAT-123', email: 'test@example.com' });
        (prisma.appSettings.findFirst as jest.Mock).mockResolvedValue({ maxAssetSizeMB: 1024 });
        (BackupService.getBackupContent as jest.Mock).mockResolvedValue({});
        (ContentfulCLI.restoreBackup as jest.Mock).mockRejectedValue(new Error('CLI Error'));
        (logger.captureCliError as jest.Mock).mockResolvedValue('backups/logs/error.json');

        const { req, res } = createMocks({
            method: 'POST',
            headers: { 'content-type': 'application/json' }
        });

        const bodyStr = JSON.stringify({
            spaceId: 'space1',
            backupId: 'backup1',
            targetEnvironment: 'master'
        });
        req.on = jest.fn((event, callback) => {
            if (event === 'data') callback(bodyStr);
            if (event === 'end') callback();
            return req;
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(500);
        expect(logger.captureCliError).toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalledWith(expect.any(String), expect.any(String), expect.any(Object), expect.any(Object), 'backups/logs/error.json');
        expect(fs.unlinkSync).toHaveBeenCalled();
    });
});
