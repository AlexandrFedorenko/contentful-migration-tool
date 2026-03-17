import { useQuery } from '@tanstack/react-query';
import { Space } from '@/types/common';
import { api } from '@/utils/api';

const fetchSpaces = async (): Promise<Space[]> => {
    const result = await api.get<{ spaces: Space[] }>('/api/spaces');

    if (!result.success || !result.data) {
        throw new Error(result.error || 'Failed to fetch spaces');
    }

    return result.data.spaces;
};

export function useSpacesQuery() {
    return useQuery({
        queryKey: ['spaces'],
        queryFn: fetchSpaces,
    });
}
