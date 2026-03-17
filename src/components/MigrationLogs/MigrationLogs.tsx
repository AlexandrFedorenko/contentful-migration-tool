import React, { useEffect, useRef } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useGlobalContext } from '@/context/GlobalContext';
import { Terminal, ShieldCheck, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MigrationLogs() {
    const { state, dispatch } = useGlobalContext();
    const scrollRef = useRef<HTMLDivElement>(null);

    const isOpen = state.loading.loadingMigration || (state.logs.length > 0 && !state.loading.loadingMigration);

    useEffect(() => {
        if (scrollRef.current) {
            const scrollContainer = scrollRef.current.closest('[data-radix-scroll-area-viewport]');
            if (scrollContainer) {
                scrollContainer.scrollTo({
                    top: scrollContainer.scrollHeight,
                    behavior: 'smooth'
                });
            }
        }
    }, [state.logs]);

    const handleClose = () => {
        if (!state.loading.loadingMigration) {
            dispatch({ type: "CLEAR_LOGS" });
        }
    };

    if (!isOpen && state.logs.length === 0) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(val) => !val && handleClose()}>
            <DialogContent
                className="sm:max-w-2xl border-primary/20 bg-card/95 backdrop-blur-xl p-0 overflow-hidden"
                onPointerDownOutside={(e) => state.loading.loadingMigration && e.preventDefault()}
                onEscapeKeyDown={(e) => state.loading.loadingMigration && e.preventDefault()}
            >
                <div className="flex flex-col h-full max-h-[85vh]">
                    <DialogHeader className="p-6 bg-muted/40 border-b border-border/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                                {state.loading.loadingMigration ? <Loader2 className="h-5 w-5 animate-spin" /> : <Terminal className="h-5 w-5" />}
                            </div>
                            <div>
                                <DialogTitle className="text-xl font-extrabold uppercase tracking-tight">
                                    {state.loading.loadingMigration ? "Migration in Progress" : "Migration Manifest"}
                                </DialogTitle>
                                {state.loading.loadingMigration && (
                                    <DialogDescription className="text-[10px] font-bold uppercase tracking-widest text-primary/60 mt-1">
                                        Data transfer protocol active. Maintain connection.
                                    </DialogDescription>
                                )}
                            </div>
                        </div>
                    </DialogHeader>

                    <div className="flex-1 overflow-hidden">
                        {state.loading.loadingMigration && (
                            <div className="px-6 py-2 bg-primary/5 border-b border-border/50">
                                <Progress value={undefined} className="h-1 bg-primary/10" />
                            </div>
                        )}

                        <ScrollArea className="h-[400px] bg-slate-900/90 shadow-inner">
                            <div className="p-4 font-mono text-xs space-y-1.5 min-h-full text-slate-300">
                                {state.logs.map((log, index) => {
                                    const lowerLog = log.toLowerCase();
                                    const isError = lowerLog.includes('error') || lowerLog.includes('failed');
                                    const isSuccess = lowerLog.includes('success') || lowerLog.includes('completed');
                                    const isWarning = lowerLog.includes('warning');

                                    return (
                                        <div
                                            key={index}
                                            className={cn(
                                                "flex items-start gap-2 py-0.5 border-l-2 pl-3 transition-colors",
                                                isError ? "border-destructive/40 text-destructive bg-destructive/5" :
                                                    isSuccess ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/5" :
                                                        isWarning ? "border-amber-500/40 text-amber-500 bg-amber-500/5" :
                                                            "border-border/50 text-muted-foreground/80"
                                            )}
                                        >
                                            <span className="shrink-0 opacity-40 select-none">[{index.toString().padStart(3, '0')}]</span>
                                            <span className="flex-1 whitespace-pre-wrap">{log}</span>
                                        </div>
                                    );
                                })}
                                <div ref={scrollRef} className="h-4" />
                            </div>
                        </ScrollArea>
                    </div>

                    <DialogFooter className="p-4 bg-muted/40 border-t border-border/50">
                        <Button
                            onClick={handleClose}
                            disabled={state.loading.loadingMigration}
                            className={cn(
                                "w-full sm:w-auto min-w-[120px] font-bold uppercase tracking-widest text-[10px]",
                                state.loading.loadingMigration ? "bg-muted cursor-not-allowed" : "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                            )}
                        >
                            {state.loading.loadingMigration ? (
                                <>
                                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                                    Synchronizing...
                                </>
                            ) : (
                                <>
                                    <ShieldCheck className="h-3.5 w-3.5 mr-2" />
                                    Close Manifest
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </div>
            </DialogContent>
        </Dialog>
    );
}
