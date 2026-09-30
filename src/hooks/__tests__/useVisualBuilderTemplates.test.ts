import { renderHook, act } from '@testing-library/react';
import { useVisualBuilderTemplates } from '../useVisualBuilderTemplates';
import { api } from '@/utils/api';

jest.mock('@/utils/api', () => ({
    ...jest.requireActual('@/utils/api'),
    api: { get: jest.fn(), post: jest.fn(), delete: jest.fn() },
}));

describe('useVisualBuilderTemplates', () => {
    const templates = [{ id: 't1', name: 'Template 1', content: [], category: 'custom', updatedAt: '' }];

    beforeEach(() => jest.clearAllMocks());

    it('fetches templates', async () => {
        (api.get as jest.Mock).mockResolvedValueOnce({ success: true, data: templates });
        const { result } = renderHook(() => useVisualBuilderTemplates());

        await act(async () => {
            await result.current.fetchTemplates();
        });

        expect(api.get).toHaveBeenCalledWith('/api/visual-builder/templates');
        expect(result.current.templates).toEqual(templates);
        expect(result.current.loading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('shows a readable error when fetching fails', async () => {
        (api.get as jest.Mock).mockRejectedValueOnce(new Error('Fetch failed'));
        const { result } = renderHook(() => useVisualBuilderTemplates());

        await act(async () => {
            await result.current.fetchTemplates();
        });

        expect(result.current.error).toContain('Fetch failed');
        expect(result.current.loading).toBe(false);
    });

    it('saves a template and refreshes the list', async () => {
        (api.post as jest.Mock).mockResolvedValueOnce({ success: true, data: templates[0] });
        (api.get as jest.Mock).mockResolvedValueOnce({ success: true, data: templates });
        const { result } = renderHook(() => useVisualBuilderTemplates());

        let saved = false;
        await act(async () => {
            saved = await result.current.saveTemplate('New', 'Desc', []);
        });

        expect(saved).toBe(true);
        expect(api.post).toHaveBeenCalledWith('/api/visual-builder/templates', { name: 'New', description: 'Desc', content: [], category: 'custom' });
        expect(result.current.templates).toEqual(templates);
    });

    it('reports save errors', async () => {
        (api.post as jest.Mock).mockResolvedValueOnce({ success: false, error: 'Template limit reached' });
        const { result } = renderHook(() => useVisualBuilderTemplates());

        let saved = true;
        await act(async () => {
            saved = await result.current.saveTemplate('New', 'Desc', []);
        });

        expect(saved).toBe(false);
        expect(result.current.error).toContain('Template limit reached');
    });

    it('deletes a template and refreshes the list', async () => {
        (api.delete as jest.Mock).mockResolvedValueOnce({ success: true, data: { deleted: true } });
        (api.get as jest.Mock).mockResolvedValueOnce({ success: true, data: [] });
        const { result } = renderHook(() => useVisualBuilderTemplates());

        let deleted = false;
        await act(async () => {
            deleted = await result.current.deleteTemplate('t1');
        });

        expect(deleted).toBe(true);
        expect(api.delete).toHaveBeenCalledWith('/api/visual-builder/templates/t1');
        expect(result.current.templates).toEqual([]);
    });
});
