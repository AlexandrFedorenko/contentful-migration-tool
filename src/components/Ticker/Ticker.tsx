import React from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';
import styles from './Ticker.module.css';


export const Ticker = () => {
    const { settings, loading } = useAppSettings();

    if (loading || !settings?.tickerEnabled || !settings.tickerText) {
        return null;
    }

    return (
        <div className="w-full bg-amber-500 text-black overflow-hidden py-1.5 border-b border-amber-600/20 relative z-50">
            <div className={styles.track}>
                <div className={styles.item}>
                    <span className="text-xs font-bold tracking-normal px-8">
                        {settings.tickerText}
                    </span>
                </div>
                {/* Second copy for seamless infinite loop */}
                <div className={styles.item} aria-hidden="true">
                    <span className="text-xs font-bold tracking-normal px-8">
                        {settings.tickerText}
                    </span>
                </div>
            </div>
        </div>
    );
};
