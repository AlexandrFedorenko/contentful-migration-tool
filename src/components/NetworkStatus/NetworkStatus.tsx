import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

const anchorOrigin = {
    vertical: 'top' as const,
    horizontal: 'center' as const,
};

const NetworkStatus = React.memo(() => {
    const isOnline = useNetworkStatus();

    return (
        <Snackbar
            open={!isOnline}
            anchorOrigin={anchorOrigin}
        >
            <Alert severity="warning">
                You are offline. Please check your internet connection.
            </Alert>
        </Snackbar>
    );
});

NetworkStatus.displayName = 'NetworkStatus';

export { NetworkStatus }; 