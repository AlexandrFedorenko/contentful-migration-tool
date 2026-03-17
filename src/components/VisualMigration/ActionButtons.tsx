import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Alert,
    AlertDescription
} from "@/components/ui/alert";
import {
    Play,
    Eye,
    Save,
    Loader2,
    Info,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import { saveTemplate } from '@/templates/template-storage';
import { MigrationTemplate } from '@/templates/migration-templates';
import { MigrationStep } from '@/templates/migration-templates';

interface ActionButtonsProps {
    code: string;
    steps: MigrationStep[];
    contentType: string;
    spaceId: string;
    targetEnv: string;
    onRun: () => void;
    isRunning: boolean;
    disabled: boolean;
}

interface PreviewData {
    error?: string;
    affectedEntries?: string;
    estimatedTime?: string;
    warnings?: string[];
}

export const ActionButtons: React.FC<ActionButtonsProps> = ({
    code,
    steps,
    contentType,
    spaceId,
    targetEnv,
    onRun,
    isRunning,
    disabled
}) => {
    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewData, setPreviewData] = useState<PreviewData | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    const handleSaveTemplate = () => {
        if (!templateName.trim()) {
            return;
        }

        const template: Omit<MigrationTemplate, 'id'> = {
            name: templateName,
            icon: '📝',
            description: templateDescription || 'Created from Visual Builder',
            category: 'custom',
            steps: [] 
        };

        saveTemplate(template);
        setSaveDialogOpen(false);
        setTemplateName('');
        setTemplateDescription('');
    };

    const handlePreview = async () => {
        setPreviewLoading(true);
        setPreviewDialogOpen(true);

        try {
            const response = await fetch('/api/visual-migrate-preview', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spaceId,
                    targetEnv,
                    contentType,
                    steps
                })
            });

            const data = await response.json();
            setPreviewData(data);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            setPreviewData({ error: errorMessage });
        } finally {
            setPreviewLoading(false);
        }
    };

    return (
        <>
            <div className="flex items-center gap-3">
                <Button
                    variant="outline"
                    onClick={handlePreview}
                    disabled={disabled || !contentType}
                    className="gap-2 h-10 px-4 font-bold uppercase tracking-widest text-sm"
                >
                    <Eye className="h-4 w-4" />
                    Preview (Dry-Run)
                </Button>

                <Button
                    variant="outline"
                    onClick={() => setSaveDialogOpen(true)}
                    disabled={!code}
                    className="gap-2 h-10 px-4 font-bold uppercase tracking-widest text-sm"
                >
                    <Save className="h-4 w-4" />
                    Save Template
                </Button>

                <Button
                    variant="default"
                    onClick={onRun}
                    disabled={disabled || isRunning}
                    className="bg-primary hover:bg-primary/90 text-white gap-2 h-10 px-6 font-black uppercase tracking-widest text-sm shadow-lg shadow-primary/20"
                >
                    {isRunning ? (
                        <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Running...
                        </>
                    ) : (
                        <>
                            <Play className="h-4 w-4 fill-current" />
                            Run Migration
                        </>
                    )}
                </Button>
            </div>

            {/* Save Template Dialog */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-xl border-primary/20 shadow-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">Save Template</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <Alert className="bg-primary/5 border-primary/10">
                            <Info className="h-4 w-4 text-primary" />
                            <AlertDescription className="text-[10px] font-bold uppercase tracking-widest text-primary/60">
                                Template will be saved locally. After database setup, it will sync to cloud.
                            </AlertDescription>
                        </Alert>

                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">Template Name</label>
                            <Input
                                value={templateName}
                                onChange={(e) => setTemplateName(e.target.value)}
                                placeholder="e.g., My Custom Transformation"
                                className="bg-muted/20 border-border/50"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">Description</label>
                            <Textarea
                                value={templateDescription}
                                onChange={(e) => setTemplateDescription(e.target.value)}
                                placeholder="Describe what this template does..."
                                className="bg-muted/20 border-border/50 min-h-[100px]"
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-3">
                        <Button variant="ghost" onClick={() => setSaveDialogOpen(false)} className="text-[10px] font-black uppercase tracking-widest">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveTemplate}
                            disabled={!templateName.trim()}
                            className="bg-primary hover:bg-primary/90 text-white font-black px-8 uppercase tracking-widest text-[10px]"
                        >
                            Save Template
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Preview Dialog */}
            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="sm:max-w-xl bg-card/95 backdrop-blur-xl border-primary/20 shadow-2xl p-0 overflow-hidden">
                    <DialogHeader className="p-6 pb-0">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                            <Eye className="h-5 w-5 text-primary" />
                            Migration Preview (Dry-Run)
                        </DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-4">
                        {previewLoading ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4">
                                <Loader2 className="h-8 w-8 animate-spin text-primary opacity-50" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground animate-pulse">Analyzing Space Manifest...</p>
                            </div>
                        ) : previewData?.error ? (
                            <Alert variant="destructive" className="bg-destructive/5 border-destructive/10">
                                <AlertCircle className="h-4 w-4" />
                                <AlertDescription className="font-mono text-xs">{previewData.error}</AlertDescription>
                            </Alert>
                        ) : previewData ? (
                            <div className="space-y-4">
                                <Alert className="bg-emerald-500/5 border-emerald-500/20 text-emerald-500">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertDescription className="text-[10px] font-black uppercase tracking-widest">
                                        Migration is valid and ready to run!
                                    </AlertDescription>
                                </Alert>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Affected Entries</p>
                                        <p className="text-xl font-black">{previewData.affectedEntries || '0'}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-muted/20 border border-border/50">
                                        <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Estimated Time</p>
                                        <p className="text-xl font-black">{previewData.estimatedTime || 'N/A'}</p>
                                    </div>
                                </div>

                                {previewData.warnings && previewData.warnings.length > 0 && (
                                    <Alert variant="destructive" className="bg-amber-500/5 border-amber-500/20 text-amber-500">
                                        <div className="space-y-2">
                                            <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                                <AlertCircle className="h-3.5 w-3.5" />
                                                Safety Protocol Warnings:
                                            </p>
                                            <ul className="space-y-1">
                                                {previewData.warnings.map((w: string, i: number) => (
                                                    <li key={i} className="text-[10px] font-medium leading-tight opacity-80">• {w}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    </Alert>
                                )}
                            </div>
                        ) : null}
                    </div>

                    <DialogFooter className="p-6 bg-muted/40 border-t border-border/50">
                        <Button
                            onClick={() => setPreviewDialogOpen(false)}
                            className="w-full sm:w-auto text-[10px] font-black uppercase tracking-widest"
                        >
                            Close Preview
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
};
