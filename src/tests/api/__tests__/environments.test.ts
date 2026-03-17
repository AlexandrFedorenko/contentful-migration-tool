import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/environments';
import { prisma } from '@/lib/db';
import { ContentfulManagement } from '@/utils/contentful-management';
import { getAuth } from '@clerk/nextjs/server';

// Mock dependencies
jest.mock('@clerk/nextjs/server', () => ({
    getAuth: jest.fn()
}));

jest.mock('@/lib/db', () => ({
    prisma: {
        user: {
            findUnique: jest.fn()
        }
    }
}));

jest.mock('@/lib/encryption', () => ({
    decrypt: jest.fn((token) => token),
}));

jest.mock('@/utils/contentful-management', () => ({
    ContentfulManagement: {
        getEnvironments: jest.fn()
    }
}));

describe('API: environments', () => {
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
        const { req, res } = createMocks({ method: 'GET', query: {} }); // No spaceId

        await handler(req, res);

        expect(res._getStatusCode()).toBe(400);
        expect(JSON.parse(res._getData()).error).toMatch(/Space ID is required/);
    });

    it('returns 401 if user/token is missing', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const { req, res } = createMocks({ method: 'GET', query: { spaceId: 'space1' } });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).error).toMatch(/Contentful token not set/);
    });

    it('returns environments on success', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ contentfulToken: 'CFPAT-123' });

        const mockEnvs = [
            { id: 'master', name: 'Master', createdAt: '2023-01-01' },
            { id: 'dev', name: 'Development', createdAt: '2023-02-01' }
        ];
        (ContentfulManagement.getEnvironments as jest.Mock).mockResolvedValue(mockEnvs);

        const { req, res } = createMocks({ method: 'GET', query: { spaceId: 'space1' } });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.success).toBe(true);
        expect(data.environments).toHaveLength(2);
        expect(data.environments[0].id).toBe('master');
        expect(ContentfulManagement.getEnvironments).toHaveBeenCalledWith('space1', 'CFPAT-123');
    });

    it('returns 401 on API auth error', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ contentfulToken: 'CFPAT-BAD' });

        (ContentfulManagement.getEnvironments as jest.Mock).mockRejectedValue(new Error('Forbidden: invalid token'));

        const { req, res } = createMocks({ method: 'GET', query: { spaceId: 'space1' } });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData()).success).toBe(false);
    });

    it('returns 500 on generic API error', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ contentfulToken: 'CFPAT-123' });

        (ContentfulManagement.getEnvironments as jest.Mock).mockRejectedValue(new Error('Network Error'));

        const { req, res } = createMocks({ method: 'GET', query: { spaceId: 'space1' } });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(500);
    });
});
