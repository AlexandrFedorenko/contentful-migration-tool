import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';

// ... (existing code, note: we'll just target the import line and the useMemo usage separately if needed, but I'll do it in chunks)
import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    mode: 'dark',
    toggleTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [mode, setMode] = useState<ThemeMode>('dark');

    useEffect(() => {
        // Load saved theme from localStorage
        const savedMode = localStorage.getItem('themeMode') as ThemeMode;
        if (savedMode) {
            setMode(savedMode);
        }
    }, []);

    const toggleTheme = () => {
        const newMode = mode === 'light' ? 'dark' : 'light';
        setMode(newMode);
        localStorage.setItem('themeMode', newMode);
    };

    const theme = useMemo(
        () =>
            createTheme({
                palette: {
                    mode,
                    ...(mode === 'dark'
                        ? {
                            // Dark Mode Overrides
                            background: {
                                default: '#121212',
                                paper: '#1e1e1e',
                            },
                            primary: {
                                main: '#90caf9',
                            },
                        }
                        : {
                            // Light Mode Overrides
                            background: {
                                default: '#f5f5f5',
                                paper: '#ffffff',
                            },
                            primary: {
                                main: '#1976d2',
                            },
                        }),
                },
                components: {
                    MuiOutlinedInput: {
                        styleOverrides: {
                            root: {
                                backgroundColor: mode === 'dark' ? '#2c2c2c' : undefined,
                            },
                            input: {
                                '&:-webkit-autofill': {
                                    WebkitBoxShadow: mode === 'dark' ? '0 0 0 100px #2c2c2c inset' : undefined,
                                    WebkitTextFillColor: mode === 'dark' ? '#ffffff' : undefined,
                                }
                            }
                        }
                    },
                    MuiInputBase: {
                        styleOverrides: {
                            input: {
                                color: mode === 'dark' ? '#fff' : undefined,
                            }
                        }
                    }
                }
            }),
        [mode]
    );

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            <MuiThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MuiThemeProvider>
        </ThemeContext.Provider>
    );
};
