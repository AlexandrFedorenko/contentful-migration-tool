import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import Dashboard from '@/pages/dashboard/index';
import '@testing-library/jest-dom';

jest.setTimeout(30000);

// ─── Router ──────────────────────────────────────────────────────────────────
const mockPush = jest.fn();
jest.mock('next/router', () => ({
    useRouter: () => ({
        push: mockPush,
        pathname: '/dashboard'
    })
}));

// ─── Clerk ────────────────────────────────────────────────────────────────────
const mockUseUser = jest.fn();
const stableUser = { 
    id: 'user_1',
    firstName: 'Test', 
    fullName: 'Test User',
    primaryEmailAddress: { emailAddress: 'test@example.com' } 
};

jest.mock('@clerk/nextjs', () => ({
    useUser: () => mockUseUser()
}));

// ─── useUserProfile ───────────────────────────────────────────────────────────
const mockUseUserProfile = jest.fn();
jest.mock('@/hooks/useUserProfile', () => ({
    useUserProfile: () => mockUseUserProfile()
}));

// ─── Helpers ─────────────────────────────────────────────────────────────────
const stableMemberProfile = { role: 'USER', isContentfulTokenSet: true, displayName: null };
const stableAdminProfile = { role: 'ADMIN', isContentfulTokenSet: true, displayName: null };

function setupUser(role: string = 'USER', extra: Record<string, unknown> = {}) {
    mockUseUser.mockReturnValue({
        isLoaded: true,
        isSignedIn: true,
        user: stableUser
    });
    mockUseUserProfile.mockReturnValue({
        userProfile: role === 'ADMIN' ? { ...stableAdminProfile, ...extra } : { ...stableMemberProfile, ...extra },
        isLoading: false,
        profileError: null
    });
}

