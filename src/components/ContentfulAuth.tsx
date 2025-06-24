import React, { useState, useEffect } from 'react';
import { useContentfulAuth } from '@/hooks/useContentfulAuth';
import { Button, TextField, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';

export default function ContentfulAuth() {
    const { authStatus, checkAuthStatus, login, logout } = useContentfulAuth();
    const [open, setOpen] = useState(false);
    const [token, setToken] = useState('');

    useEffect(() => {
        checkAuthStatus();
    }, [checkAuthStatus]);

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
    };

    const handleLogin = async () => {
        if (token) {
            await login(token);
            setToken('');
            handleClose();
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    return (
        <>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Typography variant="body1" sx={{ mr: 2 }}>
                    Contentful Status: {authStatus?.loggedIn ? 'Logged In' : 'Logged Out'}
                </Typography>
                {authStatus?.loggedIn ? (
                    <Button 
                        variant="outlined" 
                        color="secondary" 
                        startIcon={<LogoutIcon />}
                        onClick={handleLogout}
                    >
                        Logout
                    </Button>
                ) : (
                    <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={<LoginIcon />}
                        onClick={handleOpen}
                    >
                        Login
                    </Button>
                )}
            </Box>

            <Dialog open={open} onClose={handleClose}>
                <DialogTitle>Login to Contentful</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                        Enter your Contentful Management Token to login
                    </Typography>
                    <TextField
                        autoFocus
                        margin="dense"
                        id="token"
                        label="Management Token"
                        type="password"
                        fullWidth
                        variant="outlined"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose}>Cancel</Button>
                    <Button onClick={handleLogin} variant="contained" color="primary">
                        Login
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
} 