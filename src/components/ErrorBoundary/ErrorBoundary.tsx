import React, { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Box, Typography, Button } from '@mui/material';
import styles from './ErrorBoundary.module.css';

interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
    return (
        <Box className={styles.container}>
            <Typography variant="h4" color="error">
                Something went wrong
            </Typography>
            <Typography color="text.secondary">
                {error.message}
            </Typography>
            <Button 
                variant="contained" 
                onClick={resetErrorBoundary}
            >
                Reload Page
            </Button>
        </Box>
    );
}

interface ErrorBoundaryProps {
    children: ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
    const handleError = (error: Error, errorInfo: { componentStack: string }) => {
        console.error('Uncaught error:', error, errorInfo);
    };

    return (
        <ReactErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={handleError}
            onReset={() => {
                window.location.reload();
            }}
        >
            {children}
        </ReactErrorBoundary>
    );
} 