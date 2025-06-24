import type { AppProps } from "next/app";
import "@/styles/globals.css";
import { Box, Typography, CssBaseline } from "@mui/material";
import AppHeader from "@/components/AppHeader/AppHeader";
import { GlobalProvider } from "@/context/GlobalContext";
import StatusSnackbar from "@/components/StatusSnackbar/StatusSnackbar";
import { ErrorBoundary } from "@/components/ErrorBoundary/ErrorBoundary";
import { NetworkStatus } from "@/components/NetworkStatus/NetworkStatus";
import { AuthProvider } from "@/context/AuthContext";

export default function MyApp({ Component, pageProps }: AppProps) {
    return (
        <ErrorBoundary>
            <GlobalProvider>
                <AuthProvider>
                    <CssBaseline />
                    <NetworkStatus />
                    <AppHeader />
                    <Component {...pageProps} />
                    <StatusSnackbar />
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
                </AuthProvider>
            </GlobalProvider>
        </ErrorBoundary>
    );
}
