import React from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface LoginFormViewProps {
    onGetAuthUrl: () => void;
    onOpenAuthWindow: () => void;
    loginStarted: boolean;
    error: string;
    isLoading: boolean;
}

const LoginFormView = React.memo<LoginFormViewProps>(({
    onGetAuthUrl,
    onOpenAuthWindow,
    loginStarted,
    error,
    isLoading
}) => {
    return (
        <Box 
            sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                mb: 3
            }}
        >
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                Contentful Migration Tool
            </Typography>
            
            <Typography variant="body1" sx={{ mb: 4, textAlign: 'center', color: 'text.secondary', maxWidth: '600px' }}>
                You need to log in to Contentful to use this tool. Click the button below to start the authentication process.
            </Typography>
            
            {error && (
                <Typography color="error" sx={{ mb: 2, textAlign: 'center' }}>
                    {error}
                </Typography>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'center', width: '100%', maxWidth: '500px', mb: 3 }}>
                {!loginStarted ? (
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={onGetAuthUrl}
                        disabled={isLoading}
                        size="large"
                        fullWidth
                        startIcon={isLoading ? <CircularProgress size={20} /> : <LoginIcon />}
                        sx={{ py: 1.5 }}
                    >
                        {isLoading ? 'Loading...' : 'LOGIN TO CONTENTFUL'}
                    </Button>
                ) : (
                    <Button 
                        variant="contained" 
                        color="primary" 
                        onClick={onOpenAuthWindow}
                        disabled={isLoading}
                        size="large"
                        fullWidth
                        startIcon={isLoading ? <CircularProgress size={20} /> : <OpenInNewIcon />}
                        sx={{ py: 1.5 }}
                    >
                        {isLoading ? 'Loading...' : 'Open Contentful Auth'}
                    </Button>
                )}
            </Box>
            
            <Typography variant="body2" color="text.secondary">
                Auth Status: <strong>Logged Out</strong>
            </Typography>
        </Box>
    );
});

LoginFormView.displayName = 'LoginFormView';

export default LoginFormView;

