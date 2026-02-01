import React from "react";
import { AppBar, Toolbar, Box, Button } from "@mui/material";
import Link from "next/link";
import Image from "next/image";
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import LogoutIcon from '@mui/icons-material/Logout';
import { IconButton, Tooltip } from "@mui/material";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/context/AuthContext";
import styles from "./AppHeader.module.css";

const AppHeader = React.memo(function AppHeader() {
    const { mode, toggleTheme } = useTheme();
    const { isLoggedIn, logout } = useAuth();

    return (
        <AppBar position="static" sx={{ p: 1 }}>
            <Toolbar sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link href="/" className={styles.logoWrapper} aria-label="Go to home page">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        className={styles.logo}
                        width={120}
                        height={50}
                        priority
                    />
                </Link>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Link href="/doc" className={styles.docLink}>
                        Documentation
                    </Link>
                    {isLoggedIn && (
                        <>
                            <Link href="/smart-migration" className={styles.docLink}>
                                Smart Migration
                            </Link>
                            <Link href="/views-migration" className={styles.docLink}>
                                Views Migration
                            </Link>
                        </>
                    )}
                    <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}>
                        <IconButton onClick={toggleTheme} sx={{ color: 'white' }}>
                            {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
                        </IconButton>
                    </Tooltip>
                    {isLoggedIn && (
                        <Tooltip title="Logout">
                            <Button
                                variant="outlined"
                                color="inherit"
                                onClick={logout}
                                startIcon={<LogoutIcon />}
                                sx={{
                                    color: 'white',
                                    borderColor: 'white',
                                    '&:hover': {
                                        borderColor: 'white',
                                        backgroundColor: 'rgba(255,255,255,0.1)'
                                    }
                                }}
                            >
                                Logout
                            </Button>
                        </Tooltip>
                    )}
                </Box>
            </Toolbar>
        </AppBar>
    );
});

export default AppHeader;