describe('Dashboard Page', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        // Reset localStorage mock
        Storage.prototype.getItem = jest.fn(() => null);
        Storage.prototype.setItem = jest.fn();
        Storage.prototype.removeItem = jest.fn();
    });

    // ── Loading/Auth ──────────────────────────────────────────────────────────

    it('shows loading state when Clerk is not ready', () => {
        mockUseUser.mockReturnValue({ isLoaded: false, isSignedIn: false });
        mockUseUserProfile.mockReturnValue({ userProfile: null, isLoading: true, profileError: null });
        render(<Dashboard />);
        expect(screen.getByText('Loading Dashboard...')).toBeInTheDocument();
    });

    it('shows loading state while profile is still loading', () => {
        mockUseUser.mockReturnValue({ isLoaded: true, isSignedIn: true, user: { firstName: 'Test' } });
        mockUseUserProfile.mockReturnValue({ userProfile: null, isLoading: true, profileError: null });
        render(<Dashboard />);
        expect(screen.getByText('Loading Dashboard...')).toBeInTheDocument();
    });

    it('redirects to /dashboard/profile when token is not set', async () => {
        mockUseUser.mockReturnValue({
            isLoaded: true,
            isSignedIn: true,
            user: { firstName: 'Test' }
        });
        mockUseUserProfile.mockReturnValue({
            userProfile: { role: 'USER', isContentfulTokenSet: false, displayName: null },
            isLoading: false,
            profileError: null
        });

        await act(async () => { render(<Dashboard />); });

        await waitFor(() => {
            expect(mockPush).toHaveBeenCalledWith({
                pathname: '/dashboard/profile',
                query: { setup: 'required' }
            });
        });
    });

    it('does not redirect when token is set', async () => {
        setupUser('USER');
        await act(async () => { render(<Dashboard />); });
        await waitFor(() => screen.getByText(/Welcome/i));
        expect(mockPush).not.toHaveBeenCalledWith(expect.objectContaining({ pathname: '/dashboard/profile' }));
    });

    // ── Rendering ─────────────────────────────────────────────────────────────

    it('renders welcome message with display name from displayName field', async () => {
        mockUseUser.mockReturnValue({ isLoaded: true, isSignedIn: true, user: { firstName: 'Test' } });
        mockUseUserProfile.mockReturnValue({
            userProfile: { role: 'USER', isContentfulTokenSet: true, displayName: 'Alex' },
            isLoading: false,
            profileError: null
        });

        await act(async () => { render(<Dashboard />); });
        await waitFor(() => expect(screen.getByText('Welcome, Alex')).toBeInTheDocument());
    });

    it('renders welcome message with firstName when displayName is null', async () => {
        setupUser('USER');
        await act(async () => { render(<Dashboard />); });
        await waitFor(() => expect(screen.getByText('Welcome, Test')).toBeInTheDocument());
    });

    it('renders display name from localStorage cache', async () => {
        (Storage.prototype.getItem as jest.Mock).mockReturnValue('CachedName');
        setupUser('USER');
        await act(async () => { render(<Dashboard />); });
        await waitFor(() => expect(screen.getByText('Welcome, CachedName')).toBeInTheDocument());
    });

    it('renders standard tool cards', async () => {
        setupUser('USER');
        await act(async () => { render(<Dashboard />); });
        await waitFor(() => screen.getByText(/Welcome/i));

        expect(screen.getByText('Create Backup')).toBeInTheDocument();
        expect(screen.getByText('Restore Backup')).toBeInTheDocument();
        expect(screen.getByText('Smart Restore')).toBeInTheDocument();
        expect(screen.getByText('Smart Migrate')).toBeInTheDocument();
        expect(screen.getByText('Visual Builder')).toBeInTheDocument();
        expect(screen.getByText('Views Migrate')).toBeInTheDocument();
    });

    it('renders management cards (always visible)', async () => {
        setupUser('USER');
        await act(async () => { render(<Dashboard />); });
        await waitFor(() => screen.getByText(/Welcome/i));

        expect(screen.getByText('Backups History')).toBeInTheDocument();
        expect(screen.getByText('Profile & Settings')).toBeInTheDocument();
        expect(screen.getByText('My Logs')).toBeInTheDocument();
    });

    // ── Admin-only card ───────────────────────────────────────────────────────

    it('does NOT show "Admin Logs" card for standard USER', async () => {
        setupUser('USER');
        await act(async () => { render(<Dashboard />); });
        await waitFor(() => screen.getByText(/Welcome/i));

        expect(screen.queryByText('Admin Logs')).not.toBeInTheDocument();
    });

    it('shows "Admin Logs" card for ADMIN role', async () => {
        setupUser('ADMIN');
        await act(async () => { render(<Dashboard />); });
        await waitFor(() => screen.getByText(/Welcome/i));

        expect(screen.getByText('Admin Logs')).toBeInTheDocument();
    });

    // ── Card navigation ───────────────────────────────────────────────────────

    it('navigates to /backup when Create Backup card is clicked', async () => {
        setupUser('USER');
        await act(async () => { render(<Dashboard />); });
        await waitFor(() => screen.getByText('Create Backup'));

        fireEvent.click(screen.getByText('Create Backup').closest('[class*="cursor-pointer"]')!);
        expect(mockPush).toHaveBeenCalledWith('/backup');
    });

    it('navigates to /dashboard/profile when Profile & Settings card is clicked', async () => {
        setupUser('USER');
        await act(async () => { render(<Dashboard />); });
        await waitFor(() => screen.getByText('Profile & Settings'));

        fireEvent.click(screen.getByText('Profile & Settings').closest('[class*="cursor-pointer"]')!);
        expect(mockPush).toHaveBeenCalledWith('/dashboard/profile');
    });

    // ── Error recovery ────────────────────────────────────────────────────────

    it('shows dashboard (not stuck loading) when profile fetch fails', async () => {
        mockUseUser.mockReturnValue({ isLoaded: true, isSignedIn: true, user: { firstName: 'Test' } });
        mockUseUserProfile.mockReturnValue({
            userProfile: null,
            isLoading: false,
            profileError: new Error('Network error')
        });

        await act(async () => { render(<Dashboard />); });
        // Should not be stuck loading and not redirect
        await waitFor(() => expect(screen.getByText(/Welcome/i)).toBeInTheDocument());
    });
});
