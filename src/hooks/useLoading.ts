import { useCallback } from 'react';
import { useGlobalContext } from '@/context/GlobalContext';
import { LoadingKeys } from '@/types/common';

interface UseLoadingReturn {
    setLoading: (key: LoadingKeys, value: boolean) => void;
    withLoading: <T>(key: LoadingKeys, callback: () => Promise<T>) => Promise<T>;
}

export function useLoading(): UseLoadingReturn {
    const { dispatch } = useGlobalContext();

    const setLoading = useCallback((key: LoadingKeys, value: boolean) => {
        dispatch({ 
            type: "SET_LOADING", 
            payload: { key, value } 
        });
    }, [dispatch]);

    const withLoading = useCallback(async <T>(
        key: LoadingKeys,
        callback: () => Promise<T>
    ): Promise<T> => {
        setLoading(key, true);
        await Promise.resolve();
        try {
            return await callback();
        } finally {
            setLoading(key, false);
        }
    }, [setLoading]);

    return { setLoading, withLoading };
} 