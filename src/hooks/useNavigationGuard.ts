import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useGlobalContext } from '@/context/GlobalContext';
import { LoadingState } from '@/types/state';

/**
 * Hook to prevent accidental navigation during critical operations
 * @param message Warning message to show (optional)
 * @param criticalKeys Keys in state.loading that should trigger the guard
 */
export function useNavigationGuard(
    message: string = 'There is an active operation in progress. Navigating away may lead to data corruption or incomplete results. Are you sure you want to leave?',
    criticalKeys: (keyof LoadingState)[] = ['loadingBackup', 'loadingRestore', 'loadingMigration', 'loadingDelete', 'loadingAnalyze']
) {
    const { state } = useGlobalContext();
    const router = useRouter();

    // Check if any critical operation is active
    const isActive = criticalKeys.some(key => state.loading[key] === true);

    useEffect(() => {
        // 1. Browser-level warning (Refresh / Close tab)
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isActive) {
                e.preventDefault();
                e.returnValue = message;
                return message;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);

        // 2. Next.js Link navigation warning
        const handleBrowseAway = () => {
            if (isActive) {
                if (window.confirm(message)) {
                    return true;
                }
                // Stop navigation
                router.events.emit('routeChangeError');
                throw 'routeChange aborted by useNavigationGuard';
            }
        };

        router.events.on('routeChangeStart', handleBrowseAway);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            router.events.off('routeChangeStart', handleBrowseAway);
        };
    }, [isActive, message, router.events]);

    return { isActive };
}
