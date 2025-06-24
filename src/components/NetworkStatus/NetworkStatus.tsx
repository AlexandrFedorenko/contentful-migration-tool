import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function NetworkStatus() {
    const isOnline = useNetworkStatus();

    return (
        <Snackbar
            open={!isOnline}
            anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
            <Alert severity="warning">
                You are offline. Please check your internet connection.
            </Alert>
        </Snackbar>
    );
} 