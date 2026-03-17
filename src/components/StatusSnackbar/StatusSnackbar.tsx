import React, { useEffect } from 'react';
import { useGlobalContext } from '@/context/GlobalContext';
import { getSeverity } from '@/utils/status-snackbar-utils';
import { toast } from "sonner";

const StatusSnackbar = React.memo(() => {
    const { state, dispatch } = useGlobalContext();
    const { statusMessage, alertOpen } = state;

    useEffect(() => {
        if (alertOpen && statusMessage) {
            const severity = getSeverity(statusMessage);

            const toastOptions = {
                onAutoClose: () => dispatch({ type: "CLOSE_ALERT" }),
                onDismiss: () => dispatch({ type: "CLOSE_ALERT" }),
                duration: 6000,
            };

            switch (severity) {
                case 'success':
                    toast.success(statusMessage, toastOptions);
                    break;
                case 'error':
                    toast.error(statusMessage, toastOptions);
                    break;
                case 'warning':
                    toast.warning(statusMessage, toastOptions);
                    break;
                default:
                    toast.info(statusMessage, toastOptions);
            }
        }
    }, [alertOpen, statusMessage, dispatch]);

    // This component doesn't render anything itself anymore, 
    // it just acts as a bridge to the sonner library
    return null;
});

StatusSnackbar.displayName = 'StatusSnackbar';

export default StatusSnackbar;