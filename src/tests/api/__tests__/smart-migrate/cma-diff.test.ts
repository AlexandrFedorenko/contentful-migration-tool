import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/smart-migrate/cma-diff';
import { prisma } from '@/lib/db';
import { ContentfulManagement } from '@/utils/contentful-management';
import { getAuth } from '@clerk/nextjs/server';

// Mocks
jest.mock('@clerk/nextjs/server', () => ({ getAuth: jest.fn() }));
jest.mock('@/lib/db', () => ({
    prisma: {
        user: { findUnique: jest.fn() }
    }
}));
jest.mock('@/lib/encryption', () => ({ decrypt: jest.fn((t) => t) }));
jest.mock('@/utils/contentful-management', () => ({
    ContentfulManagement: {
        getClient: jest.fn(),
        getContentTypes: jest.fn(),
        getLocales: jest.fn()
    }
}));
jest.mock('@/utils/dependency-resolver', () => ({
    resolveContentTypeDependencies: jest.fn(() => ({ autoDeps: new Set() }))
}));

// Mock contentful-management client space & env
const mockEnvironmentSrc = {
    getEntries: jest.fn().mockResolvedValue({ total: 10 }),
};
const mockEnvironmentTgt = {
    getEntries: jest.fn().mockResolvedValue({ total: 5 }),
};
const mockSpaceSrc = {
    getEnvironment: jest.fn().mockResolvedValue(mockEnvironmentSrc)
};
const mockSpaceTgt = {
    getEnvironment: jest.fn().mockResolvedValue(mockEnvironmentTgt)
};
const mockClient = {
    getSpace: jest.fn(async (id: string) => {
        if (id === 'space_src') return mockSpaceSrc;
        return mockSpaceTgt;
    })
};

describe('API: smart-migrate/cma-diff', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (ContentfulManagement.getClient as jest.Mock).mockReturnValue(mockClient);

        // Default mocks
        (ContentfulManagement.getContentTypes as jest.Mock).mockResolvedValue([]);
        (ContentfulManagement.getLocales as jest.Mock).mockResolvedValue([
            { code: 'en-US', name: 'English', default: true }
        ]);

        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns 405 for POST methods', async () => {
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

    it('returns 400 if user token is missing', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', contentfulToken: null });
        const { req, res } = createMocks({ method: 'GET' });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(400);
    });

    it('returns 400 if query params are missing', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', contentfulToken: 'CFPAT-123' });
        const { req, res } = createMocks({
            method: 'GET',
            query: { sourceSpaceId: 'space_src' } // Missing other params
        });
        await handler(req, res);
        expect(res._getStatusCode()).toBe(400);
    });

    it('correctly calculates CT differences (New, Modified, Deleted, Equal)', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', contentfulToken: 'CFPAT-123' });

        const srcCTs = [
            { sys: { id: 'ct_equal' }, name: 'Equal', fields: [{ id: 'f1' }] },
            { sys: { id: 'ct_mod' }, name: 'Modified Src', fields: [{ id: 'f1' }, { id: 'f2' }] },
            { sys: { id: 'ct_new' }, name: 'New', fields: [] },
        ];
        const tgtCTs = [
            { sys: { id: 'ct_equal' }, name: 'Equal', fields: [{ id: 'f1' }] },
            { sys: { id: 'ct_mod' }, name: 'Modified Tgt', fields: [{ id: 'f1' }] },
            { sys: { id: 'ct_del' }, name: 'Deleted', fields: [] },
        ];

        (ContentfulManagement.getContentTypes as jest.Mock)
            .mockResolvedValueOnce(srcCTs) // For source
            .mockResolvedValueOnce(tgtCTs); // For target

        const { req, res } = createMocks({
            method: 'GET',
            query: {
                sourceSpaceId: 'space_src', sourceEnvId: 'master',
                targetSpaceId: 'space_tgt', targetEnvId: 'staging'
            }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = res._getJSONData();
        expect(data.success).toBe(true);

        const diffs = data.data.contentTypes;
        expect(diffs).toHaveLength(4); // equal, mod, new, del

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eq = diffs.find((d: any) => d.id === 'ct_equal');
        expect(eq.diffStatus).toBe('EQUAL');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod = diffs.find((d: any) => d.id === 'ct_mod');
        expect(mod.diffStatus).toBe('MODIFIED');
        expect(mod.changedFields).toContain('~metadata'); // Name changed
        expect(mod.changedFields).toContain('+f2'); // Added field

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const added = diffs.find((d: any) => d.id === 'ct_new');
        expect(added.diffStatus).toBe('NEW');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const del = diffs.find((d: any) => d.id === 'ct_del');
        expect(del.diffStatus).toBe('DELETED');

        // Check entry totals
        expect(mod.totalSourceEntries).toBe(10);
        expect(mod.totalTargetEntries).toBe(5);
    });

    it('correctly compares Locales', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', contentfulToken: 'CFPAT-123' });

        (ContentfulManagement.getLocales as jest.Mock)
            .mockResolvedValueOnce([{ code: 'en-US', name: 'English' }, { code: 'fr-FR', name: 'French' }])
            .mockResolvedValueOnce([{ code: 'en-US', name: 'English' }, { code: 'de-DE', name: 'German' }]);

        const { req, res } = createMocks({
            method: 'GET',
            query: {
                sourceSpaceId: 'space_src', sourceEnvId: 'master',
                targetSpaceId: 'space_tgt', targetEnvId: 'staging'
            }
        });

        await handler(req, res);
        expect(res._getStatusCode()).toBe(200);

        const locs = res._getJSONData().data.locales;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(locs.find((l: any) => l.code === 'en-US').diffStatus).toBe('EQUAL');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(locs.find((l: any) => l.code === 'fr-FR').diffStatus).toBe('NEW');
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        expect(locs.find((l: any) => l.code === 'de-DE').diffStatus).toBe('DELETED');
    });
});
