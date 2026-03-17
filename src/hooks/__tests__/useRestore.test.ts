import { renderHook, act } from '@testing-library/react';
import { useRestore } from '../useRestore';
import { useGlobalContext } from '@/context/GlobalContext';
import { useError } from '@/context/ErrorContext';
import { api } from '@/utils/api';
import { parseError } from '@/utils/errorParser';

// Mocks
jest.mock('@/context/GlobalContext', () => ({
    useGlobalContext: jest.fn(),
}));

jest.mock('@/context/ErrorContext', () => ({
    useError: jest.fn(),
}));

jest.mock('@/utils/api', () => ({
    api: {
        post: jest.fn(),
    },
}));

jest.mock('@/utils/errorParser', () => ({
    parseError: jest.fn(),
}));

describe('useRestore', () => {
    const mockDispatch = jest.fn();
    const mockShowError = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useGlobalContext as jest.Mock).mockReturnValue({
            state: { spaceId: 'space-1', selectedTarget: 'master' },
            dispatch: mockDispatch,
        });
        (useError as jest.Mock).mockReturnValue({
            showError: mockShowError,
        });
    });

    it('successfully initiates and completes a restore', async () => {
        const { result } = renderHook(() => useRestore());
        const mockBackup = { id: '123', name: 'backup.json', path: '/backups/backup.json', time: 1000, size: 500 };

        (api.post as jest.Mock).mockResolvedValueOnce({ success: true });

        await act(async () => {
            await result.current.handleRestore(mockBackup);
        });

        // 1. Initial Progress Dispatch
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_RESTORE_PROGRESS',
            payload: expect.objectContaining({ isActive: true, restoringBackupName: 'backup.json' }),
        });

        // 2. API Call
        expect(api.post).toHaveBeenCalledWith('/api/restore', {
            spaceId: 'space-1',
            backupId: '123',
            fileName: 'backup.json',
            targetEnvironment: 'master',
        });

        // 3. Success Dispatch
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR_ERROR_INSTRUCTION' });
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_RESTORE_RESULT',
            payload: { success: true, backupName: 'backup.json', targetEnvironment: 'master' },
        });
    });

    it('throws error if missing required state', async () => {
        // Missing spaceId
        (useGlobalContext as jest.Mock).mockReturnValue({
            state: { spaceId: '', selectedTarget: 'master' },
            dispatch: mockDispatch,
        });

        const { result } = renderHook(() => useRestore());
        const mockBackup = { id: '123', name: 'backup.json', path: '/backups/backup.json', time: 1000, size: 500 };

        await act(async () => {
            await result.current.handleRestore(mockBackup);
        });

        // Should dispatch result with success: false
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_RESTORE_RESULT',
            payload: expect.objectContaining({ success: false, errorMessage: expect.stringMatching(/required/i) }),
        });
    });

    it('handles API failure response', async () => {
        const { result } = renderHook(() => useRestore());
        const mockBackup = { id: '123', name: 'backup.json', path: '/backups/backup.json', time: 1000, size: 500 };

        (api.post as jest.Mock).mockResolvedValueOnce({ success: false, error: 'API Error' });

        await act(async () => {
            await result.current.handleRestore(mockBackup);
        });

        // Should reset progress (isActive: false)
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_RESTORE_PROGRESS',
            payload: expect.objectContaining({ isActive: false }),
        });

        // Should dispatch failure result
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_RESTORE_RESULT',
            payload: expect.objectContaining({ success: false, errorMessage: 'API Error' }),
        });
    });

    it('parses known errors and dispatches instruction', async () => {
        const { result } = renderHook(() => useRestore());
        const mockBackup = { id: '123', name: 'backup.json', path: '/backups/backup.json', time: 1000, size: 500 };

        (api.post as jest.Mock).mockRejectedValueOnce(new Error('Rate Limit Exceeded'));
        (parseError as jest.Mock).mockReturnValue('Wait for 60 seconds');

        await act(async () => {
            await result.current.handleRestore(mockBackup);
        });

        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_ERROR_INSTRUCTION',
            payload: {
                instruction: 'Wait for 60 seconds',
                errorMessage: 'Rate Limit Exceeded',
                backupFile: 'backup.json',
            },
        });
    });
});
