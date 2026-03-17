import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SmartRestorePage from '../smart-restore';
import { mockFetch } from '@/utils/__tests__/test-helpers';

// Mock routing
jest.mock('next/router', () => ({
    useRouter: () => ({
        push: jest.fn(),
    }),
}));

// Mock hooks
jest.mock('@/hooks/useEnvironments', () => ({
    useEnvironments: () => ({
        environments: [{ id: 'master', name: 'master' }, { id: 'staging', name: 'staging' }],
        loadEnvironments: jest.fn(),
        loading: false,
    }),
}));

jest.mock('@/hooks/useSpaces', () => ({
    useSpaces: () => ({
        spaces: [{ id: 'space1', name: 'Space 1' }],
        loadSpaces: jest.fn(),
        loading: false,
    }),
}));

// Mock the main hook with a predictable state
const mockAutoDeps = new Set<string>();
const mockSelectedCTIds = new Set<string>();
const mockSelectedLocales = new Set<string>();
const mockTargetLocales = [{ name: 'English', code: 'en-US' }];

const mockSmartRestoreHook = {
    sourceSpaceId: 'space1',
    setSourceSpaceId: jest.fn(),
    sourceEnvironmentId: 'master',
    setSourceEnvironmentId: jest.fn(),
    targetSpaceId: 'space1',
    setTargetSpaceId: jest.fn(),
    targetEnvironmentId: 'staging',
    setTargetEnvironmentId: jest.fn(),

    status: 'idle',
    error: null,
    preview: null,
    logs: [],
    resultStats: null,

    selectedCTIds: mockSelectedCTIds,
    autoDeps: mockAutoDeps,
    selectedLocales: mockSelectedLocales,
    localeMapping: {},
    targetLocales: mockTargetLocales,

    actionMode: 'transfer',
    setActionMode: jest.fn(),
    options: { clearEnvironment: false, includeAssets: false, mergeMode: 'upsert' },
    setOptions: jest.fn(),

    loadPreview: jest.fn(),
    loadTargetLocales: jest.fn(),
    toggleCT: jest.fn(),
    toggleLocale: jest.fn(),
    selectAllCTs: jest.fn(),
    clearAllCTs: jest.fn(),
    executeTransfer: jest.fn(),
    executeExport: jest.fn(),
    hasSelection: false,
    isLoading: false,
    isDone: false,
};

jest.mock('@/components/PageHelp/PageHelp', () => ({
    PageHelp: () => <div data-testid="page-help">Help Content</div>
}));

jest.mock('@/components/ui/tooltip', () => ({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TooltipProvider: ({ children }: any) => <div data-testid="tooltip-provider">{children}</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Tooltip: ({ children }: any) => <div data-testid="tooltip">{children}</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TooltipTrigger: ({ children }: any) => <div data-testid="tooltip-trigger">{children}</div>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TooltipContent: ({ children }: any) => <div data-testid="tooltip-content">{children}</div>,
}));

jest.mock('@/context/GlobalContext', () => ({
    useGlobalContext: jest.fn(),
}));

jest.mock('@/hooks/useSmartRestore', () => ({
    useSmartRestore: () => mockSmartRestoreHook,
}));

// Mock standard components that might cause issues in Jest
jest.mock('@/components/SpaceSelector/SpaceSelector', () => {
    const MockSpaceSelector = () => <div data-testid="space-selector">Space Selector</div>;
    MockSpaceSelector.displayName = 'MockSpaceSelector';
    return MockSpaceSelector;
});
jest.mock('@/components/EnvironmentSelector/EnvironmentSelector', () => {
    const MockEnvSelector = ({ label, value }: { label: string, value: string }) => <div data-testid={`env-selector-${label}`}>{value}</div>;
    MockEnvSelector.displayName = 'MockEnvSelector';
    return MockEnvSelector;
});

describe('SmartRestorePage', () => {
    const mockDispatch = jest.fn();
    const { useGlobalContext } = require('@/context/GlobalContext');

    const renderWithContext = (ui: React.ReactElement, state = { spaceId: 'space1' }) => {
        useGlobalContext.mockReturnValue({
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            state: state as any,
            dispatch: mockDispatch,
        });
        return render(ui);
    };

    beforeEach(() => {
        jest.clearAllMocks();
        mockSmartRestoreHook.status = 'idle';
        mockSmartRestoreHook.preview = null;
        mockSmartRestoreHook.hasSelection = false;
        mockSmartRestoreHook.isLoading = false;
        mockSmartRestoreHook.isDone = false;
        mockSelectedCTIds.clear();
        mockFetch({ data: { environments: [] } });
    });

    it('renders the header and source environment selector initially', () => {
        renderWithContext(<SmartRestorePage />);

        expect(screen.getByText('Smart Restore')).toBeInTheDocument();
        expect(screen.getByTestId('env-selector-Source Environment')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /load preview/i })).toBeInTheDocument();
    });

    it('hides Load Preview button if source env is missing', () => {
        mockSmartRestoreHook.sourceEnvironmentId = '';
        renderWithContext(<SmartRestorePage />);

        const loadBtn = screen.queryByRole('button', { name: /load preview/i });
        expect(loadBtn).not.toBeInTheDocument();
    });

    it('calls loadPreview when the button is clicked', () => {
        mockSmartRestoreHook.sourceEnvironmentId = 'master';
        renderWithContext(<SmartRestorePage />);

        const loadBtn = screen.getByRole('button', { name: /load preview/i });
        fireEvent.click(loadBtn);

        expect(mockSmartRestoreHook.loadPreview).toHaveBeenCalledWith('space1', 'master');
    });

    it('displays the preview data when status is ready', () => {
        mockSmartRestoreHook.status = 'ready';
        mockSmartRestoreHook.preview = {
            totalContentTypes: 1,
            locales: [{ name: 'English', code: 'en-US', fallbackCode: null, default: true, optional: false }],
            contentTypes: [
                { id: 'page', name: 'Page CT', description: '', displayField: 'title', fields: [], totalEntries: 10, sampleTitles: [] }
            ],
            ctDependencyMap: {}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any;
        mockSmartRestoreHook.hasSelection = true;
        mockSelectedCTIds.add('page');

        renderWithContext(<SmartRestorePage />);

        // CT Selection Header (matches actual text in smart-restore.tsx)
        expect(screen.getByText('Content Selection')).toBeInTheDocument();
        expect(screen.getByText('Page CT')).toBeInTheDocument();
        // The transfer UI should appear
        expect(screen.getByText('Target Space')).toBeInTheDocument();
    });

    it('triggers executeTransfer when Live Transfer is initiated', async () => {
        mockSmartRestoreHook.status = 'ready';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        mockSmartRestoreHook.preview = { totalContentTypes: 1, locales: [], contentTypes: [], ctDependencyMap: {} } as any;
        mockSmartRestoreHook.actionMode = 'transfer';
        mockSmartRestoreHook.sourceSpaceId = 'source1';
        mockSmartRestoreHook.sourceEnvironmentId = 'env1';
        mockSmartRestoreHook.targetSpaceId = 'target1';
        mockSmartRestoreHook.targetEnvironmentId = 'env2';
        mockSmartRestoreHook.selectedCTIds.add('ct1');
        mockSmartRestoreHook.hasSelection = true;  // key gate: needed to show Phase 3 Action panel

        renderWithContext(<SmartRestorePage />);

        // Simulate clicking Execute Transfer
        const executeBtn = screen.getByRole('button', { name: /execute transfer/i });
        fireEvent.click(executeBtn);

        expect(mockSmartRestoreHook.executeTransfer).toHaveBeenCalledTimes(1);
    });
});
