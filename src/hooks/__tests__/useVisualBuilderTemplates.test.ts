import { renderHook, act } from '@testing-library/react';
import { useVisualBuilderTemplates } from '../useVisualBuilderTemplates';

// Setup global fetch mock
global.fetch = jest.fn();

describe('useVisualBuilderTemplates', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('fetches templates successfully', async () => {
        const mockTemplates = [{ id: 't1', name: 'Template 1' }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTemplates,
        });

        const { result } = renderHook(() => useVisualBuilderTemplates());

        // Initial fetch is triggered by useEffect?
        // Wait, the hook implementation DOES NOT have a useEffect to auto-fetch.
        // It exposes fetchTemplates function.
        // Let's check implementation again...
        // Ah, checked file: lines 13-83. No useEffect calling fetchTemplates.
        // So we must call it manually.

        await act(async () => {
            await result.current.fetchTemplates();
        });

        expect(result.current.templates).toEqual(mockTemplates);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('handles fetch error', async () => {
        (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));

        const { result } = renderHook(() => useVisualBuilderTemplates());

        await act(async () => {
            await result.current.fetchTemplates();
        });

        expect(result.current.error).toBe('Fetch failed');
        expect(result.current.loading).toBe(false);
    });

    it('saves a template successfully and refreshes list', async () => {
        const { result } = renderHook(() => useVisualBuilderTemplates());

        // 1. Mock Save Response
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
        // 2. Mock Refresh Response
        const mockTemplates = [{ id: 'new', name: 'New Template' }];
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => mockTemplates,
        });

        await act(async () => {
            const success = await result.current.saveTemplate('New', 'Desc', []);
            expect(success).toBe(true);
        });

        // Verify Save Call
        expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/visual-builder/templates', expect.objectContaining({
            method: 'POST',
            body: expect.stringContaining('"name":"New"'),
        }));

        // Verify Refresh Call
        expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/visual-builder/templates');
        expect(result.current.templates).toEqual(mockTemplates);
    });

    it('handles save error', async () => {
        const { result } = renderHook(() => useVisualBuilderTemplates());

        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: false,
            statusText: 'Bad Request'
        });

        await act(async () => {
            const success = await result.current.saveTemplate('New', 'Desc', []);
            expect(success).toBe(false);
        });

        expect(result.current.error).toBe('Failed to save template');
    });

    it('deletes a template successfully and refreshes list', async () => {
        const { result } = renderHook(() => useVisualBuilderTemplates());

        // 1. Mock Delete Response
        (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: true });
        // 2. Mock Refresh Response
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => [],
        });

        await act(async () => {
            const success = await result.current.deleteTemplate('t1');
            expect(success).toBe(true);
        });

        // Verify Delete Call
        expect(global.fetch).toHaveBeenNthCalledWith(1, '/api/visual-builder/templates/t1', expect.objectContaining({
            method: 'DELETE',
        }));

        // Verify Refresh Call
        expect(global.fetch).toHaveBeenNthCalledWith(2, '/api/visual-builder/templates');
    });
});
