import React from 'react';
import { Box, Button, TextField, Typography, CircularProgress } from '@mui/material';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

interface LoginInProgressViewProps {
    token: string;
    onTokenChange: (value: string) => void;
    onSaveToken: () => void;
    onCancel: () => void;
    onOpenAuthWindow: () => void;
    authUrl: string | null;
    error: string;
    isLoading: boolean;
}

const LoginInProgressView = React.memo<LoginInProgressViewProps>(({
    token,
    onTokenChange,
    onSaveToken,
    onCancel,
    onOpenAuthWindow,
    authUrl,
    error,
    isLoading
}) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                pt: '200px', // 200px from top
                mb: 3
            }}
        >
            <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
                Contentful Migration Tool
            </Typography>

            <Typography variant="body1" sx={{ mb: 3, textAlign: 'center', color: 'text.secondary', maxWidth: '600px' }}>
                Authorization page should be open in a new tab. After completing authorization, copy the token and paste it below.
            </Typography>

            {authUrl && (
                <Box sx={{ mb: 3, display: 'flex', gap: 1, alignItems: 'center' }}>
                    <Button
                        variant="outlined"
                        color="primary"
                        onClick={onOpenAuthWindow}
                        disabled={isLoading}
                        startIcon={<OpenInNewIcon />}
                        size="small"
                    >
                        Open Authorization Page
                    </Button>
                </Box>
            )}

            <Box sx={{ width: '100%', maxWidth: '500px', mb: 2 }}>
                <TextField
                    fullWidth
                    label="Contentful Token"
                    variant="outlined"
                    value={token}
                    onChange={(e) => onTokenChange(e.target.value)}
                    placeholder="Paste your token here"
                    sx={{ mb: 2 }}
                    helperText="Copy the token from the authorization page and paste it here"
                />
            </Box>

            {error && (
                <Typography color="error" sx={{ mb: 2, textAlign: 'center', maxWidth: '500px' }}>
                    {error}
                </Typography>
            )}

            <Box sx={{ display: 'flex', gap: 2, width: '100%', maxWidth: '500px', mb: 3 }}>
                <Button
                    variant="contained"
                    color="primary"
                    onClick={onSaveToken}
                    disabled={isLoading || !token.trim()}
                    fullWidth
                    size="large"
                    sx={{ py: 1.5 }}
                >
                    {isLoading ? <CircularProgress size={20} /> : 'SAVE TOKEN'}
                </Button>
                <Button
                    variant="outlined"
                    onClick={onCancel}
                    disabled={isLoading}
                    fullWidth
                    size="large"
                    sx={{ py: 1.5 }}
                >
                    CANCEL
                </Button>
            </Box>

            <Typography variant="body2" color="text.secondary">
                Auth Status: <strong>Authorization in progress...</strong>
            </Typography>
        </Box>
    );
});

LoginInProgressView.displayName = 'LoginInProgressView';

export default LoginInProgressView;
