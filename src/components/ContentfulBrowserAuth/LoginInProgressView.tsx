import React from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ExternalLink, ShieldCheck, Key, Zap } from "lucide-react";


interface LoginInProgressViewProps {
    token: string;
    onTokenChange: (value: string) => void;
    onSaveToken: () => void;
    onCancel: () => void;
    onOpenAuthWindow: () => void;
    authUrl: string | null;
    error: string;
    isLoading: boolean;
}

const LoginInProgressView = React.memo<LoginInProgressViewProps>(({
    token,
    onTokenChange,
    onSaveToken,
    onCancel,
    onOpenAuthWindow,
    authUrl,
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
                            Neural Sync In Progress
                        </p>
                        <div className="h-px w-12 bg-border/50" />
                    </div>
                </header>
            </div>

            <div className="max-w-md w-full space-y-8">
                <div className="p-6 rounded-2xl bg-card border-border/50 space-y-6 shadow-2xl">
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed italic">
                        The authorization manifest is active in an external terminal tab. Copy the secure token to establish the link.
                    </p>

                    {authUrl && (
                        <Button
                            variant="secondary"
                            onClick={onOpenAuthWindow}
                            disabled={isLoading}
                            className="w-full gap-2 text-[10px] font-black uppercase tracking-widest bg-muted/20 border border-border/50 hover:bg-muted/30 transition-all"
                        >
                            <ExternalLink className="h-3.5 w-3.5" />
                            Return to Authorization Tab
                        </Button>
                    )}

                    <div className="h-px w-full bg-border/50" />

                    <div className="space-y-4 text-left">
                        <Label htmlFor="token" className="text-[10px] font-black uppercase tracking-widest text-primary px-1 flex items-center gap-2">
                            <Key className="h-3 w-3" /> Secure Token Manifest
                        </Label>
                        <div className="relative group">
                            <Input
                                id="token"
                                value={token}
                                onChange={(e) => onTokenChange(e.target.value)}
                                placeholder="PASTE_MANIFEST_TOKEN_HERE"
                                className="bg-muted/40 border-border/50 h-12 text-emerald-400 font-mono text-xs placeholder:text-muted-foreground/30 focus-visible:ring-primary/30"
                            />
                            <div className="absolute inset-y-0 right-3 flex items-center">
                                <Zap className="h-4 w-4 text-primary opacity-30 group-focus-within:opacity-100 transition-opacity" />
                            </div>
                        </div>
                        <p className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-widest pl-1 leading-relaxed">
                            * Tokens expire after session termination. Ensure direct copy-paste.
                        </p>
                    </div>

                    {error && (
                        <div className="p-3 rounded-lg bg-rose-500/5 border border-rose-500/20 text-rose-500 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 animate-in slide-in-from-top-2">
                            <ShieldCheck className="h-4 w-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <Button
                            onClick={onSaveToken}
                            disabled={isLoading || !token.trim()}
                            className="flex-1 py-6 text-xs font-black uppercase tracking-widest gap-2 rounded-xl bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                        >
                            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                            Commit Link
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={onCancel}
                            disabled={isLoading}
                            className="px-6 py-6 text-xs font-black uppercase tracking-widest gap-2 rounded-xl border border-border/50 hover:bg-muted/20 transition-all text-muted-foreground"
                        >
                            Abort
                        </Button>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-4 pt-4">
                    <div className="flex items-center gap-3 py-2 px-6 rounded-full bg-amber-500/5 border border-amber-500/10">
                        <Loader2 className="h-3 w-3 text-amber-500 animate-spin" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-amber-500/80">
                            Protocol Status: <strong className="text-amber-500 uppercase">Synchronizing...</strong>
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
});

LoginInProgressView.displayName = 'LoginInProgressView';

export default LoginInProgressView;
