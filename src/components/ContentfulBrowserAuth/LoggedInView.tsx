import React from 'react';
import { Box, Button, Typography, CircularProgress } from '@mui/material';
import LogoutIcon from '@mui/icons-material/Logout';

interface LoggedInViewProps {
    onLogout: () => void;
    onFullReset: () => void;
    isLoading: boolean;
}

const LoggedInView = React.memo<LoggedInViewProps>(({ onLogout, onFullReset, isLoading }) => {
    return (
        <Box 
            sx={{ 
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 2
            }}
        >
            <Box sx={{ display: 'flex', gap: 2, width: '100%', maxWidth: '500px', mb: 2 }}>
                <Button 
                    variant="outlined" 
                    color="secondary" 
                    onClick={onLogout}
                    disabled={isLoading}
                    fullWidth
                    size="medium"
                    startIcon={isLoading ? <CircularProgress size={20} /> : <LogoutIcon />}
                >
                    Logout
                </Button>
                
                <Button 
                    variant="outlined" 
                    color="error" 
                    onClick={onFullReset}
                    disabled={isLoading}
                    fullWidth
                    size="medium"
                >
                    Force Reset
                </Button>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: '50px' }}>
                Auth Status: <strong>Logged In</strong>
            </Typography>
        </Box>
    );
});

LoggedInView.displayName = 'LoggedInView';

export default LoggedInView;

