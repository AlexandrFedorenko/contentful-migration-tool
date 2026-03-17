import { useState, useEffect } from 'react';
import { useGlobalContext } from '@/context/GlobalContext';
import { AppSettingsState } from '@/types/state';

export type AppSettings = AppSettingsState;

// Module-level guard: shared across ALL hook instances to prevent concurrent fetches
let _isFetchingSettings = false;

function normalizeSettingsResponse(payload: unknown): AppSettings | null {
    if (!payload || typeof payload !== 'object') {
        return null;
    }

    const candidate = payload as { data?: AppSettings } & Partial<AppSettings>;
    return candidate.data ?? (candidate as AppSettings);
}

export function useAppSettings() {
    const { state, dispatch } = useGlobalContext();
    const { appSettings, loading } = state;
    const isLoading = loading.loadingAppSettings;
    // Local loading state for the hook consumer, combining global loading and data presence
    const [isHookLoading, setIsHookLoading] = useState(!appSettings);

    useEffect(() => {
        if (appSettings) {
            setIsHookLoading(false);
            return;
        }

        async function fetchSettings() {
            // Prevent duplicate fetch if already loading globally or fetching
            if (isLoading || _isFetchingSettings) return;

            _isFetchingSettings = true;
            dispatch({ type: 'SET_LOADING', payload: { key: 'loadingAppSettings', value: true } });

            try {
                const res = await fetch('/api/settings');
                if (!res.ok) {
                    throw new Error('Failed to fetch settings');
                }

                const data = await res.json();
                const settings = normalizeSettingsResponse(data);

                if (!settings) {
                    throw new Error('Invalid settings response');
                }

                dispatch({ type: 'SET_APP_SETTINGS', payload: settings });
            } catch {
                // Silently use default settings on error
                dispatch({
                    type: 'SET_APP_SETTINGS', payload: {
                        betaBannerEnabled: true,
                        betaBannerText: '🚀 This is a beta version of the app',
                        tickerEnabled: false,
                        tickerText: 'Welcome to the migration tool!',
                        maxAssetSizeMB: 1024,
                        maxBackupsPerUser: 1
                    }
                });
            } finally {
                _isFetchingSettings = false;
                dispatch({ type: 'SET_LOADING', payload: { key: 'loadingAppSettings', value: false } });
                setIsHookLoading(false);
            }
        }

        // Only fetch if not loaded, not loading, and no fetch in progress
        if (!appSettings && !isLoading && !_isFetchingSettings) {
            fetchSettings();
        }
    }, [appSettings, isLoading, dispatch]);

    const updateSettings = async (newSettings: AppSettings) => {
        try {
            const res = await fetch('/api/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newSettings),
            });
            if (res.ok) {
                const updated = await res.json();
                const settings = normalizeSettingsResponse(updated);

                if (!settings) {
                    return false;
                }

                dispatch({ type: 'SET_APP_SETTINGS', payload: settings });
                return true;
            }
            return false;
        } catch {
            return false;
        }
    };

    return { settings: appSettings, loading: isHookLoading, updateSettings };
}
