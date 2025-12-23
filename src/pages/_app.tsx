import type { AppProps } from "next/app";
import Head from "next/head";
import "@/styles/globals.css";
import { CssBaseline } from "@mui/material";
import AppHeader from "@/components/AppHeader/AppHeader";
import { GlobalProvider } from "@/context/GlobalContext";
import StatusSnackbar from "@/components/StatusSnackbar/StatusSnackbar";
import { ErrorBoundary } from "@/components/ErrorBoundary/ErrorBoundary";
import { NetworkStatus } from "@/components/NetworkStatus/NetworkStatus";
import { AuthProvider } from "@/context/AuthContext";
import BetaBadge from "@/components/BetaBadge/BetaBadge";

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <ErrorBoundary>
            <GlobalProvider>
                <AuthProvider>
                    <Head>
                        <title>Contentful Migration Tool</title>
                        <meta name="description" content="Professional tool for creating backups and migrating content between Contentful environments" />
                        <meta name="viewport" content="width=device-width, initial-scale=1" />
                        <link rel="icon" href="/favicon.ico" />
                    </Head>
                    <CssBaseline />
                    <NetworkStatus />
                    <AppHeader />
                    <Component {...pageProps} />
                    <StatusSnackbar />
                    <BetaBadge />
                </AuthProvider>
            </GlobalProvider>
        </ErrorBoundary>
    );
}
