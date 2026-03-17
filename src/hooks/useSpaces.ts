
import { Space } from '@/types/common';
import { useSpacesQuery } from '@/hooks/queries/useSpacesQuery';

interface UseSpacesReturn {
    spaces: Space[];
    loading: boolean;
    error: string | null;
}

export function useSpaces(): UseSpacesReturn {


    // Use React Query for data fetching
    const { data: querySpaces, isLoading, error, isError } = useSpacesQuery();

    return {
        spaces: querySpaces || [],
        loading: isLoading,
        error: isError ? (error instanceof Error ? error.message : 'Failed to fetch spaces') : null
    };
}