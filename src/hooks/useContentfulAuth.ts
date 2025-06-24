import { useCallback, useState } from "react";
import { useGlobalContext } from "@/context/GlobalContext";
import { useLoading } from "./useLoading";
import { handleError } from "@/utils/errorHandler";

export function useContentfulAuth() {
    const { dispatch } = useGlobalContext();
    const { withLoading } = useLoading();
    const [authStatus, setAuthStatus] = useState<{
        loggedIn: boolean;
        config?: string;
    } | null>(null);

    const checkAuthStatus = useCallback(async () => {
        try {
            const result = await withLoading("loadingAuth", async () => {
                const response = await fetch('/api/contentful-auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'status'
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to check auth status');
                }
                
                return await response.json();
            });

            setAuthStatus({
                loggedIn: result.logged_in || false,
                config: result.config
            });

            return result;
        } catch (error) {
            console.error("❌ Auth status check error:", error);
            dispatch({ 
                type: "SET_STATUS", 
                payload: `Error checking Contentful auth status: ${handleError(error)}`
            });
            return null;
        }
    }, [dispatch, withLoading]);

    const login = useCallback(async (token: string) => {
        try {
            const result = await withLoading("loadingAuth", async () => {
                const response = await fetch('/api/contentful-auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'login',
                        token
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to login to Contentful');
                }
                
                return await response.json();
            });

            dispatch({ 
                type: "SET_STATUS", 
                payload: "Successfully logged in to Contentful"
            });

            // Обновляем статус после логина
            await checkAuthStatus();

            return result;
        } catch (error) {
            console.error("❌ Contentful login error:", error);
            dispatch({ 
                type: "SET_STATUS", 
                payload: `Error logging in to Contentful: ${handleError(error)}`
            });
            return null;
        }
    }, [dispatch, withLoading, checkAuthStatus]);

    const logout = useCallback(async () => {
        try {
            const result = await withLoading("loadingAuth", async () => {
                const response = await fetch('/api/contentful-auth', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'logout'
                    })
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Failed to logout from Contentful');
                }
                
                return await response.json();
            });

            dispatch({ 
                type: "SET_STATUS", 
                payload: "Successfully logged out from Contentful"
            });

            // Обновляем статус после логаута
            await checkAuthStatus();

            return result;
        } catch (error) {
            console.error("❌ Contentful logout error:", error);
            dispatch({ 
                type: "SET_STATUS", 
                payload: `Error logging out from Contentful: ${handleError(error)}`
            });
            return null;
        }
    }, [dispatch, withLoading, checkAuthStatus]);

    return { 
        authStatus, 
        checkAuthStatus, 
        login, 
        logout 
    };
} 