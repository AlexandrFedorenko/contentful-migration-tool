import React from 'react';
import { render, screen, fireEvent, waitFor, act, cleanup } from '@testing-library/react';
import AdminLogsPage from '@/pages/dashboard/logs';
import '@testing-library/jest-dom';

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
const mockUseUser = jest.fn();
jest.mock('@clerk/nextjs', () => ({
    useUser: () => mockUseUser()
}));

// ─── useUserProfile ───────────────────────────────────────────────────────────
const mockUseUserProfile = jest.fn();
jest.mock('@/hooks/useUserProfile', () => ({
    useUserProfile: () => mockUseUserProfile()
}));

// ─── API ──────────────────────────────────────────────────────────────────────
const mockApiGet = jest.fn();
const mockApiPost = jest.fn();
const mockApiDelete = jest.fn();

jest.mock('@/utils/api', () => ({
    api: {
        get: (...args: unknown[]) => mockApiGet(...args),
        post: (...args: unknown[]) => mockApiPost(...args),
        delete: (...args: unknown[]) => mockApiDelete(...args)
    }
}));

// ─── Error Parser ─────────────────────────────────────────────────────────────
jest.mock('@/utils/errorParser', () => ({
    parseError: (msg: string) => ({ type: 'GENERIC', message: msg }),
    instructionToString: (i: { message: string }) => i.message
}));

// ─── Admin component stubs ────────────────────────────────────────────────────
jest.mock('@/components/Admin/SettingsCard', () => ({
    SettingsCard: () => <div data-testid="settings-card">Settings</div>
}));
jest.mock('@/components/Admin/UserManagement', () => ({
    UserManagement: () => <div data-testid="user-management">Users Tab Content</div>
}));
jest.mock('@/components/Admin/SupportManagement', () => ({
    SupportManagement: () => <div data-testid="support-management">Support Tab Content</div>
}));

// ─── Chart stubs ──────────────────────────────────────────────────────────────
jest.mock('@/components/Charts/ActivityChart', () => ({
    ActivityBarChart: () => <div data-testid="activity-bar-chart" />
}));

// ─── Toast ────────────────────────────────────────────────────────────────────
jest.mock('sonner', () => ({
    toast: { success: jest.fn(), error: jest.fn() }
}));

// ─── Sample Data ──────────────────────────────────────────────────────────────
const makeLogs = (n = 2) =>
    Array.from({ length: n }, (_, i) => ({
        id: `log-${i}`,
        level: i % 2 === 0 ? 'INFO' : 'ERROR',
        action: `ADMIN_ACTION_${i}`,
        message: `Admin log message ${i}`,
        details: null,
        status: i % 2 === 0 ? 'SUCCESS' : 'FAILED',
        userEmail: 'admin@example.com',
        timestamp: new Date('2024-01-15T10:00:00Z').toISOString(),
        logFile: undefined
    }));

const makeStats = (override = {}) => ({
    activity: [],
    summary: {
        totalUsers: 10,
        totalMigrations: 50,
        migrationSuccessRate: 95,
        admins: 2,
        members: 8,
        dbSize: '42 MB',
        diskUsage: '128 MB',
        ...override
    }
});

const stableAdminProfile = { role: 'ADMIN' };
const stableMemberProfile = { role: 'MEMBER' };

const stableUser = { id: 'admin_1', primaryEmailAddress: { emailAddress: 'admin@example.com' } };

function setupAdminMocks(logs = makeLogs(), stats = makeStats()) {
    mockUseUser.mockReturnValue({
        isLoaded: true,
        user: stableUser
    });
    mockUseUserProfile.mockReturnValue({ userProfile: stableAdminProfile });
    mockApiGet.mockImplementation((url: string) => {
        if (url.includes('/api/admin/logs')) return Promise.resolve({ success: true, data: { logs } });
        if (url.includes('/api/admin/stats')) return Promise.resolve({ success: true, data: stats });
        return Promise.resolve({ success: true, data: {} });
    });
    mockApiPost.mockResolvedValue({ success: true, data: { message: 'Done' } });
    mockApiDelete.mockResolvedValue({ success: true, data: {} });
}

// ─── Suite 1: Auth & Loading guards (standalone renders) ─────────────────────
describe('AdminLogsPage — auth guards', () => {
    beforeEach(() => { jest.clearAllMocks(); });
    afterEach(() => { cleanup(); });

    it('redirects to "/" when user is not logged in', async () => {
        mockUseUser.mockReturnValue({ isLoaded: true, user: null });
        mockUseUserProfile.mockReturnValue({ userProfile: null });
        mockApiGet.mockResolvedValue({ success: true, data: {} });

        await act(async () => { render(<AdminLogsPage />); });
        expect(mockPush).toHaveBeenCalledWith('/');
    });

    it('redirects non-admin users to "/"', async () => {
        mockUseUser.mockReturnValue({
            isLoaded: true,
            user: { id: 'u1' }
        });
        mockUseUserProfile.mockReturnValue({ userProfile: stableMemberProfile });
        mockApiGet.mockResolvedValue({ success: true, data: {} });

        await act(async () => { render(<AdminLogsPage />); });
        await waitFor(() => expect(mockPush).toHaveBeenCalledWith('/'));
    });

    it('shows loading spinner before stats arrive', () => {
        mockUseUser.mockReturnValue({ isLoaded: true, user: { id: 'a1' } });
        mockUseUserProfile.mockReturnValue({ userProfile: { role: 'ADMIN' } });
        mockApiGet.mockImplementation(() => new Promise(() => {}));

        render(<AdminLogsPage />);
        expect(screen.getByText('Loading System Dashboard...')).toBeInTheDocument();
    });
});

