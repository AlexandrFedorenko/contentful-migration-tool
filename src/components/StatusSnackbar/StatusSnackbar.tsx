import React from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useGlobalContext } from '@/context/GlobalContext';

type Severity = 'success' | 'info' | 'warning' | 'error';

export default function StatusSnackbar() {
    const { state, dispatch } = useGlobalContext();
    const { statusMessage, alertOpen } = state;

    const handleClose = () => {
        dispatch({ type: "CLOSE_ALERT" });
    };

    const getSeverity = (message: string | null | undefined): Severity => {
        if (!message) return 'info';
        if (message.includes('error') || message.includes('failed')) return 'error';
        if (message.includes('success')) return 'success';
        return 'info';
    };

    const severity = getSeverity(statusMessage);

    return (
        <Snackbar
            open={alertOpen && !!statusMessage}
            autoHideDuration={6000}
            onClose={handleClose}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert onClose={handleClose} severity={severity}>
                {statusMessage}
            </Alert>
        </Snackbar>
    );
} 