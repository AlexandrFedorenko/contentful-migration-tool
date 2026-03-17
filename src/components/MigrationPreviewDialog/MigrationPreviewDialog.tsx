import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Layers,
    FileText,
    Image as ImageIconLucide,
    Globe,
    AlertTriangle,
    Loader2
} from 'lucide-react';
import { Separator } from "@/components/ui/separator";

interface PreviewData {
    entriesCount: number;
    assetsCount: number;
    contentTypesCount: number;
    localesCount: number;
    selectiveBackupFile: string;
}

interface MigrationPreviewDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    previewData: PreviewData | null;
    loading: boolean;
}

export default function MigrationPreviewDialog({
    open,
    onClose,
    onConfirm,
    previewData,
    loading
}: MigrationPreviewDialogProps) {
    if (!previewData) return null;

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-lg border-primary/20 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-extrabold uppercase tracking-tight">
                        <AlertTriangle className="h-5 w-5 text-amber-500" /> Confirm Deployment
                    </DialogTitle>
                    <DialogDescription className="text-xs text-muted-foreground pt-1">
                        You are about to initiate a migration sequence. This action may modify or overwrite existing data in the target environment.
                    </DialogDescription>
                </DialogHeader>

                <div className="py-4">
                    <div className="rounded-xl border border-border/50 bg-background/40 shadow-inner overflow-hidden">
                        <div className="p-4 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg">
                                        <Layers className="h-4 w-4 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold tracking-tight">{previewData.contentTypesCount} Content Types</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">System Schemas</p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-border/50" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-emerald-500/10 rounded-lg">
                                        <FileText className="h-4 w-4 text-emerald-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold tracking-tight">{previewData.entriesCount} Content Entries</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">Data Records</p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-border/50" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-500/10 rounded-lg">
                                        <ImageIconLucide className="h-4 w-4 text-indigo-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold tracking-tight">{previewData.assetsCount} Binary Assets</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">Media Files</p>
                                    </div>
                                </div>
                            </div>

                            <Separator className="bg-border/50" />

                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg">
                                        <Globe className="h-4 w-4 text-purple-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold tracking-tight">{previewData.localesCount} Active Locales</p>
                                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-60">Regional Definitions</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 px-1">
                        <p className="text-[10px] font-mono text-muted-foreground/40 break-all uppercase tracking-tighter">
                            Source Profile: <span className="text-muted-foreground/80">{previewData.selectiveBackupFile}</span>
                        </p>
                    </div>
                </div>

                <DialogFooter className="sm:justify-end gap-3 pt-2">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        disabled={loading}
                        className="text-xs font-bold uppercase tracking-widest"
                    >
                        Abort
                    </Button>
                    <Button
                        onClick={onConfirm}
                        disabled={loading}
                        className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-lg shadow-primary/20 min-w-[160px]"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                EXECUTING...
                            </>
                        ) : 'INITIALIZE TRANSFER'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
