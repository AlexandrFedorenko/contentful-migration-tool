import { renderHook, act } from '@testing-library/react';
import { useBackup } from '@/hooks/useBackup';
import { useGlobalContext } from '@/context/GlobalContext';
import { useLoading } from '@/hooks/useLoading';
import { useError } from '@/context/ErrorContext';
import { useRouter } from 'next/router';
import { api } from '@/utils/api';

// Mock dependencies
jest.mock('@/context/GlobalContext', () => ({
    useGlobalContext: jest.fn()
}));

jest.mock('@/hooks/useLoading', () => ({
    useLoading: jest.fn()
}));

jest.mock('@/context/ErrorContext', () => ({
    useError: jest.fn()
}));

jest.mock('next/router', () => ({
    useRouter: jest.fn()
}));

jest.mock('@/utils/api', () => ({
    api: {
        get: jest.fn(),
        post: jest.fn()
    }
}));

jest.mock('@/utils/errorParser', () => ({
    parseError: jest.fn((msg) => msg),
    instructionToString: jest.fn((msg) => msg)
}));

// Mock window.open
const originalWindowOpen = window.open;
beforeAll(() => {
    window.open = jest.fn();
});
afterAll(() => {
    window.open = originalWindowOpen;
});

describe('useBackup Hook', () => {
    const mockDispatch = jest.fn();
    const mockShowError = jest.fn();
    const mockWithLoading = jest.fn((key, fn) => fn());

    const defaultState = {
        spaceId: 'space-123',
        selectedDonor: 'master'
    };

    beforeEach(() => {
        jest.clearAllMocks();

        (useGlobalContext as jest.Mock).mockReturnValue({
            state: defaultState,
            dispatch: mockDispatch
        });

        (useLoading as jest.Mock).mockReturnValue({
            withLoading: mockWithLoading
        });

        (useError as jest.Mock).mockReturnValue({
            showError: mockShowError
        });

        (useRouter as jest.Mock).mockReturnValue({
            query: {}
        });
    });

    it('should initialize successfully', () => {
        const { result } = renderHook(() => useBackup());
        expect(result.current.handleBackup).toBeDefined();
    });

    it('should handle successful backup creation without assets', async () => {
        (api.post as jest.Mock).mockResolvedValue({
            success: true,
            data: { backupFile: 'backup-file.json', hasZip: false }
        });

        // Mock getting updated backups list
        (api.get as jest.Mock).mockResolvedValue({
            success: true,
            data: { backups: [] }
        });

        const { result } = renderHook(() => useBackup());

        let response;
        await act(async () => {
            response = await result.current.handleBackup(false, true, true, false);
        });

        expect(api.post).toHaveBeenCalledWith('/api/backup', {
            spaceId: 'space-123',
            env: 'master',
            includeAssets: false,
            includeDrafts: true,
            includeArchived: true,
            overwrite: false
        });

        expect(response).toEqual({ success: true, data: { backupFile: 'backup-file.json', hasZip: false } });
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: 'SET_STATUS',
            payload: expect.stringContaining('successfully')
        }));
    });

    it('should handle backup limits (409)', async () => {
        (api.post as jest.Mock).mockResolvedValue({
            success: false,
            data: { limitReached: true }
        });

        const { result } = renderHook(() => useBackup());

        let response;
        await act(async () => {
            response = await result.current.handleBackup();
        });

        expect(response).toEqual({ success: false, limitReached: true });
        // Should NOT trigger error display for handled limits
        expect(mockShowError).not.toHaveBeenCalled();
    });

    it('should trigger asset download when zip is created', async () => {
        (api.post as jest.Mock).mockResolvedValue({
            success: true,
            data: { backupFile: 'backup.json', hasZip: true }
        });

        // Mock get backups
        (api.get as jest.Mock).mockResolvedValue({ success: true, data: { backups: [] } });

        const { result } = renderHook(() => useBackup());

        await act(async () => {
            await result.current.handleBackup(true);
        });

        expect(window.open).toHaveBeenCalledWith(
            expect.stringContaining('/api/download-transient-zip'),
            '_blank'
        );

        // Should show specific status message about download
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({
            type: 'SET_STATUS',
            payload: expect.anything() // React element is passed here
        }));
    });

    it('should handle API errors appropriately', async () => {
        (api.post as jest.Mock).mockResolvedValue({
            success: false,
            error: 'API Failure'
        });

        const { result } = renderHook(() => useBackup());

        let response;
        await act(async () => {
            response = await result.current.handleBackup();
        });

        expect(response).toEqual({ success: false });
        expect(mockShowError).toHaveBeenCalledWith(expect.stringContaining('API Failure'));
    });
});
