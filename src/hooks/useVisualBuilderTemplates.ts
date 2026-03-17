/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useCallback } from 'react';
import { api } from '@/utils/api';
import { parseError, instructionToString } from '@/utils/errorParser';

export interface VisualBuilderTemplate {
    id: string;
    name: string;
    description?: string;
    content: unknown; // The steps array
    category: string;
    updatedAt: string;
}

export const useVisualBuilderTemplates = () => {
    const [templates, setTemplates] = useState<VisualBuilderTemplate[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchTemplates = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await api.get<VisualBuilderTemplate[]>('/api/visual-builder/templates');
            if (result.success && result.data) {
                setTemplates(result.data);
            } else {
                setError(result.error || 'Failed to fetch templates');
            }
        } catch (err: unknown) {
            const instruction = parseError(err instanceof Error ? err.message : 'Unknown error');
            setError(instructionToString(instruction));
        } finally {
            setLoading(false);
        }
    }, []);

    const saveTemplate = useCallback(async (name: string, description: string, content: unknown) => {
        setLoading(true);
        setError(null);
        try {
            const result = await api.post<any>('/api/visual-builder/templates', {
                name, description, content, category: 'custom'
            });

            if (result.success) {
                await fetchTemplates(); // Refresh list
                return true;
            } else {
                const instruction = parseError(result.error || 'Failed to save template');
                setError(instructionToString(instruction));
                return false;
            }
        } catch (err: unknown) {
            const instruction = parseError(err instanceof Error ? err.message : 'Unknown error');
            setError(instructionToString(instruction));
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchTemplates]);

    const deleteTemplate = useCallback(async (id: string) => {
        setLoading(true);
        setError(null);
        try {
            const result = await api.delete<any>(`/api/visual-builder/templates/${id}`);

            if (result.success) {
                await fetchTemplates(); // Refresh list
                return true;
            } else {
                const instruction = parseError(result.error || 'Failed to delete template');
                setError(instructionToString(instruction));
                return false;
            }
        } catch (err: unknown) {
            const instruction = parseError(err instanceof Error ? err.message : 'Unknown error');
            setError(instructionToString(instruction));
            return false;
        } finally {
            setLoading(false);
        }
    }, [fetchTemplates]);

    return {
        templates,
        loading,
        error,
        fetchTemplates,
        saveTemplate,
        deleteTemplate
    };
};
