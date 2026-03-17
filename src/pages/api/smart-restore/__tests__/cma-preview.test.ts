import { NextApiRequest, NextApiResponse } from 'next';
import handler from '../cma-preview';
import { getAuth } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { decrypt } from '@/lib/encryption';
import { ContentfulManagement } from '@/utils/contentful-management';
import { resolveContentTypeDependencies } from '@/utils/dependency-resolver';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
    getAuth: jest.fn(),
}));

jest.mock('@/lib/db', () => ({
    prisma: {
        user: {
            findUnique: jest.fn(),
        },
    },
}));

jest.mock('@/lib/encryption', () => ({
    decrypt: jest.fn(),
}));

jest.mock('@/utils/contentful-management', () => ({
    ContentfulManagement: {
        getContentTypes: jest.fn(),
        getLocales: jest.fn(),
        getClient: jest.fn(),
    },
}));

jest.mock('@/utils/dependency-resolver', () => ({
    resolveContentTypeDependencies: jest.fn().mockReturnValue({ autoDeps: new Set() }),
}));

describe('/api/smart-restore/cma-preview', () => {
    let mockReq: Partial<NextApiRequest>;
    let mockRes: Partial<NextApiResponse>;
    let mockJson: jest.Mock;
    let mockStatus: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();

        mockJson = jest.fn();
        mockStatus = jest.fn().mockReturnValue({ json: mockJson });

        mockReq = {
            method: 'GET',
            query: {
                spaceId: 'test-space',
                environmentId: 'test-env',
            },
            cookies: {},
        };

        mockRes = {
            status: mockStatus,
        };

        (getAuth as jest.Mock).mockReturnValue({
            userId: 'test-user-id',
        });

        (prisma.user.findUnique as jest.Mock).mockResolvedValue({
            clerkId: 'test-user-id',
            contentfulToken: 'encrypted-token',
        });

        (decrypt as jest.Mock).mockReturnValue('valid-token');
    });

    it('returns 405 if method is not GET', async () => {
        mockReq.method = 'POST';
        await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

        expect(mockStatus).toHaveBeenCalledWith(405);
        expect(mockJson).toHaveBeenCalledWith({ success: false, error: 'Method not allowed' });
    });

    it('returns 400 if spaceId or environmentId is missing', async () => {
        mockReq.query = { spaceId: 'test-space' }; // Missing environmentId
        await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({ success: false, error: 'spaceId and environmentId are required' });
    });

    it('returns 401 if unauthorized', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: null });
        await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

        expect(mockStatus).toHaveBeenCalledWith(401);
        expect(mockJson).toHaveBeenCalledWith({ success: false, error: 'Unauthorized' });
    });

    it('returns 400 if Contentful token not configured', async () => {
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ clerkId: 'test-user-id', contentfulToken: null });
        await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

        expect(mockStatus).toHaveBeenCalledWith(400);
        expect(mockJson).toHaveBeenCalledWith({ success: false, error: 'Contentful token not configured' });
    });

    it('successfully fetches and maps Content Types and Locales', async () => {
        (ContentfulManagement.getContentTypes as jest.Mock).mockResolvedValue([
            {
                sys: { id: 'page' },
                name: 'Page',
                description: 'A standard page',
                displayField: 'title',
                fields: [
                    { id: 'title', type: 'Symbol', items: undefined }
                ]
            },
            {
                sys: { id: 'component' },
                name: 'Component',
                description: '',
                displayField: 'internalName',
                fields: [
                    { id: 'internalName', type: 'Symbol' },
                    { id: 'reference', type: 'Link', linkType: 'Entry', validations: [{ linkContentType: ['nestedComponent'] }] }
                ]
            }
        ]);

        (ContentfulManagement.getLocales as jest.Mock).mockResolvedValue([
            { name: 'English', code: 'en-US', fallbackCode: null, default: true, optional: false },
            { name: 'German', code: 'de-DE', fallbackCode: 'en-US', default: false, optional: true }
        ]);

        const mockEnv = {
            getEntries: jest.fn().mockImplementation(({ content_type }) => {
                if (content_type === 'page') return Promise.resolve({ total: 5, items: [{ sys: { id: '1', version: 1, publishedVersion: 1 }, fields: { title: { 'en-US': 'Home' } } }] });
                if (content_type === 'component') return Promise.resolve({ total: 2, items: [{ sys: { id: '2', version: 1, publishedVersion: 1 }, fields: { internalName: { 'en-US': 'Hero' } } }] });
                return Promise.resolve({ total: 0, items: [] });
            }),
        };

        const mockSpace = {
            getEnvironment: jest.fn().mockResolvedValue(mockEnv),
        };

        (ContentfulManagement.getClient as jest.Mock).mockReturnValue({
            getSpace: jest.fn().mockResolvedValue(mockSpace),
        });

        (resolveContentTypeDependencies as jest.Mock).mockImplementation((ctIds) => {
            if (ctIds.has('component')) return { autoDeps: new Set(['nestedComponent']) };
            return { autoDeps: new Set() };
        });

        await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

        expect(ContentfulManagement.getContentTypes).toHaveBeenCalledWith('test-space', 'test-env', 'valid-token');
        expect(ContentfulManagement.getLocales).toHaveBeenCalledWith('test-space', 'test-env', 'valid-token');
        expect(mockEnv.getEntries).toHaveBeenCalledTimes(2);

        expect(mockStatus).toHaveBeenCalledWith(200);
        expect(mockJson).toHaveBeenCalledWith(expect.objectContaining({
            success: true,
            data: expect.objectContaining({
                totalContentTypes: 2,
                locales: expect.arrayContaining([
                    expect.objectContaining({ code: 'en-US', name: 'English' })
                ]),
                contentTypes: expect.arrayContaining([
                    expect.objectContaining({
                        id: 'page',
                        totalEntries: 5,
                        sampleTitles: ['Home']
                    }),
                    expect.objectContaining({
                        id: 'component',
                        totalEntries: 2,
                        sampleTitles: ['Hero']
                    })
                ]),
                ctDependencyMap: expect.objectContaining({
                    'component': ['nestedComponent']
                })
            })
        }));
    });

    it('handles Contentful API errors gracefully', async () => {
        (ContentfulManagement.getContentTypes as jest.Mock).mockRejectedValue(new Error('Contentful connection failed'));

        await handler(mockReq as NextApiRequest, mockRes as NextApiResponse);

        expect(mockStatus).toHaveBeenCalledWith(500);
        expect(mockJson).toHaveBeenCalledWith({
            success: false,
            error: 'Contentful connection failed'
        });
    });
});
