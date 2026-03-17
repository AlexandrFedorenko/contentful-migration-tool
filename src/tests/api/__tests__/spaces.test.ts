import { createMocks } from 'node-mocks-http';
import handler from '@/pages/api/spaces';
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
    decrypt: jest.fn((token) => token) // Simple mock pass-through
}));

jest.mock('@/utils/contentful-management', () => ({
    ContentfulManagement: {
        getClient: jest.fn()
    }
}));

jest.mock('@/utils/logger', () => ({
    logger: {
        info: jest.fn(),
        error: jest.fn(),
        warn: jest.fn()
    }
}));

describe('API: spaces', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns 401 if not authenticated', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: null });
        const { req, res } = createMocks({ method: 'GET' });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData())).toEqual({ success: false, message: 'Unauthorized' });
    });

    it('returns 401 if user profile or token missing', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

        const { req, res } = createMocks({ method: 'GET' });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(401);
        expect(JSON.parse(res._getData())).toEqual({ success: false, message: 'Contentful token not set in profile' });
    });

    it('returns spaces from US host by default', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ contentfulToken: 'CFPAT-123' });

        const mockClient = {
            getSpaces: jest.fn().mockResolvedValue({
                total: 2,
                items: [
                    { sys: { id: 'space1' }, name: 'Space 1' },
                    { sys: { id: 'space2' }, name: 'Space 2' }
                ]
            }),
            getCurrentUser: jest.fn().mockResolvedValue({ email: 'test@example.com', firstName: 'Test' })
        };

        (ContentfulManagement.getClient as jest.Mock).mockReturnValue(mockClient);

        const { req, res } = createMocks({ method: 'GET' });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.success).toBe(true);
        expect(data.spaces).toHaveLength(2);
        expect(data.spaces[0].name).toBe('Space 1');
        // Verify US host implied (default)
        expect(ContentfulManagement.getClient).toHaveBeenCalledWith('CFPAT-123');
    });

    it('falls back to EU host if US host returns 0 spaces', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ contentfulToken: 'CFPAT-EU-123' });

        const usClient = {
            getSpaces: jest.fn().mockResolvedValue({ total: 0, items: [] }),
            getCurrentUser: jest.fn().mockResolvedValue({})
        };

        const euClient = {
            getSpaces: jest.fn().mockResolvedValue({
                total: 1,
                items: [{ sys: { id: 'eu-space' }, name: 'EU Space' }]
            }),
            getCurrentUser: jest.fn().mockResolvedValue({ email: 'eu@example.com' })
        };

        (ContentfulManagement.getClient as jest.Mock)
            .mockReturnValueOnce(usClient)  // First call for US
            .mockReturnValueOnce(euClient); // Second call for EU

        const { req, res } = createMocks({ method: 'GET' });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.spaces).toHaveLength(1);
        expect(data.spaces[0].name).toBe('EU Space');

        // Verify logic tried US, got 0, then tried EU
        expect(ContentfulManagement.getClient).toHaveBeenCalledTimes(2);
        expect(ContentfulManagement.getClient).toHaveBeenLastCalledWith('CFPAT-EU-123', 'api.eu.contentful.com');
    });

    it('returns empty list if both regions fail (graceful degradation)', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ contentfulToken: 'CFPAT-FAIL' });

        const mockClient = {
            getSpaces: jest.fn().mockRejectedValue(new Error('Network error')),
            getCurrentUser: jest.fn().mockResolvedValue({})
        };
        (ContentfulManagement.getClient as jest.Mock).mockReturnValue(mockClient);

        const { req, res } = createMocks({ method: 'GET' });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(200);
        const data = JSON.parse(res._getData());
        expect(data.success).toBe(true);
        expect(data.spaces).toHaveLength(0);
    });

    it('returns internal server error on critical failure', async () => {
        (getAuth as jest.Mock).mockReturnValue({ userId: 'user_123' });
        (prisma.user.findUnique as jest.Mock).mockResolvedValue({ contentfulToken: 'CFPAT-CRITICAL' });

        // Force critical error outside try/catch blocks or unhandled logic
        (ContentfulManagement.getClient as jest.Mock).mockImplementation(() => {
            throw new Error('Critical SDK Error');
        });

        const { req, res } = createMocks({ method: 'GET' });

        await handler(req, res);

        expect(res._getStatusCode()).toBe(500);
        expect(JSON.parse(res._getData()).success).toBe(false);
    });
});
