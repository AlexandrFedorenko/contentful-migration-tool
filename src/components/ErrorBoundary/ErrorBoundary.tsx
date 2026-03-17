import React, { ReactNode } from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Button } from "@/components/ui/button";
import { AlertCircle, RotateCcw } from 'lucide-react';

interface ErrorFallbackProps {
    error: Error;
    resetErrorBoundary: () => void;
}

function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 space-y-6 text-center bg-card border border-border/50 rounded-3xl shadow-2xl mx-4">
            <div className="h-20 w-20 rounded-full bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shadow-lg shadow-rose-500/5 animate-pulse">
                <AlertCircle className="h-10 w-10 text-rose-500" />
            </div>

            <div className="space-y-2 max-w-md">
                <h2 className="text-2xl font-black uppercase tracking-tight text-foreground">
                    Protocol Breach Detected
                </h2>
                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed uppercase tracking-[0.2em]">
                    An unhandled exception has successfully bypassed the perimeter.
                </p>
            </div>

            <div className="p-4 w-full max-w-lg rounded-xl bg-muted/40 border border-border/50 font-mono text-xs text-rose-400 overflow-auto shadow-inner text-left">
                <div className="flex items-center gap-2 mb-2 text-[10px] uppercase font-black tracking-widest text-rose-500/60 border-b border-rose-500/10 pb-2">
                    <span className="h-2 w-2 rounded-full bg-rose-500" /> Exception Manifest
                </div>
                {error.message}
            </div>

            <Button
                size="lg"
                onClick={resetErrorBoundary}
                className="gap-2 px-8 py-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95"
            >
                <RotateCcw className="h-4 w-4" />
                Re-Initialize Page
            </Button>
        </div>
    );
}

interface ErrorBoundaryProps {
    children: ReactNode;
}

export function ErrorBoundary({ children }: ErrorBoundaryProps) {
    const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
        console.error('SYSTEM_CRITICAL_ERROR:', error, errorInfo);
    };

    return (
        <ReactErrorBoundary
            FallbackComponent={ErrorFallback}
            onError={handleError}
            onReset={() => {
                window.location.reload();
            }}
        >
            {children}
        </ReactErrorBoundary>
    );
} 