import React from 'react';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useSpaces } from '../useSpaces';

global.fetch = jest.fn();

function wrapper({ children }: { children: React.ReactNode }) {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return React.createElement(QueryClientProvider, { client }, children);
}

function mockResponse(status: number, body: unknown) {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: status < 300, status, json: async () => body });
}

describe('useSpaces', () => {
    beforeEach(() => jest.clearAllMocks());

    it('loads spaces from the API', async () => {
        const spaces = [{ id: 's1', name: 'Space 1' }];
        mockResponse(200, { success: true, data: { spaces } });

        const { result } = renderHook(() => useSpaces(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(global.fetch).toHaveBeenCalledWith('/api/spaces', expect.objectContaining({ method: 'GET' }));
        expect(result.current.spaces).toEqual(spaces);
        expect(result.current.error).toBeNull();
    });

    it('exposes API errors', async () => {
        mockResponse(401, { success: false, error: 'Sign in required' });

        const { result } = renderHook(() => useSpaces(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe('Sign in required');
        expect(result.current.spaces).toEqual([]);
    });

    it('handles success: false responses', async () => {
        mockResponse(200, { success: false, error: 'Contentful token not configured' });

        const { result } = renderHook(() => useSpaces(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe('Contentful token not configured');
    });

    it('handles network errors', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network down'));

        const { result } = renderHook(() => useSpaces(), { wrapper });
        await waitFor(() => expect(result.current.loading).toBe(false));

        expect(result.current.error).toBe('Network down');
    });
});
