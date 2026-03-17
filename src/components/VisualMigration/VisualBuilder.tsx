"use client";
import React, { useState } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Trash2,
    Edit3,
    GripVertical,
    Plus,
    Loader2,
    Info,
    Code2,
    Save
} from "lucide-react";
import { OperationSelector } from './OperationSelector';
import { StepEditor } from './StepEditor';
import { useVisualBuilderTemplates } from '@/hooks/useVisualBuilderTemplates';
import { MigrationStep } from '@/templates/migration-templates';
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

interface VisualBuilderProps {
    steps: MigrationStep[];
    onStepsChange: (steps: MigrationStep[]) => void;
    onGenerateCode: () => void;
    contentType: string;
}

export const VisualBuilder: React.FC<VisualBuilderProps> = ({
    steps,
    onStepsChange,
    onGenerateCode,
    contentType
}) => {
    const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
    const [editingStep, setEditingStep] = useState<MigrationStep | null>(null);
    const [isSaveDialogOpen, setIsSaveDialogOpen] = useState(false);
    const [templateName, setTemplateName] = useState('');
    const [templateDescription, setTemplateDescription] = useState('');

    const { saveTemplate, loading: savingTemplate } = useVisualBuilderTemplates();

    const handleDragStart = (index: number) => {
        setDraggedIndex(index);
    };

    const handleDragOver = (e: React.DragEvent, index: number) => {
        e.preventDefault();
        if (draggedIndex === null || draggedIndex === index) return;

        const newSteps = [...steps];
        const [removed] = newSteps.splice(draggedIndex, 1);
        newSteps.splice(index, 0, removed);

        onStepsChange(newSteps);
        setDraggedIndex(index);
    };

    const handleDragEnd = () => {
        setDraggedIndex(null);
    };

    const handleDelete = (index: number) => {
        const newSteps = steps.filter((_, i) => i !== index);
        onStepsChange(newSteps);
    };

    const handleEdit = (step: MigrationStep) => {
        setEditingStep(step);
    };

    const handleSaveEdit = (updatedStep: MigrationStep) => {
        const newSteps = steps.map(s => s.id === updatedStep.id ? updatedStep : s);
        onStepsChange(newSteps);
        setEditingStep(null);
    };

    const handleAddOperation = (operation: Partial<MigrationStep>) => {
        const newStep: MigrationStep = {
            id: operation.id || Date.now().toString(),
            type: operation.type || 'field',
            operation: operation.operation || '',
            label: operation.label || '',
            icon: operation.icon || '📝',
            params: operation.params || {}
        };

        if (newStep.type === 'field' && !newStep.params.contentType) {
            const createContentTypeStep = steps.find(s => s.operation === 'createContentType');
            if (createContentTypeStep?.params.contentTypeId) {
                newStep.params.contentType = createContentTypeStep.params.contentTypeId;
            } else if (contentType) {
                newStep.params.contentType = contentType;
            }
        }

        onStepsChange([...steps, newStep]);
    };

    const handleSaveTemplateClick = async () => {
        if (!templateName.trim()) return;

        const success = await saveTemplate(templateName, templateDescription, steps);
        if (success) {
            setIsSaveDialogOpen(false);
            setTemplateName('');
            setTemplateDescription('');
        }
    };

    return (
        <Card className="h-full border-primary/20 bg-card/50 backdrop-blur-sm flex flex-col overflow-hidden">
            <CardHeader className="pb-4 shrink-0">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-extrabold uppercase tracking-tight text-primary">Visual Builder</CardTitle>
                        <CardDescription className="text-sm font-medium text-muted-foreground mt-1">
                            Build migrations step-by-step without writing code
                        </CardDescription>
                    </div>
                    {steps.length > 0 && (
                        <div className="flex items-center">
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => onStepsChange([])}
                                            className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="bg-destructive text-destructive-foreground font-bold uppercase tracking-widest text-[10px] border-none shadow-xl">
                                        <p>Clear Schema</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <OperationSelector
                        onSelectOperation={handleAddOperation}
                        contentType={contentType}
                    />
                </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col min-h-0 p-0">
                {steps.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center py-20 text-center space-y-4 animate-in fade-in zoom-in duration-500">
                        <div className="p-4 bg-muted/20 rounded-full">
                            <Plus className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                        <div>
                            <p className="text-base font-bold text-muted-foreground uppercase tracking-widest">No steps yet</p>
                            <p className="text-sm text-muted-foreground/60 mt-1">Select an operation to begin building your migration</p>
                        </div>
                    </div>
                ) : (
                    <>
                        <div className="px-6 py-2 shrink-0">
                            <Alert className="bg-primary/5 border-primary/20 py-2">
                                <Info className="h-4 w-4 text-primary" />
                                <AlertDescription className="text-xs font-bold uppercase tracking-widest text-primary/80">
                                    Drag to reorder • Double click to edit parameters
                                </AlertDescription>
                            </Alert>
                        </div>

                        <ScrollArea className="flex-1 px-6">
                            <div className="space-y-3 pb-6">
                                {steps.map((step, index) => (
                                    <div
                                        key={step.id}
                                        draggable
                                        onDragStart={() => handleDragStart(index)}
                                        onDragOver={(e) => handleDragOver(e, index)}
                                        onDragEnd={handleDragEnd}
                                        onDoubleClick={() => handleEdit(step)}
                                        className={cn(
                                            "group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-grab active:cursor-grabbing",
                                            draggedIndex === index ? "bg-primary/10 border-primary/40 scale-[0.98] shadow-inner" : "bg-muted/20 border-border/50 hover:border-primary/20 hover:bg-muted/30 shadow-lg shadow-black/5"
                                        )}
                                    >
                                        <div className="shrink-0 text-muted-foreground/40 group-hover:text-primary transition-colors">
                                            <GripVertical className="h-4 w-4" />
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center flex-wrap gap-2 mb-1">
                                                <span className="text-lg leading-none shrink-0">{step.icon}</span>
                                                <p className="text-base font-extrabold tracking-tight break-words">
                                                    <span className="text-primary/60 mr-1.5 opacity-50">{index + 1}.</span>
                                                    {step.label}
                                                </p>
                                                <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-mono uppercase tracking-tighter opacity-60 shrink-0">
                                                    {step.type}
                                                </Badge>
                                            </div>
                                            <p className="text-xs font-mono text-muted-foreground/60 break-words whitespace-normal italic">
                                                {Object.entries(step.params)
                                                    .filter(([key]) => !['contentType'].includes(key))
                                                    .map(([key, value]) => `${key}: ${value}`)
                                                    .join(' • ')}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => handleEdit(step)}
                                            >
                                                <Edit3 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-destructive"
                                                onClick={() => handleDelete(index)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>

                        <div className="p-6 bg-muted/40 border-t border-border/50 shrink-0">
                            <div className="grid grid-cols-2 gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsSaveDialogOpen(true)}
                                    className="font-extrabold uppercase tracking-widest text-xs h-10 border-primary/20 hover:bg-primary/5 text-primary"
                                >
                                    <Save className="h-4 w-4 mr-2" />
                                    Save Template
                                </Button>
                                <Button
                                    onClick={onGenerateCode}
                                    className="font-extrabold uppercase tracking-widest text-xs h-10 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                >
                                    <Code2 className="h-4 w-4 mr-2" />
                                    Generate Code
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>

            <StepEditor
                open={Boolean(editingStep)}
                step={editingStep}
                onClose={() => setEditingStep(null)}
                onSave={handleSaveEdit}
            />

            <Dialog open={isSaveDialogOpen} onOpenChange={(val) => !val && setIsSaveDialogOpen(false)}>
                <DialogContent className="sm:max-w-md border-primary/20 bg-card/95 backdrop-blur-xl">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-extrabold uppercase tracking-tight">Save Deployment Template</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">Template Name</label>
                            <Input
                                placeholder="e.g., Blog Schema Base"
                                value={templateName}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTemplateName(e.target.value)}
                                className="bg-muted/20 border-border/50"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">Objective Manifest</Label>
                            <Textarea
                                placeholder="Describe the purpose of this migration template..."
                                value={templateDescription}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTemplateDescription(e.target.value)}
                                className="bg-muted/20 border-border/50 min-h-[100px]"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setIsSaveDialogOpen(false)}
                            className="text-xs font-bold uppercase tracking-widest"
                        >
                            Abort
                        </Button>
                        <Button
                            onClick={handleSaveTemplateClick}
                            disabled={savingTemplate || !templateName.trim()}
                            className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-lg shadow-primary/20 text-xs uppercase tracking-widest h-10"
                        >
                            {savingTemplate ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Commit Template'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
};
