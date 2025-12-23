import React from 'react';
import { Box, Typography } from '@mui/material';

const BetaBadge = React.memo(() => {
    return (
        <Box
            sx={{
                position: "fixed",
                bottom: 80,
                right: 20,
                backgroundColor: "rgba(0, 0, 0, 0.8)",
                color: "white",
                padding: "10px 15px",
                borderRadius: "8px",
                fontSize: "14px",
                boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.3)",
                zIndex: 1000,
            }}
        >
            <Typography variant="body2">🚀 This is a beta version of the app</Typography>
        </Box>
    );
});

BetaBadge.displayName = 'BetaBadge';

export default BetaBadge;

