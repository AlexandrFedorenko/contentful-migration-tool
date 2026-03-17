import { useState, useEffect, useCallback } from 'react';
import { useUserProfile } from './useUserProfile';
import { useAuthMutations } from './mutations/useAuthMutations';

interface AuthStatus {
    logged_in: boolean;
    config?: string;
}

export const useContentfulBrowserAuth = () => {
    const { userProfile, fetchUserProfile, isLoading: isProfileLoading } = useUserProfile();
    const { saveToken: saveTokenMutation, logout: logoutMutation, startLogin: startLoginMutation } = useAuthMutations();

    const [authUrl, setAuthUrl] = useState<string>('');
    const [token, setToken] = useState<string>('');

    // Derived state
    const isLoggedIn = !!userProfile?.isContentfulTokenSet;
    const isLoading = isProfileLoading || saveTokenMutation.isPending || logoutMutation.isPending || startLoginMutation.isPending;

    // Sync with localStorage
    useEffect(() => {
        if (isLoggedIn) {
            localStorage.setItem('contentful_auth_status', 'true');
        } else if (!isProfileLoading && userProfile !== null) {
            // Only clear if we loaded profile and verified not logged in
            localStorage.removeItem('contentful_auth_status');
        }
    }, [isLoggedIn, isProfileLoading, userProfile]);

    const checkAuthStatus = useCallback(async (): Promise<AuthStatus> => {
        const profile = await fetchUserProfile();
        const logged_in = !!profile?.isContentfulTokenSet;
        return { logged_in };
    }, [fetchUserProfile]);

    const startLogin = useCallback(async (): Promise<string> => {
        try {
            const url = await startLoginMutation.mutateAsync();
            setAuthUrl(url);
            return url;
        } catch (error) {
            throw error;
        }
    }, [startLoginMutation]);

    const saveToken = useCallback(async (newToken: string): Promise<boolean> => {
        try {
            await saveTokenMutation.mutateAsync(newToken);
            setToken('');
            // Force refresh profile to update global state
            await fetchUserProfile(true);
            return true;
        } catch (error) {
            throw error;
        }
    }, [saveTokenMutation, fetchUserProfile]);

    const logout = useCallback(async (): Promise<void> => {
        try {
            await logoutMutation.mutateAsync();

            localStorage.removeItem('contentful_auth_status');
            localStorage.removeItem('selectedSpaceId');
            setToken('');
            setAuthUrl('');

            // Force refresh profile
            await fetchUserProfile(true);

        } catch (error) {
            throw error;
        }
    }, [logoutMutation, fetchUserProfile]);

    return {
        isLoggedIn,
        isLoading,
        authUrl,
        token,
        setToken,
        checkAuthStatus,
        startLogin,
        saveToken,
        logout,
        setIsLoading: (_loading: boolean) => { }, // No-op, managed by mutations now
        setAuthUrl
    };
};