// ─── Suite 2: Full dashboard (shared render) ─────────────────────────────────
describe('AdminLogsPage — dashboard', () => {
    beforeEach(async () => {
        jest.clearAllMocks();
        setup();
        await act(async () => { render(<AdminLogsPage />); });
        // wait until the full dashboard is painted
        await waitFor(
            () => expect(screen.getByText('System Dashboard')).toBeInTheDocument(),
            { timeout: 15000 }
        );
    }, 30000);

    afterEach(() => { cleanup(); });

    function setup(logs = makeLogs(), stats = makeStats()) {
        setupAdminMocks(logs, stats);
    }

    it('renders System Dashboard title', () => {
        expect(screen.getByText('System Dashboard')).toBeInTheDocument();
    });

    it('renders SettingsCard component', () => {
        expect(screen.getByTestId('settings-card')).toBeInTheDocument();
    });

    it('renders all three tabs', () => {
        expect(screen.getByRole('tab', { name: /Activity Logs/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Users/i })).toBeInTheDocument();
        expect(screen.getByRole('tab', { name: /Support/i })).toBeInTheDocument();
    });

    it('renders log rows in the table', () => {
        expect(screen.getByText('ADMIN_ACTION_0')).toBeInTheDocument();
        expect(screen.getByText('ADMIN_ACTION_1')).toBeInTheDocument();
    });

    it('expands log row to show message on click', async () => {
        const row = screen.getByText('ADMIN_ACTION_0').closest('tr')!;
        await act(async () => { fireEvent.click(row); });
        await waitFor(() => expect(screen.getByText('Admin log message 0')).toBeInTheDocument());
    });

    it('updates search input value', () => {
        const input = screen.getByPlaceholderText('Search logs...');
        fireEvent.change(input, { target: { value: 'migration' } });
        expect(input).toHaveValue('migration');
    });

    it('calls api with search term when Filter clicked', async () => {
        fireEvent.change(screen.getByPlaceholderText('Search logs...'), {
            target: { value: 'migration' }
        });
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Filter/i }));
        });
        await waitFor(() => {
            expect(mockApiGet).toHaveBeenCalledWith(
                expect.stringContaining('search=migration')
            );
        });
    });

    it('re-fetches data on Refresh click', async () => {
        mockApiGet.mockClear();
        setupAdminMocks();
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Refresh/i }));
        });
        await waitFor(() => {
            expect(mockApiGet).toHaveBeenCalledWith(expect.stringContaining('/api/admin/logs'));
        });
    });

    it('opens Clear Logs dialog', async () => {
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Clear Logs/i }));
        });
        await waitFor(() => expect(screen.getByText('Clear System Logs')).toBeInTheDocument());
    });

    it('calls api.post when Confirm Clear clicked', async () => {
        await act(async () => {
            fireEvent.click(screen.getByRole('button', { name: /Clear Logs/i }));
        });
        await waitFor(() => screen.getByText('Confirm Clear'));
        await act(async () => { fireEvent.click(screen.getByText('Confirm Clear')); });
        await waitFor(() => {
            expect(mockApiPost).toHaveBeenCalledWith(
                '/api/admin/clear-logs',
                expect.objectContaining({ retention: expect.any(String) })
            );
        });
    });

    it('switches to Users tab and shows UserManagement stub', async () => {
        const usersTab = screen.getByRole('tab', { name: /Users/i });
        await act(async () => { fireEvent.click(usersTab); });
        await waitFor(() => expect(screen.getByTestId('user-management')).toBeInTheDocument());
    });

    it('switches to Support tab and shows SupportManagement stub', async () => {
        const supportTab = screen.getByRole('tab', { name: /Support/i });
        await act(async () => { fireEvent.click(supportTab); });
        await waitFor(() => expect(screen.getByTestId('support-management')).toBeInTheDocument());
    });

    it('collapses row on second click', async () => {
        const row = screen.getByText('ADMIN_ACTION_0').closest('tr')!;
        await act(async () => { fireEvent.click(row); }); // expand
        await waitFor(() => screen.getByText('Admin log message 0'));

        await act(async () => { fireEvent.click(row); }); // collapse
        await waitFor(() => {
            expect(screen.queryByText('Admin log message 0')).not.toBeInTheDocument();
        });
    });
});

// ─── Suite 3: Stat card values (separate renders per stat override) ─────────────
describe('AdminLogsPage — stat cards', () => {
    afterEach(() => { cleanup(); });

    it('renders default stat values', async () => {
        setupAdminMocks();
        await act(async () => { render(<AdminLogsPage />); });
        await waitFor(() => screen.getByText('System Dashboard'), { timeout: 15000 });

        expect(screen.getByText('Total Users')).toBeInTheDocument();
        expect(screen.getByText('10')).toBeInTheDocument();
        expect(screen.getByText('95%')).toBeInTheDocument();
    }, 20000);

    it('renders custom stat values', async () => {
        setupAdminMocks([], makeStats({ totalUsers: 42, migrationSuccessRate: 88, dbSize: '100 MB', diskUsage: '512 MB' }));
        await act(async () => { render(<AdminLogsPage />); });
        await waitFor(() => screen.getByText('System Dashboard'), { timeout: 15000 });

        expect(screen.getByText('42')).toBeInTheDocument();
        expect(screen.getByText('88%')).toBeInTheDocument();
        expect(screen.getByText('100 MB')).toBeInTheDocument();
        expect(screen.getByText('512 MB')).toBeInTheDocument();
    }, 20000);

    it('shows empty state when logs are empty', async () => {
        setupAdminMocks([]);
        await act(async () => { render(<AdminLogsPage />); });
        await waitFor(() => screen.getByText('System Dashboard'), { timeout: 15000 });
        expect(screen.getByText('No system logs found matching criteria')).toBeInTheDocument();
    }, 20000);
});
