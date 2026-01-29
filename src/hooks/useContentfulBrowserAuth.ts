import { useState, useEffect, useCallback } from 'react';

interface AuthStatus {
    logged_in: boolean;
    config?: string;
}

interface StartLoginResponse {
    success: boolean;
    browser_url?: string;
    message?: string;
}

interface SaveTokenResponse {
    success: boolean;
    message?: string;
}

interface LogoutResponse {
    success: boolean;
    message?: string;
}

export const useContentfulBrowserAuth = () => {
    const [isLoggedIn, setIsLoggedIn] = useState<boolean>(false);
    const [isLoading, setIsLoading] = useState<boolean>(true);
    const [authUrl, setAuthUrl] = useState<string>('');
    const [token, setToken] = useState<string>('');

    // Initialize from localStorage
    useEffect(() => {
        const storedAuth = localStorage.getItem('contentful_auth_status');
        if (storedAuth === 'true') {
            setIsLoggedIn(true);
        }
    }, []);

    const checkAuthStatus = useCallback(async (): Promise<AuthStatus> => {
        // Don't set loading to true if we already believe we are logged in (prevents flickering)
        if (!isLoggedIn) setIsLoading(true);

        try {
            const response = await fetch('/api/check-auth');
            if (!response.ok) {
                throw new Error('Failed to check auth status');
            }
            const data: AuthStatus = await response.json();
            setIsLoggedIn(data.logged_in);

            // Sync with localStorage
            if (data.logged_in) {
                localStorage.setItem('contentful_auth_status', 'true');
            } else {
                localStorage.removeItem('contentful_auth_status');
            }

            return data;
        } catch (error) {
            setIsLoggedIn(false);
            localStorage.removeItem('contentful_auth_status');
            return { logged_in: false };
        } finally {
            setIsLoading(false);
        }
    }, [isLoggedIn]);

    const startLogin = useCallback(async (): Promise<string> => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/contentful-auth-browser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'start-login' }),
            });

            if (!response.ok) {
                throw new Error('Failed to start login process');
            }

            const data: StartLoginResponse = await response.json();

            if (data.success && data.browser_url) {
                setAuthUrl(data.browser_url);
                return data.browser_url;
            } else {
                throw new Error(data.message || 'Failed to start login process');
            }
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const saveToken = useCallback(async (newToken: string): Promise<boolean> => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/contentful-auth-browser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'saveToken', token: newToken }),
            });

            if (!response.ok) {
                throw new Error('Failed to save token');
            }

            const data: SaveTokenResponse = await response.json();

            if (data.success) {
                setToken('');
                setIsLoggedIn(true);
                localStorage.setItem('contentful_auth_status', 'true');
                setIsLoading(false);
                return true;
            } else {
                throw new Error(data.message || 'Failed to save token');
            }
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    const logout = useCallback(async (): Promise<void> => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/contentful-auth-browser', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'logout' }),
            });

            if (!response.ok) {
                throw new Error('Failed to logout');
            }

            const data: LogoutResponse = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to logout');
            }

            setIsLoggedIn(false);
            localStorage.removeItem('contentful_auth_status');
            setToken('');
            setAuthUrl('');
        } catch (error) {
            throw error;
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

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
        setIsLoading,
        setAuthUrl
    };
};