import { renderHook, act } from '@testing-library/react';
import { useBackupDelete } from '../useBackupDelete';
import { useGlobalContext } from '@/context/GlobalContext';
import { useLoading } from '../useLoading';

// Mocks
jest.mock('@/context/GlobalContext', () => ({
    useGlobalContext: jest.fn(),
}));

jest.mock('../useLoading', () => ({
    useLoading: jest.fn(),
}));

jest.mock('@/utils/errorHandler', () => ({
    handleError: jest.fn((err) => err instanceof Error ? err.message : 'Unknown error'),
}));

// Setup global fetch mock
global.fetch = jest.fn();

describe('useBackupDelete', () => {
    const mockDispatch = jest.fn();
    const mockWithLoading = jest.fn((key, fn) => fn()); // Execute callback immediately

    beforeEach(() => {
        jest.clearAllMocks();
        (useGlobalContext as jest.Mock).mockReturnValue({
            dispatch: mockDispatch,
        });
        (useLoading as jest.Mock).mockReturnValue({
            withLoading: mockWithLoading,
        });
    });

    it('successfully deletes a backup and reloads list', async () => {
        const { result } = renderHook(() => useBackupDelete());
        const mockBackup = { id: '123', name: 'test.json', path: '/backups/test.json', time: 1000, size: 500 };

        // Mock Delete API Response
        (global.fetch as jest.Mock)
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ success: true }),
            })
            // Mock Reload Backups API Response
            .mockResolvedValueOnce({
                ok: true,
                json: async () => ({ backups: [] }),
            });

        await act(async () => {
            await result.current.handleDelete('space-1', mockBackup);
        });

        // 1. Check Delete Call
        expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/deleteBackup', expect.objectContaining({
            method: 'POST',
            body: JSON.stringify({ spaceId: 'space-1', backupId: '123', fileName: 'test.json' }),
        }));

        // 2. Check Reload Call
        expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/backups?spaceId=space-1');

        // 3. Check Status Updates
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_STATUS',
            payload: 'Deleting backup test.json...',
        });
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_DATA',
            payload: { backups: [] },
        });
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_STATUS',
            payload: 'Backup test.json deleted successfully',
        });
    });

    it('handles API error during delete', async () => {
        const { result } = renderHook(() => useBackupDelete());
        const mockBackup = { id: '123', name: 'fail.json', path: '/backups/fail.json', time: 1000, size: 500 };

        // Mock Delete API Failure
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            json: async () => ({ error: 'Delete failed' }),
        });

        await act(async () => {
            await result.current.handleDelete('space-1', mockBackup);
        });

        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_STATUS',
            payload: 'Error deleting backup: Delete failed',
        });
    });

    it('handles missing backup ID', async () => {
        const { result } = renderHook(() => useBackupDelete());
        const invalidBackup = { name: 'no-id.json', path: '/backups/no-id.json', time: 1000, size: 500 }; // No ID

        await act(async () => {
            await result.current.handleDelete('space-1', invalidBackup as unknown as import('@/types/backup').Backup);
        });

        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_STATUS',
            payload: 'Error deleting backup: Backup ID is missing',
        });
    });
});
