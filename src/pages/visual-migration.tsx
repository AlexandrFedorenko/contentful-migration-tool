/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Hammer,
    Library,
    Play,
    Terminal,
    AlertTriangle,
    Loader2,
    ChevronLeft,
    Zap,
    CheckCircle2,
    XCircle,
    Info,
    AlertCircle
} from "lucide-react";
import { useGlobalContext } from '@/context/GlobalContext';
import { default as SpaceSelector } from '@/components/SpaceSelector/SpaceSelector';
import { useSpaces } from '@/hooks/useSpaces';
import { VisualBuilder } from '@/components/VisualMigration/VisualBuilder';
import { MigrationStep } from '@/templates/migration-templates';
import { TemplateLibrary } from '@/components/VisualMigration/TemplateLibrary';
import { CodeEditorPanel } from '@/components/VisualMigration/CodeEditorPanel';
import { ActionButtons } from '@/components/VisualMigration/ActionButtons';
import { MigrationTemplate } from '@/templates/migration-templates';
import { generateMigrationCode } from '@/utils/code-generator';
import { parseError, instructionToString } from '@/utils/errorParser';
import { api } from '@/utils/api';
import { useTheme } from '@/context/ThemeContext';
import { PageHelp } from '@/components/PageHelp/PageHelp';
import { TabIndex } from '@/hooks/useDocumentationTabs';
import dynamic from 'next/dynamic';
import { cn } from "@/lib/utils";

const Editor = dynamic(() => import('@monaco-editor/react'), {
    ssr: false,
    loading: () => (
        <div className="flex items-center justify-center h-full bg-muted/30 rounded-xl border border-border/50 animate-pulse">
            <Loader2 className="h-6 w-6 text-primary animate-spin" />
        </div>
    )
});

interface Log {
    message: string;
    type: 'info' | 'error' | 'success';
}

