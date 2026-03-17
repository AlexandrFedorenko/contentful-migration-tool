import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import LoggedInView from './LoggedInView';
import LoginInProgressView from './LoginInProgressView';
import LoginFormView from './LoginFormView';
import { useAuthMessageHandler } from '@/hooks/useAuthMessageHandler';
import { api } from '@/utils/api';

const ContentfulBrowserAuth = React.memo(() => {
    const router = useRouter();
    const {
        isLoggedIn,
        isLoading: hookLoading,
        authUrl,
        token,
        setToken,
        saveToken,
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
            router.push('/');
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to save token');
        } finally {
            setLocalLoading(false);
        }
    }, [token, saveToken, router]);





    const getAuthUrl = useCallback(async () => {
        try {
            setError('');
            setLocalLoading(true);

            const result = await api.post<{ authUrl: string; message?: string }>('/api/contentful-auth-browser', {
                action: 'getAuthUrl'
            });

            if (!result.success || !result.data?.authUrl) {
                throw new Error(result.error || result.data?.message || 'Failed to get auth URL');
            }

            const url = result.data.authUrl;
            if (!url.startsWith('https://')) {
                throw new Error('Invalid auth URL received from server');
            }

            setAuthUrl(url);
            setLoginStarted(true);
            window.open(url, '_blank');
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
            <LoggedInView />
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