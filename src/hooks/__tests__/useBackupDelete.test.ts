import { renderHook, act } from '@testing-library/react';
import { useBackupDelete } from '../useBackupDelete';
import { useGlobalContext } from '@/context/GlobalContext';
import { useLoading } from '../useLoading';
import { useBackups } from '../useBackups';
import { api } from '@/utils/api';

jest.mock('@/context/GlobalContext', () => ({ useGlobalContext: jest.fn() }));
jest.mock('../useLoading', () => ({ useLoading: jest.fn() }));
jest.mock('../useBackups', () => ({ useBackups: jest.fn() }));
jest.mock('@/utils/api', () => ({ ...jest.requireActual('@/utils/api'), api: { post: jest.fn() } }));
jest.mock('@/utils/errorHandler', () => ({
    handleError: jest.fn((err) => (err instanceof Error ? err.message : 'Unknown error')),
}));

describe('useBackupDelete', () => {
    const mockDispatch = jest.fn();
    const mockLoadBackups = jest.fn();
    const backup = { id: '123', name: 'test.json', path: '', time: 1000 };

    beforeEach(() => {
        jest.clearAllMocks();
        (useGlobalContext as jest.Mock).mockReturnValue({ dispatch: mockDispatch });
        (useLoading as jest.Mock).mockReturnValue({ withLoading: jest.fn((_key, fn) => fn()) });
        (useBackups as jest.Mock).mockReturnValue({ loadBackups: mockLoadBackups });
    });

    it('deletes a backup by id and reloads the list', async () => {
        (api.post as jest.Mock).mockResolvedValueOnce({ success: true });
        const { result } = renderHook(() => useBackupDelete());

        await act(async () => {
            await result.current.handleDelete('space-1', backup);
        });

        expect(api.post).toHaveBeenCalledWith('/api/deleteBackup', expect.objectContaining({ spaceId: 'space-1', backupId: '123' }));
        expect(mockLoadBackups).toHaveBeenCalledWith('space-1', true);
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_STATUS', payload: 'Backup test.json deleted successfully' });
    });

    it('reports API errors', async () => {
        (api.post as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Backup not found' });
        const { result } = renderHook(() => useBackupDelete());

        await act(async () => {
            await result.current.handleDelete('space-1', backup);
        });

        expect(mockLoadBackups).not.toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_STATUS', payload: 'Error deleting backup: Backup not found' });
    });

    it('refuses backups without an id', async () => {
        const { result } = renderHook(() => useBackupDelete());

        await act(async () => {
            await result.current.handleDelete('space-1', { ...backup, id: undefined });
        });

        expect(api.post).not.toHaveBeenCalled();
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_STATUS', payload: 'Error deleting backup: Backup ID is missing' });
    });
});
