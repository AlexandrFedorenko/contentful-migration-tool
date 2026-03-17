// Test utilities and mocks for Jest tests
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

// Mock Prisma Client
export const prismaMock = mockDeep<PrismaClient>() as unknown as DeepMockProxy<PrismaClient>;

// Reset mocks before each test
beforeEach(() => {
    mockReset(prismaMock);
});

// Mock Clerk
export const mockClerkUser = {
    id: 'user_test123',
    emailAddresses: [{ emailAddress: 'test@example.com' }],
    firstName: 'Test',
    lastName: 'User'
};

export const mockGetAuth = jest.fn(() => ({
    userId: 'user_test123',
    sessionId: 'session_test123'
}));

// Mock fetch
export const mockFetch = (response: unknown, ok = true) => {
    global.fetch = jest.fn(() =>
        Promise.resolve({
            ok,
            json: () => Promise.resolve(response),
            text: () => Promise.resolve(JSON.stringify(response))
        } as Response)
    );
};

// Mock localStorage
export const mockLocalStorage = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => {
            store[key] = value.toString();
        },
        removeItem: (key: string) => {
            delete store[key];
        },
        clear: () => {
            store = {};
        }
    };
})();

// Setup localStorage mock
Object.defineProperty(window, 'localStorage', {
    value: mockLocalStorage
});

// Mock environment variables
process.env.CLERK_SECRET_KEY = 'test_secret_key_32_bytes_long!!';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
