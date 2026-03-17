import { renderHook, waitFor } from '@testing-library/react';
import { useSpaces } from '../useSpaces';

// Setup global fetch mock
global.fetch = jest.fn();

describe('useSpaces', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('successfully fetches spaces', async () => {
        const mockSpaces = [{ sys: { id: 's1' }, name: 'Space 1' }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: true, spaces: mockSpaces }),
        });

        const { result } = renderHook(() => useSpaces());

        // Initially loading might be false until effect runs, or true immediately?
        // In implementation: useEffect -> fetchSpaces -> setLoading(true)
        // We wait for loading to complete

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.spaces).toEqual(mockSpaces);
        expect(result.current.error).toBeNull();
    });

    it('handles non-200 API response', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ message: 'Unauthorized' }),
        });

        const { result } = renderHook(() => useSpaces());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Unauthorized');
        expect(result.current.spaces).toEqual([]);
    });

    it('handles API reporting success: false', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ success: false, message: 'No spaces found' }),
        });

        const { result } = renderHook(() => useSpaces());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('No spaces found');
        expect(result.current.spaces).toEqual([]);
    });

    it('handles network error', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network Error'));

        const { result } = renderHook(() => useSpaces());

        await waitFor(() => {
            expect(result.current.loading).toBe(false);
        });

        expect(result.current.error).toBe('Network Error');
        expect(result.current.spaces).toEqual([]);
    });
});
