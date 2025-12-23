import React, { useCallback, useMemo } from 'react';
import { Snackbar, Alert } from '@mui/material';
import { useGlobalContext } from '@/context/GlobalContext';
import { getSeverity } from '@/utils/status-snackbar-utils';

const anchorOrigin = {
    vertical: 'bottom' as const,
    horizontal: 'right' as const,
};

const AUTO_HIDE_DURATION = 6000;

const StatusSnackbar = React.memo(() => {
    const { state, dispatch } = useGlobalContext();
    const { statusMessage, alertOpen } = state;

    const handleClose = useCallback(() => {
        dispatch({ type: "CLOSE_ALERT" });
    }, [dispatch]);

    const severity = useMemo(
        () => getSeverity(statusMessage),
        [statusMessage]
    );

    const isOpen = alertOpen && !!statusMessage;

    return (
        <Snackbar
            open={isOpen}
            autoHideDuration={AUTO_HIDE_DURATION}
            onClose={handleClose}
            anchorOrigin={anchorOrigin}
        >
            <Alert onClose={handleClose} severity={severity}>
                {statusMessage}
            </Alert>
        </Snackbar>
    );
});

StatusSnackbar.displayName = 'StatusSnackbar';

export default StatusSnackbar; 