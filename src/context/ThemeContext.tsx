import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'light' | 'dark';

interface ThemeContextType {
    mode: ThemeMode;
    toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
    mode: 'dark', // Default fallback
    toggleTheme: () => { },
});

export const useTheme = () => useContext(ThemeContext);

const THEME_STORAGE_KEY = 'theme_preference';

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
    const [mode, setMode] = useState<ThemeMode>('dark');
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Load saved theme from localStorage
        try {
            const savedMode = localStorage.getItem(THEME_STORAGE_KEY);
            if (savedMode === 'light' || savedMode === 'dark') {
                setMode(savedMode);
            }
        } catch {
            // Ignore localStorage read errors
        }
    }, []);

    useEffect(() => {
        if (!mounted) return;

        // Apply theme class to document element
        const root = window.document.documentElement;
        if (mode === 'dark') {
            root.classList.remove('light');
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
            root.classList.add('light');
        }

        try {
            localStorage.setItem(THEME_STORAGE_KEY, mode);
        } catch {
            // Ignore localStorage write errors
        }
    }, [mode, mounted]);

    const toggleTheme = () => {
        setMode(prev => prev === 'light' ? 'dark' : 'light');
    };

    // Avoid hydration mismatch by rendering nothing strictly if theme matters for initial render, 
    // but for just class injection, it's fine. 
    // However, to be safe and avoid flash of wrong theme if we had ssr:
    if (!mounted) {
        // Optional: return null or a loader if strict consistency is needed
        // For now, we render children to not block paint, but effect will update class mostly immediately on client
    }

    return (
        <ThemeContext.Provider value={{ mode, toggleTheme }}>
            {children}
        </ThemeContext.Provider>
    );
};
