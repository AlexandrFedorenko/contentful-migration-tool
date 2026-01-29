import React, { useState, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import LoggedInView from './LoggedInView';
import LoginInProgressView from './LoginInProgressView';
import LoginFormView from './LoginFormView';
import { useAuthMessageHandler } from '@/hooks/useAuthMessageHandler';

const ContentfulBrowserAuth = React.memo(() => {
    const {
        isLoggedIn,
        isLoading: hookLoading,
        authUrl,
        token,
        setToken,
        saveToken,
        logout,
        checkAuthStatus,
        setAuthUrl
    } = useAuth();

    const [error, setError] = useState<string>('');
    const [loginStarted, setLoginStarted] = useState<boolean>(false);
    const [localLoading, setLocalLoading] = useState(false);
    const isLoading = hookLoading || localLoading;

    const handleSaveToken = useCallback(async () => {
        setError('');
        if (!token.trim()) {
            setError('Please enter a valid token');
            return;
        }

        setLocalLoading(true);
        try {
            await saveToken(token);
            setLoginStarted(false);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save token');
        } finally {
            setLocalLoading(false);
        }
    }, [token, saveToken]);

    const handleLogout = useCallback(async () => {
        setError('');
        setLocalLoading(true);

        try {
            const timeoutPromise = new Promise((_, reject) =>
                setTimeout(() => reject(new Error('Logout timed out')), 15000)
            );

            await Promise.race([
                logout(),
                timeoutPromise
            ]);

            await checkAuthStatus();
            setLoginStarted(false);
        } catch (err) {
            console.error('Error during logout:', err);
            setError('Logout process timed out. You may need to refresh the page.');
            await checkAuthStatus();
        } finally {
            setLocalLoading(false);
        }
    }, [logout, checkAuthStatus]);

    const handleFullReset = useCallback(async () => {
        setError('');
        setLocalLoading(true);

        try {
            const response = await fetch('/api/reset-auth', {
                method: 'POST',
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message);
            }

            await checkAuthStatus();
            setLoginStarted(false);
        } catch (err) {
            console.error('Error during full reset:', err);
            setError('Reset process failed. Please try again or refresh the page.');
        } finally {
            setLocalLoading(false);
        }
    }, [checkAuthStatus]);

    const getAuthUrl = useCallback(async () => {
        try {
            setError('');
            setLocalLoading(true);

            const response = await fetch('/api/contentful-auth-browser', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ action: 'getAuthUrl' }),
            });

            const data = await response.json();

            if (!data.success) {
                throw new Error(data.message || 'Failed to get auth URL');
            }

            if (!data.authUrl || !data.authUrl.startsWith('https://')) {
                throw new Error('Invalid auth URL received from server');
            }

            setAuthUrl(data.authUrl);
            setLoginStarted(true);
            window.open(data.authUrl, '_blank');
        } catch (err) {
            console.error('Error getting auth URL:', err);
            setError(err instanceof Error ? err.message : 'Failed to get auth URL');
        } finally {
            setLocalLoading(false);
        }
    }, [setAuthUrl]);

    const handleTokenReceived = useCallback(async (receivedToken: string) => {
        await saveToken(receivedToken);
    }, [saveToken]);

    useAuthMessageHandler({ onTokenReceived: handleTokenReceived });

    const openAuthWindow = useCallback(() => {
        if (!authUrl) return;

        const width = 800;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        const authWindow = window.open(
            authUrl,
            'contentful-auth',
            `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
        );

        if (!authWindow) {
            setError('Popup blocked! Please allow popups for this site.');
        } else {
            const checkWindowClosed = setInterval(() => {
                if (authWindow.closed) {
                    clearInterval(checkWindowClosed);
                    setTimeout(() => {
                        checkAuthStatus();
                    }, 1000);
                }
            }, 500);
        }
    }, [authUrl, checkAuthStatus]);

    if (isLoggedIn) {
        return (
            <LoggedInView
                onLogout={handleLogout}
                isLoading={isLoading}
            />
        );
    }

    if (loginStarted) {
        return (
            <LoginInProgressView
                token={token}
                onTokenChange={setToken}
                onSaveToken={handleSaveToken}
                onCancel={() => setLoginStarted(false)}
                onOpenAuthWindow={openAuthWindow}
                authUrl={authUrl}
                error={error}
                isLoading={isLoading}
            />
        );
    }

    return (
        <LoginFormView
            onGetAuthUrl={getAuthUrl}
            onOpenAuthWindow={openAuthWindow}
            loginStarted={loginStarted}
            error={error}
            isLoading={isLoading}
        />
    );
});

ContentfulBrowserAuth.displayName = 'ContentfulBrowserAuth';

export default ContentfulBrowserAuth; 