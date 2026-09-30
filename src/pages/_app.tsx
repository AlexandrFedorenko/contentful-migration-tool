import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { AppProps } from "next/app";
import Head from "next/head";
import "@/styles/globals.css";
import AppHeader from "@/components/AppHeader/AppHeader";
import AppBreadcrumbs from "@/components/AppBreadcrumbs/AppBreadcrumbs";
import { ErrorBoundary } from "@/components/ErrorBoundary/ErrorBoundary";
import { NetworkStatus } from "@/components/NetworkStatus/NetworkStatus";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ErrorProvider } from "@/context/ErrorContext";
import { useStore } from "@/store/useStore";
import { SessionProvider, useUser } from "@/context/SessionContext";
import { useEffect } from "react";
import dynamic from 'next/dynamic';
import { Toaster } from "@/components/ui/sonner";

const GlobalErrorModal = dynamic(() => import('@/components/GlobalErrorModal').then(mod => mod.GlobalErrorModal), { ssr: false });
const RestoreProgressContainer = dynamic(() => import('@/components/RestoreProgressModal/RestoreProgressContainer'), { ssr: false });
const RestoreResultContainer = dynamic(() => import('@/components/RestoreResultModal/RestoreResultContainer'), { ssr: false });
const StatusSnackbar = dynamic(() => import('@/components/StatusSnackbar/StatusSnackbar'), { ssr: false });
const BetaBadge = dynamic(() => import('@/components/BetaBadge/BetaBadge'), { ssr: false });
const Ticker = dynamic(() => import('@/components/Ticker/Ticker').then(mod => mod.Ticker), { ssr: false });

function StoreResetter() {
    const { user, isLoaded } = useUser();
    const reset = useStore(s => s.reset);

    useEffect(() => {
        if (isLoaded) {
            const currentUserId = user?.id || null;
            const sessionUserId = localStorage.getItem('cm_session_user_id');

            // If the user has changed or if it's first load and we don't have a session ID recorded
            if (currentUserId !== sessionUserId) {
                // If we are moving FROM a known user to another (or to guest)
                if (sessionUserId !== null) {
                    console.log('Resetting session due to user switch');
                    reset();
                    localStorage.removeItem('cm_display_name');
                }
                
                if (currentUserId) {
                    localStorage.setItem('cm_session_user_id', currentUserId);
                } else {
                    localStorage.removeItem('cm_session_user_id');
                }
            }
        }
    }, [user?.id, isLoaded, reset]);

    return null;
}

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            retry: 1,
            refetchOnWindowFocus: false,
        },
    },
});

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <QueryClientProvider client={queryClient}>
            <SessionProvider>
                <ErrorBoundary>
                    <ErrorProvider>
                        <AuthProvider>
                            <ThemeProvider>
                                <Head>
                                    <title>Contentful Migration Tool</title>
                                    <meta name="description" content="Professional tool for creating backups and migrating content between Contentful environments" />
                                    <meta name="viewport" content="width=device-width, initial-scale=1" />
                                    <link rel="icon" href="/favicon.ico" />
                                </Head>
                                <NetworkStatus />
                                <StoreResetter />
                                <AppHeader />
                                <Ticker />
                                <AppBreadcrumbs />
                                <GlobalErrorModal />
                                <RestoreProgressContainer />
                                <RestoreResultContainer />
                                <Component {...pageProps} />
                                <StatusSnackbar />
                                <BetaBadge />
                                <Toaster position="bottom-right" theme="dark" closeButton richColors />
                            </ThemeProvider>
                        </AuthProvider>
                    </ErrorProvider>
                </ErrorBoundary>
            </SessionProvider>
        </QueryClientProvider>
    );
}
