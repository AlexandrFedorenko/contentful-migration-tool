/* eslint-disable @typescript-eslint/no-explicit-any */
import { useStore } from '@/store/useStore';
import { GlobalState, Action } from '@/types/state';

// Re-export types for backward compatibility
export type { GlobalState, Action };

export interface GlobalContextType {
    state: GlobalState;
    dispatch: (action: Action) => void;
}

// Compatibility Hook
export function useGlobalContext(): GlobalContextType {
    const store = useStore();
    return {
        state: store,
        dispatch: store.dispatch
    };
}
