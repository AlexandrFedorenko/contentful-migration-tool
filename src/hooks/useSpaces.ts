import { useState, useEffect, useCallback } from 'react';
import { Space } from '@/types/common';
import { SpacesResponse } from '@/types/api';

interface UseSpacesReturn {
    spaces: Space[];
    loading: boolean;
    error: string | null;
}

export function useSpaces(): UseSpacesReturn {
    const [spaces, setSpaces] = useState<Space[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchSpaces = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/spaces');
            
            if (!response.ok) {
                const errorData: SpacesResponse = await response.json();
                throw new Error(errorData.message || 'Failed to fetch spaces');
            }
            
            const data: SpacesResponse = await response.json();
            
            if (!data.success || !data.spaces) {
                throw new Error(data.message || 'Failed to fetch spaces');
            }
            
            setSpaces(data.spaces);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Failed to fetch spaces';
            setError(errorMessage);
            setSpaces([]);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchSpaces();
    }, [fetchSpaces]);

    return { spaces, loading, error };
} 