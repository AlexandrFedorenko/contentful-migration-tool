import React, { Component, ErrorInfo, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
    children: ReactNode;
}

interface State {
    hasError: boolean;
    error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
    public state: State = {
        hasError: false,
        error: null
    };

    public static getDerivedStateFromError(error: Error): State {
        return { hasError: true, error };
    }

    public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error('Uncaught error:', error, errorInfo);
    }

    private handleReload = () => {
        window.location.reload();
    };

    public render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ 
                    display: 'flex', 
                    flexDirection: 'column', 
                    alignItems: 'center',
                    justifyContent: 'center',
                    minHeight: '100vh',
                    gap: 2,
                    p: 3
                }}>
                    <Typography variant="h4" color="error">
                        Something went wrong
                    </Typography>
                    <Typography color="text.secondary">
                        {this.state.error?.message}
                    </Typography>
                    <Button 
                        variant="contained" 
                        onClick={this.handleReload}
                    >
                        Reload Page
                    </Button>
                </Box>
            );
        }

        return this.props.children;
    }
} 