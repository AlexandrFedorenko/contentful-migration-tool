import { useCallback, useEffect } from 'react';
import { useGlobalContext } from '@/context/GlobalContext';
import { UserProfile } from '@/types/state';
import { api } from '@/utils/api';

// Module-level guard: shared across ALL hook instances to prevent concurrent fetches
let _isFetchingProfile = false;

export function useUserProfile() {
    const { state, dispatch } = useGlobalContext();
    const { userProfile, loading, errors } = state;
    const isLoading = loading.loadingUserProfile;
    const profileError = errors.profile;

    const fetchUserProfile = useCallback(async (force = false): Promise<UserProfile | null> => {
        // If we already have the profile, are currently fetching, or just encountered an error, return early
        if ((userProfile || isLoading || _isFetchingProfile) && !force) {
            return userProfile;
        }

        _isFetchingProfile = true;
        dispatch({ type: 'SET_LOADING', payload: { key: 'loadingUserProfile', value: true } });

        try {
            const result = await api.get<UserProfile>('/api/user/profile');
            if (result.success && result.data) {
                // Cache the display name in localStorage for instant retrieval on next load
                if (result.data.displayName) {
                    localStorage.setItem('cm_display_name', result.data.displayName);
                } else {
                    localStorage.removeItem('cm_display_name');
                }

                dispatch({
                    type: 'SET_USER_PROFILE',
                    payload: result.data
                });
                return result.data;
            }
        } catch (error) {
            if (error instanceof Error) {
                const message = error.message;
                dispatch({ 
                    type: 'SET_DATA', 
                    payload: { errors: { ...errors, profile: message } } 
                });
            }
        } finally {
            _isFetchingProfile = false;
            dispatch({ type: 'SET_LOADING', payload: { key: 'loadingUserProfile', value: false } });
        }
        return null;
    }, [userProfile, isLoading, dispatch, errors]);

     useEffect(() => {
        if (!userProfile && !isLoading && !_isFetchingProfile && !profileError) {
            fetchUserProfile();
        }
    }, [fetchUserProfile, userProfile, isLoading, profileError]);

    return { userProfile, fetchUserProfile, isLoading, profileError };
}
