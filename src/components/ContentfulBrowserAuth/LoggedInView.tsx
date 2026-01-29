import React from 'react';
import { Box, Typography } from '@mui/material';

interface LoggedInViewProps {
    onLogout: () => void;
    isLoading: boolean;
}

// Logout button is now in AppHeader, this component just shows auth status
const LoggedInView = React.memo<LoggedInViewProps>(({ onLogout, isLoading }) => {
    return (
        <Box
            sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                mb: 2
            }}
        >
            <Typography variant="body2" color="text.secondary">
                Auth Status: <strong>Logged In</strong>
            </Typography>
        </Box>
    );
});

LoggedInView.displayName = 'LoggedInView';

export default LoggedInView;
