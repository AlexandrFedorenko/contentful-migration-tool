import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/smart-migrate/diff-entries';
import { prisma } from '@/lib/db';
import { ContentfulManagement } from '@/utils/contentful-management';
import { getAuth } from '@clerk/nextjs/server';

// Mocks
jest.mock('@clerk/nextjs/server', () => ({ getAuth: jest.fn() }));
jest.mock('@/lib/db', () => ({
    prisma: { user: { findUnique: jest.fn() } }
}));
jest.mock('@/lib/encryption', () => ({ decrypt: jest.fn((t) => t) }));
jest.mock('@/utils/contentful-management', () => ({
    ContentfulManagement: { getClient: jest.fn() }
}));

const mockEnvironmentSrc = {
    getContentType: jest.fn(),
    getEntries: jest.fn(),
    getAssets: jest.fn(),
};

const mockEnvironmentTgt = {
    getEntries: jest.fn(),
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

describe('API: smart-migrate/diff-entries', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        (ContentfulManagement.getClient as jest.Mock).mockReturnValue(mockClient);

        mockEnvironmentSrc.getContentType.mockResolvedValue({ sys: { id: 'blogPost' }, displayField: 'title' });

        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('returns 400 if required query params are missing', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', contentfulToken: 'CFPAT-123' });

        const { req, res } = createMocks({
            method: 'GET',
            query: { sourceSpaceId: 'space_src' } // missing content_type etc
        });

        await handler(req, res);
        expect(res._getStatusCode()).toBe(400);
    });

    it('correctly compares entries and detects NEW/MODIFIED/EQUAL', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', contentfulToken: 'CFPAT-123' });

        // Source has three entries
        const srcEntries = [
            { sys: { id: 'e_equal', version: 1, updatedAt: '2023-01-01', publishedVersion: 1 }, fields: { title: { 'en-US': 'Equal' }, val: { 'en-US': 1 } } },
            { sys: { id: 'e_mod', version: 2, updatedAt: '2023-01-01', publishedVersion: 1 }, fields: { title: { 'en-US': 'Modified' }, val: { 'en-US': 2 } } },
            { sys: { id: 'e_new', version: 1, updatedAt: '2023-01-01', publishedVersion: 1 }, fields: { title: { 'en-US': 'New' }, val: { 'en-US': 3 } } },
        ];

        // Target has equal and modified. New is missing.
        const tgtEntries = [
            { sys: { id: 'e_equal', version: 1, updatedAt: '2023-01-01', publishedVersion: 1 }, fields: { title: { 'en-US': 'Equal' }, val: { 'en-US': 1 } } },
            { sys: { id: 'e_mod', version: 1, updatedAt: '2023-01-01', publishedVersion: 1 }, fields: { title: { 'en-US': 'Modified' }, val: { 'en-US': 99 } } }, // field 'val' differs
        ];

        // First call is pagination fetch
        // Second call is resolving specific IDs
        mockEnvironmentSrc.getEntries.mockResolvedValueOnce({ items: srcEntries });

        mockEnvironmentTgt.getEntries
            .mockResolvedValueOnce({ items: [] }) // initial batch fetch (ignored by the logic in favor of ID lookups)
            .mockResolvedValueOnce({ items: tgtEntries }); // ID lookup fetch

        const { req, res } = createMocks({
            method: 'GET',
            query: {
                sourceSpaceId: 'space_src', sourceEnvId: 'master',
                targetSpaceId: 'space_tgt', targetEnvId: 'staging',
                contentTypeId: 'blogPost'
            }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = res._getJSONData();
        expect(data.success).toBe(true);

        const diffs = data.data.entries;
        expect(diffs).toHaveLength(3);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const eq = diffs.find((d: any) => d.id === 'e_equal');
        expect(eq.diffStatus).toBe('EQUAL');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const mod = diffs.find((d: any) => d.id === 'e_mod');
        expect(mod.diffStatus).toBe('MODIFIED');
        expect(mod.changedFieldKeys).toContain('val');

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const added = diffs.find((d: any) => d.id === 'e_new');
        expect(added.diffStatus).toBe('NEW');
    });

    it('resolves references and assets from NEW/MODIFIED entries', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1', contentfulToken: 'token' });

        const srcEntries = [
            {
                sys: { id: 'e_new', version: 1, updatedAt: '2023-01-01', publishedVersion: 1 },
                fields: {
                    image: { 'en-US': { sys: { type: 'Link', linkType: 'Asset', id: 'asset_1' } } },
                    author: { 'en-US': [{ sys: { type: 'Link', linkType: 'Entry', id: 'entry_1' } }] }
                }
            }
        ];

        mockEnvironmentSrc.getEntries
            .mockResolvedValueOnce({ items: srcEntries }) // Main fetch
            .mockResolvedValueOnce({ items: [{ sys: { id: 'entry_1', contentType: { sys: { id: 'author' } } }, fields: { name: { 'en-US': 'John Doe' } } }] }); // Reference fetch

        mockEnvironmentTgt.getEntries
            .mockResolvedValueOnce({ items: [] })
            .mockResolvedValueOnce({ items: [] });

        mockEnvironmentSrc.getAssets.mockResolvedValueOnce({
            items: [
                { sys: { id: 'asset_1' }, fields: { file: { 'en-US': { url: '//image.jpg', contentType: 'image/jpeg' } }, title: { 'en-US': 'Hero Image' } } }
            ]
        });

        const { req, res } = createMocks({
            method: 'GET',
            query: {
                sourceSpaceId: 'space_src', sourceEnvId: 'master', targetSpaceId: 'space_tgt', targetEnvId: 'staging', contentTypeId: 'blogPost'
            }
        });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = res._getJSONData();

        const assets = data.data.resolvedAssets;
        expect(assets['asset_1']).toBeDefined();
        expect(assets['asset_1'].isImage).toBe(true);
        expect(assets['asset_1'].url).toBe('https://image.jpg');

        const entries = data.data.resolvedEntries;
        expect(entries['entry_1']).toBeDefined();
        expect(entries['entry_1'].title).toBe('John Doe'); // Fallback matches name field
        expect(entries['entry_1'].contentType).toBe('author');
    });
});
