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
    ...jest.requireActual('@/utils/api'),
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

    const mockBackup = { id: '123', name: 'backup.json', path: '', time: 1000 };
    const validationOk = { success: true, data: { status: 'ok', sourceLocales: [], targetLocales: [], details: {} } };

    it('validates locales, then restores and reports success', async () => {
        const { result } = renderHook(() => useRestore());
        (api.post as jest.Mock).mockResolvedValueOnce(validationOk).mockResolvedValueOnce({ success: true, data: {} });

        await act(async () => {
            await result.current.handleRestore(mockBackup);
        });

        expect(api.post).toHaveBeenNthCalledWith(1, '/api/validate-restore', expect.objectContaining({ spaceId: 'space-1', targetEnvironment: 'master', backupId: '123' }));
        expect(api.post).toHaveBeenNthCalledWith(2, '/api/restore', expect.objectContaining({ spaceId: 'space-1', backupId: '123', targetEnvironment: 'master' }));
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_RESTORE_PROGRESS',
            payload: expect.objectContaining({ isActive: true, restoringBackupName: 'backup.json' }),
        });
        expect(mockDispatch).toHaveBeenCalledWith({ type: 'CLEAR_ERROR_INSTRUCTION' });
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_RESTORE_RESULT',
            payload: expect.objectContaining({ success: true, backupName: 'backup.json' }),
        });
    });

    it('asks for a locale mapping when locales do not match', async () => {
        const { result } = renderHook(() => useRestore());
        (api.post as jest.Mock).mockResolvedValueOnce({ success: true, data: { status: 'mismatch', sourceLocales: [], targetLocales: [], details: { defaultMismatch: true, missingInTarget: [] } } });

        await act(async () => {
            await result.current.handleRestore(mockBackup);
        });

        expect(result.current.mappingModalOpen).toBe(true);
        expect(api.post).toHaveBeenCalledTimes(1);
    });

    it('does nothing without a space or target environment', async () => {
        (useGlobalContext as jest.Mock).mockReturnValue({ state: { spaceId: '', selectedTarget: '' }, dispatch: mockDispatch });
        const { result } = renderHook(() => useRestore());

        await act(async () => {
            await result.current.handleRestore(mockBackup);
        });

        expect(api.post).not.toHaveBeenCalled();
    });

    it('reports a failed restore', async () => {
        const { result } = renderHook(() => useRestore());
        (api.post as jest.Mock).mockResolvedValueOnce(validationOk).mockResolvedValueOnce({ success: false, error: 'API Error' });
        (parseError as jest.Mock).mockReturnValue(null);

        await act(async () => {
            await result.current.handleRestore(mockBackup);
        });

        expect(mockDispatch).toHaveBeenCalledWith({ type: 'SET_RESTORE_PROGRESS', payload: expect.objectContaining({ isActive: false }) });
        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_RESTORE_RESULT',
            payload: expect.objectContaining({ success: false, errorMessage: 'API Error' }),
        });
    });

    it('shows instructions for known errors', async () => {
        const { result } = renderHook(() => useRestore());
        (api.post as jest.Mock).mockResolvedValueOnce(validationOk).mockRejectedValueOnce(new Error('Rate Limit Exceeded'));
        (parseError as jest.Mock).mockReturnValue('Wait for 60 seconds');

        await act(async () => {
            await result.current.handleRestore(mockBackup);
        });

        expect(mockDispatch).toHaveBeenCalledWith({
            type: 'SET_ERROR_INSTRUCTION',
            payload: { instruction: 'Wait for 60 seconds', errorMessage: 'Rate Limit Exceeded', backupFile: 'backup.json' },
        });
    });
});