export default function VisualMigrationPage() {
    const router = useRouter();
    const { state, dispatch } = useGlobalContext();
    const { loading: _loadingSpaces } = useSpaces();
    const { mode } = useTheme();

    const selectedSpaceId = state.spaceId;
    const selectedTargetEnv = state.selectedTarget;
    const targetEnvironments = state.targetEnvironments;

    const [activeTab, setActiveTab] = useState("builder"); // "builder" | "library"
    const [migrationCode, setMigrationCode] = useState('module.exports = function (migration) {\n  // Build your migration using Visual Builder or Templates\n};');
    const [visualSteps, setVisualSteps] = useState<MigrationStep[]>([]);
    const [lastGeneratedSteps, setLastGeneratedSteps] = useState<string>('[]');
    const [runConfirmationOpen, setRunConfirmationOpen] = useState(false);
    const [logs, setLogs] = useState<Log[]>([]);
    const [isRunning, setIsRunning] = useState(false);
    const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
    const [previewCode, setPreviewCode] = useState('');
    const [resultModalOpen, setResultModalOpen] = useState(false);
    const [resultSuccess, setResultSuccess] = useState<boolean>(true);
    const [resultErrorMessage, setResultErrorMessage] = useState('');

    useEffect(() => {
        const loadEnvironments = async () => {
            if (!selectedSpaceId) {
                dispatch({ type: 'SET_ENVIRONMENTS', payload: { donorEnvironments: [], targetEnvironments: [] } });
                return;
            }

            try {
                const result = await api.get<any>(`/api/environments?spaceId=${selectedSpaceId}`);

                if (result.success && result.data?.environments) {
                    dispatch({
                        type: 'SET_ENVIRONMENTS',
                        payload: {
                            donorEnvironments: result.data.environments,
                            targetEnvironments: result.data.environments
                        }
                    });
                } else {
                    console.error('Failed to load environments:', result.error);
                }
            } catch (error) {
                console.error('Failed to load environments:', error);
            }
        };

        loadEnvironments();
    }, [selectedSpaceId, dispatch]);

    const handleGenerateCode = () => {
        const code = generateMigrationCode(visualSteps, '');
        setMigrationCode(code);
        setLastGeneratedSteps(JSON.stringify(visualSteps));
    };

    const handleUseTemplate = (template: MigrationTemplate) => {
        if (!template.steps || template.steps.length === 0) return;

        // Deep clone to ensure React detects the state change
        const clonedSteps: MigrationStep[] = JSON.parse(JSON.stringify(template.steps));
        setVisualSteps(clonedSteps);
        setActiveTab("builder");
        setTimeout(() => {
            const code = generateMigrationCode(clonedSteps, '');
            setMigrationCode(code);
            setLastGeneratedSteps(JSON.stringify(clonedSteps));
        }, 100);
    };

    const handlePreviewTemplate = (template: MigrationTemplate) => {
        if (!template.steps || template.steps.length === 0) return;

        const code = generateMigrationCode(template.steps, '');
        setPreviewCode(code);
        setPreviewDialogOpen(true);
    };

    const handleRunMigration = async () => {
        if (!selectedSpaceId || !selectedTargetEnv) {
            return;
        }
        setRunConfirmationOpen(true);
    };

    const executeMigration = async (stepsToRun: MigrationStep[]) => {
        setIsRunning(true);
        setLogs([{ message: 'Starting migration protocol...', type: 'info' }]);

        try {
            const response = await fetch('/api/visual-migrate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    spaceId: selectedSpaceId,
                    environmentId: selectedTargetEnv,
                    steps: stepsToRun
                })
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                const message = errorData.error || errorData.message || 'Migration request failed';
                const instruction = parseError(message);
                setLogs(prev => [...prev, { message: instructionToString(instruction), type: 'error' }]);
                setIsRunning(false);
                return;
            }

            if (response.body) {
                const reader = response.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value);
                    const lines = chunk.split('\n').filter(line => line.trim());

                    for (const line of lines) {
                        try {
                            const data = JSON.parse(line.replace('data: ', ''));

                            if (data.type === 'error') {
                                const instruction = parseError(data.message);
                                const translatedError = instructionToString(instruction);
                                setLogs(prev => [...prev, { ...data, message: translatedError }]);
                                setResultSuccess(false);
                                setResultErrorMessage(data.message);
                            } else {
                                setLogs(prev => [...prev, data]);
                                if (data.type === 'success' && data.message.includes('successfully')) {
                                    setResultSuccess(true);
                                }
                            }
                        } catch (e) {
                            console.error('Migration log parse error:', e, 'Line:', line);
                        }
                    }
                }
            }
        } catch (error) {
            const instruction = parseError(error instanceof Error ? error.message : 'Unknown error');
            const translatedError = instructionToString(instruction);
            setLogs(prev => [...prev, { message: translatedError, type: 'error' }]);
            setResultSuccess(false);
            setResultErrorMessage(translatedError);
        } finally {
            setIsRunning(false);
            setResultModalOpen(true);
        }
    };

    return (
        <div className="max-w-7xl mx-auto pt-8 pb-4 px-6 flex flex-col h-[calc(100vh-4rem)] min-h-[1000px] gap-6 animate-in fade-in duration-500">
            {/* Header Section */}
            <header className="shrink-0 bg-card border border-border/50 p-4 rounded-3xl shadow-2xl flex items-center justify-between">
                <div className="flex items-center gap-6">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push('/dashboard')}
                        className="gap-2 px-4 rounded-xl hover:bg-muted/10 text-muted-foreground hover:text-foreground transition-all"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="text-xs font-bold uppercase tracking-widest">Abort Builder</span>
                    </Button>

                    <div className="h-8 w-[1px] bg-border/50" />

                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
                                Visual Forge
                            </h1>
                            <PageHelp
                                description="Design migration scripts visually without writing code. Create content types, fields, and transformations using a drag-and-drop interface."
                                docTab={TabIndex.VISUAL_BUILDER}
                            />
                        </div>
                        <span className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mt-1">Architectural Migration Terminal</span>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <SpaceSelector className="w-64" />
                    <div className="h-12 w-px bg-border/50 mx-2" />
                    <div className="space-y-3 w-64 text-left">
                        <span className="text-sm font-semibold text-muted-foreground block">
                            Target Node
                        </span>
                        <Select
                            value={selectedTargetEnv}
                            onValueChange={(val) => dispatch({ type: 'SET_TARGET_ENV', payload: val })}
                        >
                            <SelectTrigger className="w-full bg-background/50">
                                <SelectValue placeholder="Node Selection" />
                            </SelectTrigger>
                            <SelectContent>
                                {targetEnvironments.map((env) => (
                                    <SelectItem
                                        key={env.id}
                                        value={env.id}
                                    >
                                        {env.name} <span className="text-[10px] opacity-50 ml-1">({env.id})</span>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </header>

            {/* Main Workspace */}
            <div className="flex-1 min-h-[800px] grid grid-cols-12 gap-6 overflow-hidden mb-6">
                {/* Left Panel: Tools & Templates */}
                <div className="col-span-12 md:col-span-5 flex flex-col min-h-0">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                        <TabsList className="shrink-0 grid w-full grid-cols-2 bg-card border border-border/50 rounded-2xl p-1 mb-4 h-12 shadow-xl">
                            <TabsTrigger
                                value="builder"
                                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white text-sm font-bold uppercase tracking-widest transition-all"
                            >
                                <Hammer className="h-4 w-4 mr-2" />
                                Visual Builder
                            </TabsTrigger>
                            <TabsTrigger
                                value="library"
                                className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white text-sm font-bold uppercase tracking-widest transition-all"
                            >
                                <Library className="h-4 w-4 mr-2" />
                                Template Library
                            </TabsTrigger>
                        </TabsList>

                        <div className="flex-1 min-h-0">
                            <TabsContent value="builder" className="h-full m-0 outline-none">
                                <VisualBuilder
                                    steps={visualSteps}
                                    onStepsChange={setVisualSteps}
                                    onGenerateCode={handleGenerateCode}
                                    contentType={''}
                                />
                            </TabsContent>
                            <TabsContent value="library" className="h-full m-0 outline-none">
                                <TemplateLibrary
                                    onUseTemplate={handleUseTemplate}
                                    onPreviewCode={handlePreviewTemplate}
                                />
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Right Panel: Editor & Telemetry */}
                <div className="col-span-12 md:col-span-7 flex flex-col gap-6 min-h-0">
                    <div className="flex-1 min-h-0">
                        <CodeEditorPanel
                            code={migrationCode}
                        />
                    </div>

                    <Card className="shrink-0 bg-card border-border/50 shadow-2xl overflow-hidden rounded-3xl">
                        <CardHeader className="py-3 px-6 border-b border-border/50 bg-muted/30">
                            <div className="flex items-center gap-2">
                                <Play className="h-4 w-4 text-primary" />
                                <CardTitle className="text-sm font-bold uppercase tracking-widest">Execute Script</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4">
                            <ActionButtons
                                code={migrationCode}
                                steps={visualSteps}
                                contentType={''}
                                spaceId={selectedSpaceId}
                                targetEnv={selectedTargetEnv}
                                onRun={handleRunMigration}
                                isRunning={isRunning}
                                disabled={!selectedSpaceId || !selectedTargetEnv}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Telemetry Logs (Full Width) */}
            {logs.length > 0 && (
                <div className="shrink-0 h-[500px] overflow-y-auto rounded-3xl bg-muted/30 border border-border/50 p-4 space-y-2 shadow-inner scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
                    <div className="flex items-center gap-2 mb-3 px-1 sticky top-0 bg-muted/30 py-1 border-b border-border/50">
                        <Terminal className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Neural Telemetry Output</span>
                    </div>
                    {logs.map((log, idx) => (
                        <Alert
                            key={idx}
                            className={cn(
                                "py-2 px-4 rounded-xl border border-border/50 animate-in slide-in-from-left-2 duration-300",
                                log.type === 'error' ? "bg-destructive/5 text-destructive border-destructive/10" :
                                    log.type === 'success' ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/10" :
                                        "bg-muted/20 text-muted-foreground"
                            )}
                        >
                            <AlertDescription className="text-xs font-mono leading-relaxed group flex items-center gap-2">
                                <span className="opacity-30">[{new Date().toLocaleTimeString()}]</span>
                                {log.message}
                            </AlertDescription>
                        </Alert>
                    ))}
                </div>
            )}

            {/* Template Preview Dialog */}
            <Dialog open={previewDialogOpen} onOpenChange={setPreviewDialogOpen}>
                <DialogContent className="max-w-4xl bg-card border-border/50 rounded-3xl shadow-2xl p-0 overflow-hidden outline-none">
                    <DialogHeader className="p-6 border-b border-border/50 bg-muted/30">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                                <Library className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-black uppercase tracking-widest">Template Manifest Preview</DialogTitle>
                                <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">Read-only script serialization</DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <div className="p-6 bg-muted/30">
                        <div className="h-[400px] rounded-2xl overflow-hidden border border-border/50 shadow-inner">
                            <Editor
                                height="100%"
                                language="javascript"
                                theme={mode === 'dark' ? 'vs-dark' : 'light'}
                                value={previewCode}
                                options={{
                                    readOnly: true,
                                    minimap: { enabled: false },
                                    fontSize: 12,
                                    fontFamily: 'JetBrains Mono, monospace',
                                    padding: { top: 20 }
                                }}
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-4 border-t border-border/50 bg-muted/20">
                        <Button
                            onClick={() => setPreviewDialogOpen(false)}
                            className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest"
                        >
                            De-initialize
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Run Confirmation Dialog */}
            <Dialog open={runConfirmationOpen} onOpenChange={setRunConfirmationOpen}>
                <DialogContent className="sm:max-w-[500px] bg-card border-border/50 rounded-3xl shadow-2xl p-8 outline-none">
                    {(() => {
                        const isStale = visualSteps.length > 0 && JSON.stringify(visualSteps) !== lastGeneratedSteps;
                        const isDefaultCode = visualSteps.length === 0;

                        let title = "Execute Migration?";
                        let severity: 'warning' | 'info' | 'error' = 'info';

                        if (isStale) {
                            title = "Manifest Desync Detected";
                            severity = 'warning';
                        } else if (isDefaultCode) {
                            title = "Empty Script Serialization";
                            severity = 'warning';
                        }

                        return (
                            <div className="space-y-6">
                                <div className="flex items-center gap-4">
                                    <div className={cn(
                                        "h-12 w-12 rounded-2xl flex items-center justify-center border",
                                        severity === 'warning' ? "bg-amber-500/10 border-amber-500/20 text-amber-500" : "bg-primary/10 border-primary/20 text-primary"
                                    )}>
                                        <AlertTriangle className="h-6 w-6" />
                                    </div>
                                    <div className="space-y-1">
                                        <DialogTitle className={cn("text-xl font-black uppercase tracking-tight", severity === 'warning' && "text-amber-500")}>
                                            {title}
                                        </DialogTitle>
                                        <DialogDescription className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Node: {targetEnvironments.find(e => e.id === selectedTargetEnv)?.name}</DialogDescription>
                                    </div>
                                </div>

                                <div className="p-4 rounded-2xl bg-muted/20 border border-border/50 space-y-3">
                                    <p className="text-sm font-medium text-foreground/80 leading-relaxed italic">
                                        {isStale
                                            ? "Visual modules have been modified without script re-serialization. Executing now will utilize obsolete code."
                                            : isDefaultCode
                                                ? "The migration manifest appears empty. Execution will have zero impact on the target node."
                                                : `Are you sure you want to commit this transformation to "${targetEnvironments.find(e => e.id === selectedTargetEnv)?.name}"?`}
                                    </p>

                                    {isStale && (
                                        <div className="flex items-center gap-2 py-2 px-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[9px] font-black uppercase tracking-widest">
                                            <Zap className="h-3 w-3" /> Unsaved changes will be included
                                        </div>
                                    )}
                                </div>

                                <div className="flex flex-col gap-3 pt-4">
                                    {isStale && (
                                        <Button
                                            onClick={() => {
                                                setRunConfirmationOpen(false);
                                                const newCode = generateMigrationCode(visualSteps, '');
                                                setMigrationCode(newCode);
                                                setLastGeneratedSteps(JSON.stringify(visualSteps));
                                                executeMigration(visualSteps);
                                            }}
                                            className="w-full py-6 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest shadow-xl shadow-primary/20"
                                        >
                                            Confirm & Execute
                                        </Button>
                                    )}
                                    <Button
                                        onClick={() => {
                                            setRunConfirmationOpen(false);
                                            executeMigration(visualSteps);
                                        }}
                                        variant={isStale ? "ghost" : "default"}
                                        className={cn(
                                            "w-full py-6 rounded-2xl font-black uppercase tracking-widest transition-all",
                                            !isStale && (isDefaultCode ? "bg-amber-500 hover:bg-amber-600" : "bg-primary hover:bg-primary/90")
                                        )}
                                    >
                                        {isStale ? "Execute Without Saving View" : "Confirm Protocol Start"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        onClick={() => setRunConfirmationOpen(false)}
                                        className="text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground"
                                    >
                                        Abort Request
                                    </Button>
                                </div>
                            </div>
                        );
                    })()}
                </DialogContent>
            </Dialog>

            <Dialog open={resultModalOpen} onOpenChange={setResultModalOpen}>
                <DialogContent className="sm:max-w-[500px] border-primary/20 bg-card/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-3 text-2xl font-extrabold uppercase tracking-tight pr-10">
                            {resultSuccess ? (
                                <>
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                    <span>Migration Successful</span>
                                </>
                            ) : (
                                <>
                                    <XCircle className="h-6 w-6 text-destructive" />
                                    <span>Migration Failed</span>
                                </>
                            )}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6 py-4">
                        {resultSuccess ? (
                            <div className="space-y-4">
                                <Alert className="bg-green-500/10 border-green-500/20 text-green-500">
                                    <CheckCircle2 className="h-4 w-4" />
                                    <AlertTitle className="font-bold">Migration Complete</AlertTitle>
                                    <AlertDescription>
                                        The visual migration has been successfully executed on the target environment.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle className="font-bold">Process Aborted</AlertTitle>
                                    <AlertDescription>
                                        An error occurred during the migration process.
                                    </AlertDescription>
                                </Alert>

                                {resultErrorMessage && (
                                    <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg max-h-[150px] overflow-y-auto">
                                        <h4 className="text-xs font-extrabold uppercase tracking-widest text-destructive mb-2 flex items-center gap-2">
                                            <Info className="h-3 w-3" /> Error Details
                                        </h4>
                                        <p className="text-sm font-mono text-destructive break-words leading-relaxed whitespace-pre-wrap">
                                            {resultErrorMessage}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <DialogFooter className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => router.push('/dashboard/profile?tab=logs')}
                            className="font-bold border-border/50"
                        >
                            <Info className="mr-2 h-4 w-4" />
                            View Logs
                        </Button>
                        <Button
                            onClick={() => setResultModalOpen(false)}
                            className={cn(
                                "flex-1 font-bold",
                                resultSuccess ? "bg-green-600 hover:bg-green-700" : "bg-destructive hover:bg-destructive/90"
                            )}
                        >
                            Close Result
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
