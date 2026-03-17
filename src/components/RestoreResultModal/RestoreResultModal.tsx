import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    CheckCircle2,
    XCircle,
    Info,
    AlertCircle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";

interface RestoreResultModalProps {
    open: boolean;
    onClose: () => void;
    success: boolean;
    backupName?: string;
    targetEnvironment?: string;
    errorMessage?: string;
}

export default function RestoreResultModal({
    open,
    onClose,
    success,
    backupName,
    targetEnvironment,
    errorMessage
}: RestoreResultModalProps) {
    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-[500px] border-primary/20 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl font-extrabold uppercase tracking-tight pr-10">
                        {success ? (
                            <>
                                <CheckCircle2 className="h-6 w-6 text-green-500" />
                                <span>Restore Successful</span>
                            </>
                        ) : (
                            <>
                                <XCircle className="h-6 w-6 text-destructive" />
                                <span>Restore Failed</span>
                            </>
                        )}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {success ? (
                        <div className="space-y-4">
                            <Alert className="bg-green-500/10 border-green-500/20 text-green-500">
                                <CheckCircle2 className="h-4 w-4" />
                                <AlertTitle className="font-bold">Migration Complete</AlertTitle>
                                <AlertDescription>
                                    The backup has been successfully restored to the target environment.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-1 gap-2 p-4 bg-muted/30 rounded-lg border border-border/50 shadow-inner">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Backup Profile</span>
                                    <span className="text-sm font-mono truncate max-w-[200px]">{backupName}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Scope</span>
                                    <span className="text-sm font-mono">{targetEnvironment}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                                <AlertCircle className="h-4 w-4" />
                                <AlertTitle className="font-bold">Process Aborted</AlertTitle>
                                <AlertDescription>
                                    An error occurred during the restoration process.
                                </AlertDescription>
                            </Alert>

                            <div className="grid grid-cols-1 gap-2 p-4 bg-muted/30 rounded-lg border border-border/50 shadow-inner">
                                {backupName && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Backup Profile</span>
                                        <span className="text-sm font-mono truncate max-w-[200px]">{backupName}</span>
                                    </div>
                                )}
                                {targetEnvironment && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Target Scope</span>
                                        <span className="text-sm font-mono">{targetEnvironment}</span>
                                    </div>
                                )}
                            </div>

                            {errorMessage && (
                                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
                                    <h4 className="text-xs font-extrabold uppercase tracking-widest text-destructive mb-2 flex items-center gap-2">
                                        <Info className="h-3 w-3" /> Technical Error Trace
                                    </h4>
                                    <p className="text-sm font-mono text-destructive break-words leading-relaxed">
                                        {errorMessage}
                                    </p>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button
                        onClick={onClose}
                        className={cn(
                            "w-full sm:w-auto font-bold px-8",
                            success ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"
                        )}
                    >
                        Close Result
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
