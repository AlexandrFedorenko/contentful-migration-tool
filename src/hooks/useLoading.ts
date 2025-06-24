import { useCallback } from 'react';
import { useGlobalContext } from '@/context/GlobalContext';
import { LoadingKeys } from '@/types/common';

export function useLoading() {
  const { dispatch } = useGlobalContext();

  const setLoading = useCallback((key: LoadingKeys, value: boolean) => {
    console.log('setLoading', key, value); // DEBUG LOG
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
    await Promise.resolve(); // yield to ensure state update
    try {
      return await callback();
    } finally {
      setLoading(key, false);
    }
  }, [setLoading]);

  return { setLoading, withLoading };
} 