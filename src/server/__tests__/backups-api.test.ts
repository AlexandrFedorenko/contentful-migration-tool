/**
 * @jest-environment node
 */
import { mockReset, type DeepMockProxy } from 'jest-mock-extended';
import type { PrismaClient } from '@prisma/client';

jest.mock('@/lib/db', () => ({ prisma: jest.requireActual('jest-mock-extended').mockDeep() }));
jest.mock('@/server/auth/session', () => ({ getSessionUser: jest.fn(), clientIp: () => '127.0.0.1' }));
jest.mock('@/server/jobs/queue', () => ({ enqueueJob: jest.fn() }));
jest.mock('@/server/jobs/sse', () => ({ awaitJob: jest.fn() }));

import downloadHandler from '@/pages/api/download-backup';
import backupHandler from '@/pages/api/backup';
import { getSessionUser } from '@/server/auth/session';
import { enqueueJob } from '@/server/jobs/queue';
import { awaitJob } from '@/server/jobs/sse';
import { USER, json, mockRequest } from './helpers';
import { prisma } from '@/lib/db';

const prismaMock = prisma as unknown as DeepMockProxy<PrismaClient>;

const BACKUP_ID = '44444444-4444-4444-8444-444444444444';

describe('/api/download-backup', () => {
    beforeEach(() => {
        mockReset(prismaMock);
        (getSessionUser as jest.Mock).mockResolvedValue(USER);
    });

    it("does not serve another user's backup", async () => {
        prismaMock.backupRecord.findFirst.mockResolvedValue(null);
        const { req, res } = mockRequest({ query: { backupId: BACKUP_ID } });
        await downloadHandler(req, res);
        expect(res._getStatusCode()).toBe(404);
        expect(prismaMock.backupRecord.findFirst.mock.calls[0][0]!.where).toEqual({ id: BACKUP_ID, userId: USER.id });
    });

    it('rejects non-uuid ids', async () => {
        const { req, res } = mockRequest({ query: { backupId: '../../etc/passwd' } });
        await downloadHandler(req, res);
        expect(res._getStatusCode()).toBe(400);
    });

    it('serves legacy inline content as JSON', async () => {
        prismaMock.backupRecord.findFirst.mockResolvedValue({ id: BACKUP_ID, name: 'b.json', storageKey: null, content: { entries: [] }, hasZip: false } as never);
        const { req, res } = mockRequest({ query: { backupId: BACKUP_ID } });
        await downloadHandler(req, res);
        expect(res._getStatusCode()).toBe(200);
        expect(res.getHeader('Content-Disposition')).toBe('attachment; filename="b.json"');
        expect(json(res)).toEqual({ entries: [] });
    });
});

describe('/api/backup', () => {
    beforeEach(() => {
        mockReset(prismaMock);
        (getSessionUser as jest.Mock).mockResolvedValue(USER);
        (enqueueJob as jest.Mock).mockReset().mockResolvedValue('job-1');
        (awaitJob as jest.Mock).mockReset();
    });

    it('answers 409 when the asset backup quota is reached', async () => {
        prismaMock.appSettings.findFirst.mockResolvedValue({ maxBackupsPerUser: 1 } as never);
        prismaMock.backupRecord.count.mockResolvedValue(1);
        const { req, res } = mockRequest({ method: 'POST', body: { spaceId: 'abc', env: 'master', includeAssets: true } });
        await backupHandler(req, res);
        expect(res._getStatusCode()).toBe(409);
        expect(json(res).data.limitReached).toBe(true);
        expect(enqueueJob).not.toHaveBeenCalled();
    });

    it('runs the export as a job and returns its result', async () => {
        (awaitJob as jest.Mock).mockResolvedValue({ status: 'SUCCEEDED', result: { backupId: 'b1', hasZip: false } });
        const { req, res } = mockRequest({ method: 'POST', body: { spaceId: 'abc', env: 'master' } });
        await backupHandler(req, res);
        expect(enqueueJob).toHaveBeenCalledWith(USER.id, 'backup', expect.objectContaining({ spaceId: 'abc', env: 'master', includeDrafts: true }));
        expect(res.getHeader('X-Job-Id')).toBe('job-1');
        expect(json(res)).toEqual({ success: true, data: { backupId: 'b1', hasZip: false } });
    });

    it('reports job failures', async () => {
        (awaitJob as jest.Mock).mockResolvedValue({ status: 'FAILED', error: 'Contentful: Forbidden' });
        const { req, res } = mockRequest({ method: 'POST', body: { spaceId: 'abc', env: 'master' } });
        await backupHandler(req, res);
        expect(res._getStatusCode()).toBe(500);
        expect(json(res).error).toBe('Contentful: Forbidden');
    });
});
