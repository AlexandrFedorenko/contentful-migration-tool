import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ProfilePage from '@/pages/dashboard/profile';
import '@testing-library/jest-dom';
import { navigateTo } from '@/utils/navigation';

jest.setTimeout(30000);

// ─── Router ──────────────────────────────────────────────────────────────────
const mockPush = jest.fn();
const mockRouter = {
    push: mockPush,
    query: {},
    isReady: true
};
jest.mock('next/router', () => ({
    useRouter: () => mockRouter
}));

// ─── Clerk ────────────────────────────────────────────────────────────────────
const mockSetProfileImage = jest.fn();
const mockOpenUserProfile = jest.fn();
const mockSignOut = jest.fn();

const stableUser = {
    fullName: 'Test User',
    firstName: 'Test',
    primaryEmailAddress: { emailAddress: 'test@example.com' },
    imageUrl: 'test-image.jpg',
    setProfileImage: mockSetProfileImage
};

jest.mock('@clerk/nextjs', () => ({
    useUser: () => ({
        isLoaded: true,
        user: stableUser
    }),
    useClerk: () => ({
        openUserProfile: mockOpenUserProfile,
        signOut: mockSignOut
    })
}));

// ─── Store ────────────────────────────────────────────────────────────────────
const mockDispatch = jest.fn();
jest.mock('@/store/useStore', () => ({
    useStore: () => ({
        dispatch: mockDispatch
    })
}));

// ─── Navigation ───────────────────────────────────────────────────────────────
jest.mock('@/utils/navigation', () => ({
    navigateTo: jest.fn()
}));

// ─── API ──────────────────────────────────────────────────────────────────────
const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiPut = jest.fn();
const mockApiDelete = jest.fn();

jest.mock('@/utils/api', () => ({
    api: {
        get: (...args: unknown[]) => mockApiGet(...args),
        post: (...args: unknown[]) => mockApiPost(...args),
        put: (...args: unknown[]) => mockApiPut(...args),
        delete: (...args: unknown[]) => mockApiDelete(...args),
    }
}));

// ─── Error Parser ─────────────────────────────────────────────────────────────
jest.mock('@/utils/errorParser', () => ({
    parseError: (msg: string) => ({ type: 'GENERIC', message: msg }),
    instructionToString: (i: { message: string }) => i.message
}));

// ─── UI stubs ─────────────────────────────────────────────────────────────────
jest.mock('@/components/PageHelp/PageHelp', () => ({
    PageHelp: () => <div data-testid="page-help">Help</div>
}));

jest.mock('@/components/Charts/ActivityChart', () => ({
    ActivityBarChart: () => <div data-testid="activity-bar-chart" />,
    RingChart: () => <div data-testid="ring-chart" />
}));

// ─── toast ────────────────────────────────────────────────────────────────────
jest.mock('sonner', () => ({
    toast: {
        success: jest.fn(),
        error: jest.fn(),
        warning: jest.fn()
    }
}));

// ─── useUserProfile ───────────────────────────────────────────────────────────
const mockUseUserProfile = jest.fn();
const stableProfile = { role: 'USER' };

jest.mock('@/hooks/useUserProfile', () => ({
    useUserProfile: () => mockUseUserProfile()
}));


// ─── Helpers ─────────────────────────────────────────────────────────────────
const defaultProfileResponse = {
    success: true,
    data: {
        isContentfulTokenSet: true,
        backupCount: 5,
        displayName: 'Test User',
        stats: null
    }
};

const defaultTokensResponse = { success: true, data: [] };
const defaultLogsResponse = { success: true, data: { logs: [] } };

function setupApiDefaults() {
    mockApiGet.mockImplementation((url: string) => {
        if (url.includes('/api/user/profile')) return Promise.resolve(defaultProfileResponse);
        if (url.includes('/api/user/tokens')) return Promise.resolve(defaultTokensResponse);
        if (url.includes('/api/user/logs')) return Promise.resolve(defaultLogsResponse);
        return Promise.resolve({ success: true, data: {} });
    });
    mockApiPost.mockResolvedValue({ success: true, data: {} });
    mockApiPut.mockResolvedValue({ success: true, data: {} });
    mockApiDelete.mockResolvedValue({ success: true, data: {} });
}


