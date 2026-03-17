import React from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, LogIn, ExternalLink, ShieldAlert, Cpu } from "lucide-react";


interface LoginFormViewProps {
    onGetAuthUrl: () => void;
    onOpenAuthWindow: () => void;
    loginStarted: boolean;
    error: string;
    isLoading: boolean;
}

const LoginFormView = React.memo<LoginFormViewProps>(({
    onGetAuthUrl,
    onOpenAuthWindow,
    loginStarted,
    error,
    isLoading
}) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 text-center animate-in fade-in duration-700">
            <div className="relative mb-12">
                <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full animate-pulse" />
                <header className="relative space-y-4">
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground sm:text-7xl">
                        Contentful <span className="text-primary">CMT</span>
                    </h1>
                    <div className="flex items-center justify-center gap-4">
                        <div className="h-px w-12 bg-border/50" />
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.4em] whitespace-nowrap">
                            Advanced Migration Engine
                        </p>
                        <div className="h-px w-12 bg-border/50" />
                    </div>
                </header>
            </div>

            <div className="max-w-md w-full space-y-10">
                <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                    Establish a secure neural link with the Contentful Management API to begin environment transposition.
                </p>

                {error && (
                    <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 animate-in slide-in-from-top-2">
                        <ShieldAlert className="h-4 w-4 shrink-0" />
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    {!loginStarted ? (
                        <Button
                            size="lg"
                            className="w-full py-8 text-sm font-black uppercase tracking-widest gap-3 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]"
                            onClick={onGetAuthUrl}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <LogIn className="h-5 w-5" />
                            )}
                            {isLoading ? 'Decrypting...' : 'Initialize Secure Login'}
                        </Button>
                    ) : (
                        <Button
                            size="lg"
                            className="w-full py-8 text-sm font-black uppercase tracking-widest gap-3 rounded-2xl bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/20 transition-all active:scale-[0.98]"
                            onClick={onOpenAuthWindow}
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <ExternalLink className="h-5 w-5" />
                            )}
                            {isLoading ? 'Opening Tunnel...' : 'Complete Authorization'}
                        </Button>
                    )}
                </div>

                <div className="flex flex-col items-center gap-4 pt-4">
                    <div className="flex items-center gap-3 py-2 px-6 rounded-full bg-muted/20 border border-border/50">
                        <div className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                            Link Status: <strong className="text-rose-500/60 uppercase">Disconnected</strong>
                        </span>
                    </div>

                    <div className="flex items-center gap-2 opacity-30 hover:opacity-100 transition-opacity">
                        <Cpu className="h-3 w-3 text-muted-foreground" />
                        <span className="text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                            Terminal ID: {(Math.random() * 0xFFFFFF << 0).toString(16).toUpperCase()}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

LoginFormView.displayName = 'LoginFormView';

export default LoginFormView;
