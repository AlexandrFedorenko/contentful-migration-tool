import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BackupList from '../BackupList';
import { useGlobalContext } from '@/context/GlobalContext';

// Mock dependencies
jest.mock('@/context/GlobalContext', () => ({
    useGlobalContext: jest.fn(),
}));

jest.mock('@/hooks/useBackups', () => ({
    useBackups: jest.fn(),
}));

jest.mock('@/hooks/useBackupDelete', () => ({
    useBackupDelete: () => ({
        handleDelete: jest.fn(),
        isDeleting: false,
        deleteError: null,
    }),
}));

jest.mock('@/hooks/useBackupRename', () => ({
    useBackupRename: () => ({
        handleRename: jest.fn(),
        isRenaming: false,
        renameError: null,
    }),
}));

jest.mock('@/hooks/useRestore', () => ({
    useRestore: () => ({
        handleRestore: jest.fn(),
        isRestoring: false,
        restoreError: null,
        restoreProgress: { isActive: false }
    }),
}));

describe('BackupList Component', () => {
    const mockDispatch = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        // Default mock implementation
        (useGlobalContext as jest.Mock).mockReturnValue({
            state: {
                spaceId: 'test-space',
                backups: [],
                loading: { loadingBackups: false },
                restoreMode: false,
            },
            dispatch: mockDispatch,
        });
    });

    it('renders "No backups available" when backups list is empty', () => {
        render(<BackupList />);
        expect(screen.getByText('No backups available')).toBeInTheDocument();
    });

    it('renders "No backups available" when backups is undefined (Regression Test)', () => {
        // Arrange: Simulate the bug we fixed (backups: undefined)
        (useGlobalContext as jest.Mock).mockReturnValue({
            state: {
                spaceId: 'test-space',
                backups: undefined,
                loading: { loadingBackups: false },
                restoreMode: false,
                restoreProgress: { isActive: false },
            },
            dispatch: mockDispatch,
        });

        // Act
        render(<BackupList />);

        // Assert: Should not crash and show empty state
        expect(screen.getByText('No backups available')).toBeInTheDocument();
    });

    it('renders a list of backups correctly and sorted by time (newest first)', () => {
        const mockBackups = [
            { id: '1', name: 'backup-older.json', time: 1000, size: 500 },
            { id: '2', name: 'backup-newer.json', time: 2000, size: 1024 },
        ];

        (useGlobalContext as jest.Mock).mockReturnValue({
            state: {
                spaceId: 'test-space',
                backups: mockBackups,
                loading: { loadingBackups: false },
                restoreMode: false,
                restoreProgress: { isActive: false },
            },
            dispatch: mockDispatch,
        });

        render(<BackupList />);

        // Should render both backups
        expect(screen.getByText('backup-older.json')).toBeInTheDocument();
        expect(screen.getByText('backup-newer.json')).toBeInTheDocument();

        // Should be sorted by time (newest first, based on implementation)
        const listItems = screen.getAllByRole('listitem');
        // The implementation sorts b.time - a.time
        expect(listItems[0]).toHaveTextContent('backup-newer.json');
        expect(listItems[1]).toHaveTextContent('backup-older.json');
    });

    it('shows loading spinner when loadingBackups is true', () => {
        (useGlobalContext as jest.Mock).mockReturnValue({
            state: {
                spaceId: 'test-space',
                backups: [],
                loading: { loadingBackups: true },
                restoreMode: false,
                restoreProgress: { isActive: false },
            },
            dispatch: mockDispatch,
        });

        render(<BackupList />);
        // Assuming CircularProgress has role="progressbar"
        expect(screen.getByRole('progressbar')).toBeInTheDocument();
        expect(screen.getByText('Loading backups...')).toBeInTheDocument();
    });
});