// ─── Suite ───────────────────────────────────────────────────────────────────
describe('ProfilePage', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockUseUserProfile.mockReturnValue({
            userProfile: stableProfile,
            isLoading: false,
            profileError: null
        });
        setupApiDefaults();
        // Suppress localStorage issues in JSDOM
        Storage.prototype.getItem = jest.fn(() => null);
        Storage.prototype.setItem = jest.fn();
        Storage.prototype.removeItem = jest.fn();
    });

    // ── Rendering ────────────────────────────────────────────────────────────

    it('renders profile page header', async () => {
        await act(async () => { render(<ProfilePage />); });

        await waitFor(() => {
            expect(screen.getByText('Profile & Settings')).toBeInTheDocument();
        });
    });

    it('shows loading spinner while fetching', () => {
        // Make api hang so loading doesn't resolve
        mockApiGet.mockImplementation(() => new Promise(() => {}));
        render(<ProfilePage />);
        expect(screen.getByText('Loading Profile...')).toBeInTheDocument();
    });

    it('displays user email', async () => {
        await act(async () => { render(<ProfilePage />); });
        await waitFor(() => screen.getByText('Profile & Settings'));

        expect(screen.getByLabelText('Login Email')).toHaveValue('test@example.com');
    });

    // ── Token status ─────────────────────────────────────────────────────────

    it('displays "Not Set" badge when token missing', async () => {
        mockApiGet.mockImplementation((url: string) => {
            if (url.includes('/api/user/profile')) return Promise.resolve({ success: true, data: { isContentfulTokenSet: false, backupCount: 0 } });
            if (url.includes('/api/user/tokens')) return Promise.resolve(defaultTokensResponse);
            if (url.includes('/api/user/logs')) return Promise.resolve(defaultLogsResponse);
            return Promise.resolve({ success: true, data: {} });
        });

        await act(async () => { render(<ProfilePage />); });
        await waitFor(() => expect(screen.getByText('Not Set')).toBeInTheDocument());
    });

    it('displays "Connected" badge when token is set', async () => {
        mockApiGet.mockImplementation((url: string) => {
            if (url.includes('/api/user/profile')) return Promise.resolve({ success: true, data: { isContentfulTokenSet: true, backupCount: 3 } });
            if (url.includes('/api/user/tokens')) return Promise.resolve(defaultTokensResponse);
            if (url.includes('/api/user/logs')) return Promise.resolve(defaultLogsResponse);
            return Promise.resolve({ success: true, data: {} });
        });

        await act(async () => { render(<ProfilePage />); });
        await waitFor(() => expect(screen.getByText('Connected')).toBeInTheDocument());
    });

    // ── Token list ───────────────────────────────────────────────────────────

    it('renders saved tokens when returned by API', async () => {
        const tokens = [
            { id: 'tok1', alias: 'Production CMS', isActive: true, createdAt: new Date().toISOString() },
            { id: 'tok2', alias: 'Staging CMS', isActive: false, createdAt: new Date().toISOString() }
        ];
        mockApiGet.mockImplementation((url: string) => {
            if (url.includes('/api/user/tokens')) return Promise.resolve({ success: true, data: tokens });
            if (url.includes('/api/user/profile')) return Promise.resolve(defaultProfileResponse);
            if (url.includes('/api/user/logs')) return Promise.resolve(defaultLogsResponse);
            return Promise.resolve({ success: true, data: {} });
        });

        await act(async () => { render(<ProfilePage />); });
        await waitFor(() => expect(screen.getByText('Production CMS')).toBeInTheDocument());
        expect(screen.getByText('Staging CMS')).toBeInTheDocument();
        expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });

    it('shows "No environments" message when token list is empty', async () => {
        await act(async () => { render(<ProfilePage />); });
        await waitFor(() =>
            expect(screen.getByText('No environments connected yet.')).toBeInTheDocument()
        );
    });

    // ── Add token ────────────────────────────────────────────────────────────

    it('calls api.post when adding a new token', async () => {
        await act(async () => { render(<ProfilePage />); });
        await waitFor(() => screen.getByPlaceholderText('e.g. Production CMS'));

        fireEvent.change(screen.getByPlaceholderText('e.g. Production CMS'), {
            target: { value: 'My CMS' }
        });
        fireEvent.change(screen.getByPlaceholderText('CFPAT-...'), {
            target: { value: 'CFPAT-mytoken' }
        });

        const addBtn = screen.getByText('Establish Connection').closest('button')!;
        await act(async () => { fireEvent.click(addBtn); });

        expect(mockApiPost).toHaveBeenCalledWith('/api/user/tokens', {
            alias: 'My CMS',
            token: 'CFPAT-mytoken'
        });
    });

    // ── Activate token ────────────────────────────────────────────────────────

    it('calls api.put to activate an inactive token', async () => {
        const tokens = [
            { id: 'tok1', alias: 'Production CMS', isActive: true, createdAt: new Date().toISOString() },
            { id: 'tok2', alias: 'Staging CMS', isActive: false, createdAt: new Date().toISOString() }
        ];
        mockApiGet.mockImplementation((url: string) => {
            if (url.includes('/api/user/tokens')) return Promise.resolve({ success: true, data: tokens });
            if (url.includes('/api/user/profile')) return Promise.resolve(defaultProfileResponse);
            if (url.includes('/api/user/logs')) return Promise.resolve(defaultLogsResponse);
            return Promise.resolve({ success: true, data: {} });
        });

        await act(async () => { render(<ProfilePage />); });
        await waitFor(() => screen.getByTitle('Activate this workspace'));

        const activateBtn = screen.getByTitle('Activate this workspace');
        await act(async () => { fireEvent.click(activateBtn); });

        expect(mockApiPut).toHaveBeenCalledWith('/api/user/tokens', {
            id: 'tok2',
            action: 'activate'
        });
    });

    // ── Display name edit ────────────────────────────────────────────────────

    it('display name input is disabled by default (not in edit mode)', async () => {
        await act(async () => { render(<ProfilePage />); });
        await waitFor(() => screen.getByText('Profile & Settings'));

        const nameInput = screen.getByLabelText(/Display Name/i) as HTMLInputElement;
        expect(nameInput.disabled).toBe(true);
    });

    // ── Download zip ─────────────────────────────────────────────────────────

    it('calls navigateTo for zip download', async () => {
        mockApiGet.mockImplementation((url: string) => {
            if (url.includes('/api/user/profile')) return Promise.resolve({
                success: true, data: { isContentfulTokenSet: true, backupCount: 5 }
            });
            if (url.includes('/api/user/tokens')) return Promise.resolve(defaultTokensResponse);
            if (url.includes('/api/user/logs')) return Promise.resolve(defaultLogsResponse);
            return Promise.resolve({ success: true, data: {} });
        });

        await act(async () => { render(<ProfilePage />); });
        await waitFor(() => screen.getByText('Download All Backups (.zip)'));

        fireEvent.click(screen.getByText('Download All Backups (.zip)'));
        expect(navigateTo).toHaveBeenCalledWith('/api/download-backup-zip?spaceId=all');
    });

    // ── Support form ──────────────────────────────────────────────────────────

    it('submits support message via api.post', async () => {
        await act(async () => { render(<ProfilePage />); });
        await waitFor(() => screen.getByText('Profile & Settings'));

        const messageArea = screen.getByPlaceholderText("Tell us what's happening...");
        fireEvent.change(messageArea, { target: { value: 'I have a problem' } });

        // Button text is 'Submit Support Ticket'
        const sendBtn = screen.getByRole('button', { name: /Submit Support Ticket/i });
        await act(async () => { fireEvent.click(sendBtn); });

        expect(mockApiPost).toHaveBeenCalledWith(
            '/api/user/support',
            expect.objectContaining({ message: 'I have a problem' })
        );
    });

    // ── Activity chart ────────────────────────────────────────────────────────

    it('renders activity chart when stats are present', async () => {
        mockApiGet.mockImplementation((url: string) => {
            if (url.includes('/api/user/profile')) return Promise.resolve({
                success: true,
                data: {
                    isContentfulTokenSet: true,
                    backupCount: 2,
                    displayName: 'Test User',
                    stats: {
                        totalActions: 10,
                        successRate: 80,
                        activity: [{ date: '2024-01-01', success: 8, error: 2, total: 10 }]
                    }
                }
            });
            if (url.includes('/api/user/tokens')) return Promise.resolve({ success: true, data: [] });
            if (url.includes('/api/user/logs')) return Promise.resolve({ success: true, data: { logs: [] } });
            return Promise.resolve({ success: true, data: {} });
        });

        await act(async () => { render(<ProfilePage />); });

        await waitFor(
            () => expect(screen.getByTestId('activity-bar-chart')).toBeInTheDocument(),
            { timeout: 10000 }
        );
        expect(screen.getByTestId('ring-chart')).toBeInTheDocument();
    }, 20000);

    // ── Destructive Actions ──────────────────────────────────────────────────

    it('opens delete confirmation and calls api.delete when token deleted', async () => {
        const tokens = [{ id: 'tok1', alias: 'CMS to Delete', isActive: false, createdAt: new Date().toISOString() }];
        mockApiGet.mockImplementation((url: string) => {
            if (url.includes('/api/user/tokens')) return Promise.resolve({ success: true, data: tokens });
            return Promise.resolve(defaultProfileResponse);
        });

        await act(async () => { render(<ProfilePage />); });
        await waitFor(() => screen.getByTitle('Delete Integration'));

        fireEvent.click(screen.getByTitle('Delete Integration'));

        // The dialog should appear (using Dialog from shadcn)
        expect(screen.getByText(/Are you sure you want to delete/i)).toBeInTheDocument();
        
        // Find and click the confirm button
        const confirmBtn = screen.getByRole('button', { name: /Delete Token/i });
        await act(async () => { fireEvent.click(confirmBtn); });

        expect(mockApiDelete).toHaveBeenCalledWith(expect.stringContaining('/api/user/tokens?id=tok1'));
    });

    it('typing DELETE and clicking delete account calls api.delete and signOut', async () => {
        await act(async () => { render(<ProfilePage />); });
        await waitFor(() => screen.getByText('Danger Zone'));

        const input = screen.getByPlaceholderText('DELETE');
        fireEvent.change(input, { target: { value: 'DELETE' } });

        const deleteBtn = screen.getByRole('button', { name: /Delete My Account and All Data/i });
        await act(async () => { fireEvent.click(deleteBtn); });

        expect(mockApiDelete).toHaveBeenCalledWith('/api/user/delete');
        await waitFor(() => {
            expect(mockSignOut).toHaveBeenCalled();
        });
    });
});
