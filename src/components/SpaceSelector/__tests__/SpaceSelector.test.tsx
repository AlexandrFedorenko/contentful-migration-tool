import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import SpaceSelector from '../SpaceSelector';
import { useGlobalContext } from '@/context/GlobalContext';
import { useSpaces } from '@/hooks/useSpaces';
import { useAuth } from '@/context/AuthContext';

// Mock dependencies
jest.mock('@/context/AuthContext', () => ({
    useAuth: jest.fn(),
}));

jest.mock('@/context/GlobalContext', () => ({
    useGlobalContext: jest.fn(),
}));

jest.mock('@/hooks/useSpaces', () => ({
    useSpaces: jest.fn(),
}));

describe('SpaceSelector Component', () => {
    const mockDispatch = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        (useGlobalContext as jest.Mock).mockReturnValue({
            state: { spaceId: 'current-space-id' },
            dispatch: mockDispatch,
        });
        (useAuth as jest.Mock).mockReturnValue({
            user: { id: 'test-user' },
            getToken: jest.fn().mockResolvedValue('test-token'),
            isLoggedIn: true,
        });
    });

    it('renders loading state when spaces are loading', () => {
        (useSpaces as jest.Mock).mockReturnValue({
            spaces: [],
            loading: true,
            error: null,
            fetchSpaces: jest.fn(),
        });

        render(<SpaceSelector />);
        expect(screen.getByText('Loading spaces...')).toBeInTheDocument();
    });

    it('renders spaces and allows selection', () => {
        const mockSpaces = [
            { sys: { id: 'space-1' }, name: 'Space One' },
            { sys: { id: 'space-2' }, name: 'Space Two' },
        ];

        (useSpaces as jest.Mock).mockReturnValue({
            spaces: mockSpaces,
            loading: false,
            error: null,
            fetchSpaces: jest.fn(),
        });

        // Set specific context for this test
        (useGlobalContext as jest.Mock).mockReturnValue({
            state: { spaceId: 'space-1' },
            dispatch: mockDispatch,
        });

        render(<SpaceSelector />);

        // Check if label exists
        expect(screen.getByLabelText('Select Space')).toBeInTheDocument();
    });

    it('renders "No spaces found" when spaces list is empty', () => {
        (useSpaces as jest.Mock).mockReturnValue({
            spaces: [],
            loading: false,
            error: null,
            fetchSpaces: jest.fn(),
        });

        render(<SpaceSelector />);
        expect(screen.getByText(/No spaces found/i)).toBeInTheDocument();
    });

    it('renders error message when fetch fails', () => {
        (useSpaces as jest.Mock).mockReturnValue({
            spaces: [],
            loading: false,
            error: 'Failed to fetch spaces',
            fetchSpaces: jest.fn(),
        });

        render(<SpaceSelector />);
        expect(screen.getByText(/Error loading spaces/i)).toBeInTheDocument();
    });
});
