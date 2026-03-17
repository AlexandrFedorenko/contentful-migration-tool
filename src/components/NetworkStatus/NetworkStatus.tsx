import React from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WifiOff } from "lucide-react";


const NetworkStatus = React.memo(() => {
    const isOnline = useNetworkStatus();

    if (isOnline) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-[100] p-4 flex justify-center pointer-events-none animate-in fade-in slide-in-from-top-4 duration-500">
            <Alert
                variant="destructive"
                className="max-w-md bg-destructive/90 backdrop-blur-xl border-destructive/20 shadow-2xl pointer-events-auto"
            >
                <WifiOff className="h-4 w-4" />
                <AlertDescription className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    Connection Terminated: Offline Mode Active
                    <span className="flex h-2 w-2 rounded-full bg-white animate-pulse" />
                </AlertDescription>
            </Alert>
        </div>
    );
});

NetworkStatus.displayName = 'NetworkStatus';

export { NetworkStatus };