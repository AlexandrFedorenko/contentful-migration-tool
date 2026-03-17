import { renderHook, act } from '@testing-library/react';
import { useSmartRestore, PreviewData } from '../useSmartRestore';
import { mockFetch } from '@/utils/__tests__/test-helpers';

describe('useSmartRestore', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    const mockPreviewData: PreviewData = {
        contentTypes: [
            { id: 'page', name: 'Page', description: '', displayField: 'title', fields: [], totalEntries: 10, sampleTitles: [] },
            { id: 'component', name: 'Component', description: '', displayField: 'name', fields: [], totalEntries: 5, sampleTitles: [] }
        ],
        locales: [
            { name: 'English', code: 'en-US', fallbackCode: null, default: true },
            { name: 'German', code: 'de', fallbackCode: 'en-US', default: false }
        ],
        ctDependencyMap: {
            'page': ['component']
        },
        totalContentTypes: 2
    };

    it('initializes with default state', () => {
        const { result } = renderHook(() => useSmartRestore());

        expect(result.current.status).toBe('idle');
        expect(result.current.preview).toBeNull();
        expect(result.current.selectedCTIds.size).toBe(0);
        expect(result.current.selectedLocales.size).toBe(0);
        expect(result.current.localeMapping).toEqual({});
        expect(result.current.actionMode).toBe('transfer');
    });

    it('loads preview successfully', async () => {
        mockFetch({ success: true, data: mockPreviewData });
        const { result } = renderHook(() => useSmartRestore());

        await act(async () => {
            await result.current.loadPreview('space123', 'env123');
        });

        expect(result.current.status).toBe('ready');
        expect(result.current.preview).toEqual(mockPreviewData);
        expect(global.fetch).toHaveBeenCalledWith('/api/smart-restore/cma-preview?spaceId=space123&environmentId=env123');
    });

    it('handles preview loading error', async () => {
        mockFetch({ success: false, error: 'API Error' });
        const { result } = renderHook(() => useSmartRestore());

        await act(async () => {
            await result.current.loadPreview('space123', 'env123');
        });

        expect(result.current.status).toBe('error');
        expect(result.current.error).toBe('API Error');
    });

    it('toggles content types and auto-resolves dependencies', async () => {
        mockFetch({ success: true, data: mockPreviewData });
        const { result } = renderHook(() => useSmartRestore());

        await act(async () => {
            await result.current.loadPreview('space123', 'env123');
        });

        // Select 'page'
        act(() => {
            result.current.toggleCT('page', true);
        });

        // Should auto-select 'component' because of dependency
        expect(result.current.selectedCTIds.has('page')).toBe(true);
        expect(result.current.selectedCTIds.has('component')).toBe(true);
        expect(result.current.autoDeps.has('component')).toBe(true);

        // Deselect 'page'
        act(() => {
            result.current.toggleCT('page', false);
        });

        // Should unselect both
        expect(result.current.selectedCTIds.has('page')).toBe(false);
        expect(result.current.autoDeps.has('component')).toBe(false);
    });

    it('handles select all / clear all content types', async () => {
        mockFetch({ success: true, data: mockPreviewData });
        const { result } = renderHook(() => useSmartRestore());

        await act(async () => {
            await result.current.loadPreview('space', 'env');
        });

        act(() => {
            result.current.selectAllCTs();
        });
        expect(result.current.selectedCTIds.size).toBe(2);

        act(() => {
            result.current.clearAllCTs();
        });
        expect(result.current.selectedCTIds.size).toBe(0);
    });

    it('toggles locales correctly, including implicit select all logic', async () => {
        mockFetch({ success: true, data: mockPreviewData });
        const { result } = renderHook(() => useSmartRestore());

        await act(async () => {
            await result.current.loadPreview('space123', 'env123');
        });

        // Initially empty = "implicit all"
        expect(result.current.selectedLocales.size).toBe(0);

        // Uncheck 'de' -> forces explicit selection of remaining ones ('en-US')
        act(() => {
            result.current.toggleLocale('de', false);
        });

        expect(result.current.selectedLocales.has('en-US')).toBe(true);
        expect(result.current.selectedLocales.has('de')).toBe(false);
        expect(result.current.selectedLocales.size).toBe(1);

        // Add 'de' explicitly
        act(() => {
            result.current.toggleLocale('de', true);
        });
        expect(result.current.selectedLocales.has('de')).toBe(true);
        expect(result.current.selectedLocales.size).toBe(2);
    });

    it('loads target locales and auto-suggests mapping', async () => {
        mockFetch({ success: true, data: mockPreviewData });
        const { result } = renderHook(() => useSmartRestore());

        await act(async () => {
            await result.current.loadPreview('sourceSpace', 'sourceEnv'); // loads en-US, de-DE
        });

        // Mock target env having 'de-CH' instead of 'de-DE'
        const targetData = {
            ...mockPreviewData,
            locales: [
                { name: 'English', code: 'en-US', fallbackCode: null, default: true },
                { name: 'German (CH)', code: 'de-CH', fallbackCode: 'en-US', default: false }
            ]
        };
        mockFetch({ success: true, data: targetData });

        await act(async () => {
            await result.current.loadTargetLocales('targetSpace', 'targetEnv');
        });

        // Should suggest mapping de to de-CH
        expect(result.current.localeMapping['de']).toBe('de-CH');
        expect(result.current.targetLocales.length).toBe(2);
        expect(result.current.targetLocales[1].code).toBe('de-CH');
    });
});
