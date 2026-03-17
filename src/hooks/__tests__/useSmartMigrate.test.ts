import { renderHook, act } from '@testing-library/react';
import { DiffEntriesResult, useSmartMigrate } from '../useSmartMigrate';
import { MigrateDiffResult } from '@/types/smart-migrate';

// Mock locale mapping utility
jest.mock('@/utils/locale-filter', () => ({
    autoSuggestLocaleMapping: jest.fn(() => ({})),
}));

describe('useSmartMigrate hook', () => {
    let mockFetch: jest.Mock;

    const mockDiff: MigrateDiffResult = {
        contentTypes: [
            { id: 'ct1', name: 'CT 1', diffStatus: 'EQUAL', totalSourceEntries: 10, totalTargetEntries: 10, changedEntryCount: 0, equalEntryCount: 10, deletedEntryCount: 0, entryDiffs: [], fields: [], displayField: 'title', description: '' },
            { id: 'ct2', name: 'CT 2', diffStatus: 'MODIFIED', totalSourceEntries: 5, totalTargetEntries: 5, changedEntryCount: 0, equalEntryCount: 5, deletedEntryCount: 0, entryDiffs: [], fields: [], displayField: 'title', description: '' }
        ],
        locales: [],
        sourceLocales: [],
        targetLocales: [],
        ctDependencyMap: { 'ct1': ['ct2'] },
        summary: {
            newCTs: 0, modifiedCTs: 1, deletedCTs: 0, equalCTs: 1,
            newLocales: 0, modifiedLocales: 0, deletedLocales: 0,
            newEntries: 0, modifiedEntries: 0, deletedEntries: 0, equalEntries: 15
        }
    };

    const mockEntries: DiffEntriesResult = {
        entries: [
            { id: 'e1', title: 'Entry 1', diffStatus: 'MODIFIED', fields: {}, sys: { version: 1, updatedAt: '', contentTypeId: 'ct1' } }
        ],
        resolvedAssets: {},
        resolvedEntries: {}
    };

    beforeEach(() => {
        mockFetch = jest.fn().mockImplementation((url: string) => {
            if (url.includes('/api/smart-migrate/cma-diff')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, data: mockDiff })
                });
            }
            if (url.includes('/api/smart-migrate/diff-entries')) {
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, data: mockEntries })
                });
            }
            return Promise.resolve({
                ok: true,
                json: async () => ({ success: true, data: {} })
            });
        });
        global.fetch = mockFetch;
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('initializes with default state', () => {
        const { result } = renderHook(() => useSmartMigrate());
        expect(result.current.status).toBe('idle');
        expect(result.current.diff).toBeNull();
        expect(result.current.selectedCTIds.size).toBe(0);
    });

    it('loads diff and sets status to ready', async () => {
        const { result } = renderHook(() => useSmartMigrate());

        await act(async () => {
            result.current.setSourceSpaceId('s1');
            result.current.setSourceEnvironmentId('e1');
            result.current.setTargetSpaceId('s2');
            result.current.setTargetEnvironmentId('e2');
            await result.current.loadDiff('s1', 'e1', 's2', 'e2');
        });

        expect(result.current.status).toBe('ready');
        expect(result.current.diff).toEqual(mockDiff);
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('/api/smart-migrate/cma-diff'));
    });

    it('automatically triggers background loading for CTs with entries', async () => {
        const { result } = renderHook(() => useSmartMigrate());

        await act(async () => {
            result.current.setSourceSpaceId('s1');
            result.current.setSourceEnvironmentId('e1');
            result.current.setTargetSpaceId('s1');
            result.current.setTargetEnvironmentId('e2');
            await result.current.loadDiff('s1', 'e1', 's1', 'e2');
        });

        await act(async () => {
            jest.runAllTimers();
        });

        expect(result.current.analyzedCTs.has('ct1')).toBe(true);
        expect(result.current.analyzedCTs.has('ct2')).toBe(true);
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('contentTypeId=ct1'));
        expect(mockFetch).toHaveBeenCalledWith(expect.stringContaining('contentTypeId=ct2'));
    });

    it('toggles CT and handles dependencies', async () => {
        const { result } = renderHook(() => useSmartMigrate());

        await act(async () => {
            result.current.setSourceSpaceId('s1');
            result.current.setSourceEnvironmentId('e1');
            result.current.setTargetSpaceId('s1');
            result.current.setTargetEnvironmentId('e2');
            await result.current.loadDiff('s1', 'e1', 's1', 'e2');
        });

        act(() => {
            result.current.toggleCT('ct1', true);
        });

        expect(result.current.selectedCTIds.has('ct1')).toBe(true);
        expect(result.current.selectedCTIds.has('ct2')).toBe(true);
        expect(result.current.autoDeps.has('ct2')).toBe(true);
    });

    it('selects all changed items correctly', async () => {
        const { result } = renderHook(() => useSmartMigrate());

        await act(async () => {
            result.current.setSourceSpaceId('s1');
            result.current.setSourceEnvironmentId('e1');
            result.current.setTargetSpaceId('s1');
            result.current.setTargetEnvironmentId('e2');
            await result.current.loadDiff('s1', 'e1', 's1', 'e2');
            // Background loading needs to finish for entriesMap to be populated
            jest.runAllTimers();
        });

        act(() => {
            result.current.selectAllChanged();
        });

        expect(result.current.selectedCTIds.has('ct2')).toBe(true);
        expect(result.current.selectedCTIds.has('ct1')).toBe(false);
    });
});
