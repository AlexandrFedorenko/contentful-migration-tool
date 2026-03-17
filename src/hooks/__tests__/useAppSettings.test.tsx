import { renderHook, waitFor, act } from '@testing-library/react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { useGlobalContext } from '@/context/GlobalContext';

jest.mock('@/context/GlobalContext', () => ({
    useGlobalContext: jest.fn()
}));

describe('useAppSettings', () => {
    const dispatch = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
        global.fetch = jest.fn();

        (useGlobalContext as jest.Mock).mockReturnValue({
            state: {
                appSettings: null,
                loading: {
                    loadingAppSettings: false
                }
            },
            dispatch
        });
    });

    it('stores the nested settings payload from GET responses', async () => {
        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    betaBannerEnabled: true,
                    betaBannerText: 'Banner',
                    tickerEnabled: false,
                    tickerText: 'Ticker',
                    maxAssetSizeMB: 1024,
                    maxBackupsPerUser: 1
                }
            })
        });

        renderHook(() => useAppSettings());

        await waitFor(() => {
            expect(dispatch).toHaveBeenCalledWith({
                type: 'SET_APP_SETTINGS',
                payload: {
                    betaBannerEnabled: true,
                    betaBannerText: 'Banner',
                    tickerEnabled: false,
                    tickerText: 'Ticker',
                    maxAssetSizeMB: 1024,
                    maxBackupsPerUser: 1
                }
            });
        });
    });

    it('stores the nested settings payload from POST responses', async () => {
        (useGlobalContext as jest.Mock).mockReturnValue({
            state: {
                appSettings: {
                    betaBannerEnabled: true,
                    betaBannerText: 'Initial',
                    tickerEnabled: false,
                    tickerText: 'Ticker',
                    maxAssetSizeMB: 1024,
                    maxBackupsPerUser: 1
                },
                loading: {
                    loadingAppSettings: false
                }
            },
            dispatch
        });

        (global.fetch as jest.Mock).mockResolvedValue({
            ok: true,
            json: async () => ({
                success: true,
                data: {
                    betaBannerEnabled: false,
                    betaBannerText: 'Updated banner',
                    tickerEnabled: true,
                    tickerText: 'Updated ticker',
                    maxAssetSizeMB: 2048,
                    maxBackupsPerUser: 3
                }
            })
        });

        const { result } = renderHook(() => useAppSettings());

        await act(async () => {
            await result.current.updateSettings({
                betaBannerEnabled: false,
                betaBannerText: 'Updated banner',
                tickerEnabled: true,
                tickerText: 'Updated ticker',
                maxAssetSizeMB: 2048,
                maxBackupsPerUser: 3
            });
        });

        expect(dispatch).toHaveBeenCalledWith({
            type: 'SET_APP_SETTINGS',
            payload: {
                betaBannerEnabled: false,
                betaBannerText: 'Updated banner',
                tickerEnabled: true,
                tickerText: 'Updated ticker',
                maxAssetSizeMB: 2048,
                maxBackupsPerUser: 3
            }
        });
    });
});