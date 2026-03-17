"use client";
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { MigrationStep } from '@/templates/migration-templates';
import {
    createContentTypeSchema,
    deleteContentTypeSchema,
    createFieldSchema,
    renameFieldSchema,
    deleteFieldSchema,
    transformEntriesSchema,
    deriveLinkedEntriesSchema
} from '@/utils/validation-schemas';
import { ZodError } from 'zod';
import {
    AlertTriangle,
    Save,
    X,
    Settings2,
    Info,
    Wand2,
    Layout,
    Palette
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface StepEditorProps {
    open: boolean;
    step: MigrationStep | null;
    onClose: () => void;
    onSave: (step: MigrationStep) => void;
}

export const StepEditor: React.FC<StepEditorProps> = ({
    open,
    step,
    onClose,
    onSave
}) => {
    const [editedStep, setEditedStep] = useState<MigrationStep | null>(step);
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    React.useEffect(() => {
        setEditedStep(step);
        setFieldErrors({});
    }, [step]);

    if (!editedStep) return null;

    const handleSave = () => {
        setFieldErrors({});

        try {
            switch (editedStep.operation) {
                case 'createContentType':
                    createContentTypeSchema.parse(editedStep.params);
                    break;

                case 'deleteContentType':
                    deleteContentTypeSchema.parse(editedStep.params);
                    break;

                case 'createField':
                    createFieldSchema.parse(editedStep.params);
                    break;

                case 'renameField':
                    renameFieldSchema.parse(editedStep.params);
                    break;

                case 'deleteField':
                    deleteFieldSchema.parse(editedStep.params);
                    break;

                case 'addValidation':
                    deleteFieldSchema.parse(editedStep.params);
                    break;

                case 'editField':
                    if (editedStep.params.required && (editedStep.params.disabled || editedStep.params.omitted)) {
                        throw new ZodError([{
                            code: 'custom',
                            path: ['required'],
                            message: 'Cannot be required if disabled or omitted'
                        }]);
                    }
                    if (!editedStep.params.contentType) {
                        throw new ZodError([{
                            code: 'custom',
                            path: ['contentType'],
                            message: 'Content Type ID is required'
                        }]);
                    }
                    if (!editedStep.params.fieldId) {
                        throw new ZodError([{
                            code: 'custom',
                            path: ['fieldId'],
                            message: 'Field ID is required'
                        }]);
                    }
                    break;

                case 'updateEntry':
                    if (!editedStep.params.contentType) {
                        throw new ZodError([{
                            code: 'custom',
                            path: ['contentType'],
                            message: 'Content Type ID is required'
                        }]);
                    }
                    if (!editedStep.params.entryId) {
                        throw new ZodError([{
                            code: 'custom',
                            path: ['entryId'],
                            message: 'Entry ID is required'
                        }]);
                    }
                    if (!editedStep.params.fieldId) {
                        throw new ZodError([{
                            code: 'custom',
                            path: ['fieldId'],
                            message: 'Field ID is required'
                        }]);
                    }
                    if (!editedStep.params.newValue) {
                        throw new ZodError([{
                            code: 'custom',
                            path: ['newValue'],
                            message: 'New value is required'
                        }]);
                    }
                    break;

                case 'transformEntries':
                    if (!editedStep.params.contentType) {
                        throw new ZodError([{
                            code: 'custom',
                            path: ['contentType'],
                            message: 'Content Type ID is required'
                        }]);
                    }
                    transformEntriesSchema.parse(editedStep.params);
                    break;

                case 'deriveLinkedEntries':
                    deriveLinkedEntriesSchema.parse(editedStep.params);
                    break;
            }

            onSave(editedStep);
            onClose();
        } catch (error) {
            if (error instanceof ZodError) {
                const errors: Record<string, string> = {};
                error.issues.forEach((err) => {
                    const field = err.path[0] as string;
                    errors[field] = err.message;
                });
                setFieldErrors(errors);
            }
        }
    };

    const updateParam = (key: string, value: unknown) => {
        setEditedStep(prev => {
            if (!prev) return null;
            return {
                ...prev,
                params: { ...prev.params, [key]: value }
            };
        });
    };

    const generateIdFromName = (name: string): string => {
        if (!name) return '';
        let cleaned = name.replace(/[^a-zA-Z0-9\s-]/g, '');
        const words = cleaned.split(/[\s-]+/).filter(Boolean);
        if (words.length === 0) return '';

        const camelCased = words.map((word, index) => {
            const lower = word.toLowerCase();
            if (index === 0) return lower;
            return lower.charAt(0).toUpperCase() + lower.slice(1);
        }).join('');

        return camelCased.replace(/^[0-9]+/, '');
    };

    const renderWidgetSelector = () => {
        const isEditing = editedStep.operation === 'editField';
        const fieldType = isEditing ? (editedStep.params.fieldTypeContext as string) : (editedStep.params.fieldType as string);
        const linkType = editedStep.params.linkType as string;
        const arrayItemType = editedStep.params.arrayItemType as string;
        const arrayLinkType = editedStep.params.arrayLinkType as string;

        if (isEditing && !fieldType) {
            return (
                <div className="space-y-2 mt-4 p-4 bg-muted/20 border border-border/50 rounded-xl">
                    <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Field Type Context (For Appearance Settings)</Label>
                    <Select onValueChange={(val) => updateParam('fieldTypeContext', val)}>
                        <SelectTrigger className="bg-background border-border/50 h-11">
                            <SelectValue placeholder="Select field type to see appearance options" />
                        </SelectTrigger>
                        <SelectContent className="bg-card border-border/50">
                            <SelectItem value="Symbol">Text (Short)</SelectItem>
                            <SelectItem value="Text">Text (Long)</SelectItem>
                            <SelectItem value="Integer">Number (Integer)</SelectItem>
                            <SelectItem value="Number">Number (Decimal)</SelectItem>
                            <SelectItem value="Date">Date</SelectItem>
                            <SelectItem value="Boolean">Boolean</SelectItem>
                            <SelectItem value="Link">Reference (Entry / Media)</SelectItem>
                            <SelectItem value="Array">Array (List)</SelectItem>
                        </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground px-1 mt-2 flex items-center gap-1 opacity-70"><Info className="h-3 w-3" /> Select field type to enable valid appearance widgets. This does not change the actual field type in Contentful.</p>
                </div>
            );
        }

        let options: { value: string, label: string }[] = [];

        switch (fieldType) {
            case 'Symbol':
                options = [
                    { value: 'singleLine', label: 'Single Line (Default)' },
                    { value: 'dropdown', label: 'Dropdown' },
                    { value: 'radio', label: 'Radio Buttons' },
                    { value: 'urlEditor', label: 'URL Editor' },
                    { value: 'slugEditor', label: 'Slug Editor' },
                ];
                break;
            case 'Text':
                options = [
                    { value: 'multipleLine', label: 'Multi Line (Textarea)' },
                    { value: 'markdown', label: 'Markdown Editor' },
                ];
                break;
            case 'Integer':
            case 'Number':
                options = [
                    { value: 'numberEditor', label: 'Number Editor (Default)' },
                    { value: 'rating', label: 'Rating (Stars)' },
                    { value: 'dropdown', label: 'Dropdown' },
                    { value: 'radio', label: 'Radio Buttons' },
                ];
                break;
            case 'Boolean':
                options = [
                    { value: 'boolean', label: 'Radio Buttons (Yes/No)' },
                    { value: 'checkbox', label: 'Checkbox' },
                ];
                break;
            case 'Date':
                options = [
                    { value: 'datePicker', label: 'Date Picker (Default)' },
                ];
                break;
            case 'Link':
                if (isEditing) {
                    options = [
                        { value: 'entryLinkEditor', label: 'Entry Link Editor' },
                        { value: 'entryCardEditor', label: 'Entry Card Editor' },
                        { value: 'assetLinkEditor', label: 'Asset Link Editor' },
                    ];
                } else if (linkType === 'Asset' || linkType === 'ManyAsset') {
                    options = [
                        { value: 'assetLinkEditor', label: 'Asset Link Editor (Default)' },
                    ];
                } else {
                    options = [
                        { value: 'entryLinkEditor', label: 'Entry Link Editor (Default)' },
                        { value: 'entryCardEditor', label: 'Entry Card Editor' },
                    ];
                }
                break;
            case 'Array':
                if (isEditing) {
                    options = [
                        { value: 'tagEditor', label: 'Tag Editor' },
                        { value: 'checkbox', label: 'Checkbox List' },
                        { value: 'assetGalleryEditor', label: 'Asset Gallery Editor' },
                        { value: 'assetLinksEditor', label: 'Asset Links Editor' },
                        { value: 'entryLinksEditor', label: 'Entry Links Editor' },
                        { value: 'entryCardsEditor', label: 'Entry Cards Editor' },
                    ];
                } else if (arrayItemType === 'Symbol') {
                    options = [
                        { value: 'tagEditor', label: 'Tag Editor (Default)' },
                        { value: 'checkbox', label: 'Checkbox List' }
                    ];
                } else if (arrayItemType === 'Link') {
                    if (arrayLinkType === 'Asset') {
                        options = [
                            { value: 'assetGalleryEditor', label: 'Asset Gallery Editor (Default)' },
                            { value: 'assetLinksEditor', label: 'Asset Links Editor' }
                        ];
                    } else {
                        options = [
                            { value: 'entryLinksEditor', label: 'Entry Links Editor (Default)' },
                            { value: 'entryCardsEditor', label: 'Entry Cards Editor' },
                        ];
                    }
                }
                break;
        }

        if (options.length === 0) return null;

        return (
            <div className="space-y-2 mt-4 p-4 bg-muted/10 border border-border/50 rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1 flex items-center gap-2">
                        <Palette className="h-4 w-4 text-primary" />
                        Appearance (Widget)
                    </Label>
                    {isEditing && (
                        <div className="flex items-center gap-2 pr-1">
                            <span className="text-xs font-bold text-muted-foreground uppercase opacity-70">Type: {fieldType}</span>
                            <button className="text-[10px] font-bold text-primary hover:underline uppercase" onClick={() => updateParam('fieldTypeContext', '')}>Change</button>
                        </div>
                    )}
                </div>
                <Select
                    value={(editedStep.params.widgetId as string) || 'default'}
                    onValueChange={(val) => updateParam('widgetId', val === 'default' ? undefined : val)}
                >
                    <SelectTrigger className="bg-background border-border/50 h-11">
                        <SelectValue placeholder="Default Appearance" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border/50">
                        <SelectItem value="default" className="italic text-muted-foreground">Default Appearance</SelectItem>
                        {options.map(opt => (
                            <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        );
    };

    const renderFieldEditor = () => {
        switch (editedStep.operation) {
            case 'createField':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground px-1">Content Type ID</Label>
                            <Input
                                value={(editedStep.params.contentType as string) || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    updateParam('contentType', value);
                                    if (value && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
                                        setFieldErrors(prev => ({
                                            ...prev,
                                            contentType: 'Must start with a letter. Only letters, numbers, and underscores allowed.'
                                        }));
                                    } else {
                                        setFieldErrors(prev => {
                                            if (prev.contentType) {
                                                const { contentType: _, ...rest } = prev;
                                                return rest;
                                            }
                                            return prev;
                                        });
                                    }
                                }}
                                className={cn("bg-muted/20 border-border/50", fieldErrors.contentType && "border-destructive/50")}
                                placeholder="e.g., blogPost"
                            />
                            {fieldErrors.contentType && <p className="text-xs font-bold text-destructive uppercase px-1">{fieldErrors.contentType}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground px-1">Name (Optional)</Label>
                            <Input
                                value={(editedStep.params.name as string) || ''}
                                onChange={(e) => updateParam('name', e.target.value)}
                                onBlur={(e) => {
                                    const nameVal = e.target.value;
                                    if (nameVal && !editedStep.params.fieldId) {
                                        const autoId = generateIdFromName(nameVal);
                                        if (autoId) updateParam('fieldId', autoId);
                                    }
                                }}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., Summary"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground px-1">Field ID</Label>
                            <Input
                                value={(editedStep.params.fieldId as string) || ''}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    updateParam('fieldId', value);
                                    if (value && !/^[a-zA-Z][a-zA-Z0-9_]*$/.test(value)) {
                                        setFieldErrors(prev => ({
                                            ...prev,
                                            fieldId: 'Must start with a letter. Only letters, numbers, and underscores allowed.'
                                        }));
                                    } else {
                                        setFieldErrors(prev => {
                                            if (prev.fieldId) {
                                                const { fieldId: _, ...rest } = prev;
                                                return rest;
                                            }
                                            return prev;
                                        });
                                    }
                                }}
                                className={cn("bg-muted/20 border-border/50", fieldErrors.fieldId && "border-destructive/50")}
                                placeholder="e.g., summary"
                            />
                            {fieldErrors.fieldId && <p className="text-xs font-bold text-destructive uppercase px-1">{fieldErrors.fieldId}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground px-1">Field Type</Label>
                            <Select
                                value={(editedStep.params.fieldType as string) || 'Symbol'}
                                onValueChange={(val) => updateParam('fieldType', val)}
                            >
                                <SelectTrigger className="bg-muted/20 border-border/50 h-11">
                                    <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border/50">
                                    <SelectItem value="Symbol">Text (Short)</SelectItem>
                                    <SelectItem value="Text">Text (Long)</SelectItem>
                                    <SelectItem value="Integer">Number (Integer)</SelectItem>
                                    <SelectItem value="Number">Number (Decimal)</SelectItem>
                                    <SelectItem value="Date">Date</SelectItem>
                                    <SelectItem value="Boolean">Boolean</SelectItem>
                                    <SelectItem value="Link">Reference (Entry)</SelectItem>
                                    <SelectItem value="Media">Media (Asset)</SelectItem>
                                    <SelectItem value="RichText">Rich Text</SelectItem>
                                    <SelectItem value="Array">Array (List)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex items-center space-x-2 pt-2 px-1">
                            <Checkbox
                                id="displayField"
                                checked={!!editedStep.params.isDisplayField}
                                onCheckedChange={(val) => updateParam('isDisplayField', val)}
                                className="border-primary/20 data-[state=checked]:bg-primary"
                            />
                            <Label htmlFor="displayField" className="text-sm font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">Use as Entry Title (Display Field)</Label>
                        </div>

                        <div className="flex items-center space-x-2 px-1 pb-4">
                            <Checkbox
                                id="requiredField"
                                checked={!!editedStep.params.required}
                                onCheckedChange={(val) => updateParam('required', val)}
                                className="border-primary/20 data-[state=checked]:bg-primary"
                            />
                            <Label htmlFor="requiredField" className="text-sm font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">Required field</Label>
                        </div>

                        {(editedStep.params.fieldType === 'Link' || editedStep.params.fieldType === 'Media' || editedStep.params.fieldType === 'Array') && (
                            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-4">
                                <p className="text-xs font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                    <Settings2 className="h-3 w-3" /> Advanced Parameters
                                </p>

                                {editedStep.params.fieldType === 'Link' && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-extrabold uppercase tracking-tight">Reference Type</Label>
                                        <Select value={(editedStep.params.linkType as string) || 'Entry'} onValueChange={(val) => updateParam('linkType', val)}>
                                            <SelectTrigger className="bg-background border-primary/10 h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Entry">One reference</SelectItem>
                                                <SelectItem value="ManyEntry">Many references</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {editedStep.params.fieldType === 'Media' && (
                                    <div className="space-y-2">
                                        <Label className="text-sm font-extrabold uppercase tracking-tight">Media Type</Label>
                                        <Select value={(editedStep.params.linkType as string) || 'Asset'} onValueChange={(val) => updateParam('linkType', val)}>
                                            <SelectTrigger className="bg-background border-primary/10 h-10">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Asset">One media</SelectItem>
                                                <SelectItem value="ManyAsset">Many media (Gallery)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {editedStep.params.fieldType === 'Array' && (
                                    <>
                                        <div className="space-y-2">
                                            <Label className="text-sm font-extrabold uppercase tracking-tight">Array Item Type</Label>
                                            <Select value={(editedStep.params.arrayItemType as string) || 'Symbol'} onValueChange={(val) => updateParam('arrayItemType', val)}>
                                                <SelectTrigger className="bg-background border-primary/10 h-10">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Symbol">Text (Short)</SelectItem>
                                                    <SelectItem value="Link">Reference (Entry/Asset)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        {editedStep.params.arrayItemType === 'Link' && (
                                            <div className="space-y-2">
                                                <Label className="text-sm font-extrabold uppercase tracking-tight">Link Type</Label>
                                                <Select value={(editedStep.params.arrayLinkType as string) || 'Entry'} onValueChange={(val) => updateParam('arrayLinkType', val)}>
                                                    <SelectTrigger className="bg-background border-primary/10 h-10">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Entry">Entry</SelectItem>
                                                        <SelectItem value="Asset">Asset</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                        {renderWidgetSelector()}
                    </div>
                );

            case 'deleteField':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Content Type ID</Label>
                            <Input
                                value={(editedStep.params.contentType as string) || ''}
                                onChange={(e) => updateParam('contentType', e.target.value)}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., blogPost"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Field ID</Label>
                            <Input
                                value={(editedStep.params.fieldId as string) || ''}
                                onChange={(e) => updateParam('fieldId', e.target.value)}
                                className={cn("bg-muted/20 border-border/50", fieldErrors.fieldId && "border-destructive/50")}
                                placeholder="e.g., oldField"
                            />
                            {fieldErrors.fieldId && <p className="text-sm font-bold text-destructive uppercase px-1">{fieldErrors.fieldId}</p>}
                        </div>
                    </div>
                );

            case 'renameField':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Content Type ID</Label>
                            <Input
                                value={(editedStep.params.contentType as string) || ''}
                                onChange={(e) => updateParam('contentType', e.target.value)}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., blogPost"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Current Field ID</Label>
                            <Input
                                value={(editedStep.params.oldFieldId as string) || ''}
                                onChange={(e) => updateParam('oldFieldId', e.target.value)}
                                className={cn("bg-muted/20 border-border/50", fieldErrors.oldFieldId && "border-destructive/50")}
                                placeholder="e.g., oldName"
                            />
                            {fieldErrors.oldFieldId && <p className="text-sm font-bold text-destructive uppercase px-1">{fieldErrors.oldFieldId}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">New Field Name (Optional)</Label>
                            <Input
                                value={(editedStep.params.newFieldName as string) || ''}
                                onChange={(e) => updateParam('newFieldName', e.target.value)}
                                onBlur={(e) => {
                                    const nameVal = e.target.value;
                                    if (nameVal && !editedStep.params.newFieldId) {
                                        const autoId = generateIdFromName(nameVal);
                                        if (autoId) updateParam('newFieldId', autoId);
                                    }
                                }}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., Author Name"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">New Field ID</Label>
                            <Input
                                value={(editedStep.params.newFieldId as string) || ''}
                                onChange={(e) => updateParam('newFieldId', e.target.value)}
                                className={cn("bg-muted/20 border-border/50", fieldErrors.newFieldId && "border-destructive/50")}
                                placeholder="e.g., newName"
                            />
                            {fieldErrors.newFieldId && <p className="text-sm font-bold text-destructive uppercase px-1">{fieldErrors.newFieldId}</p>}
                        </div>
                    </div>
                );

            case 'createContentType':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Name</Label>
                            <div className="relative">
                                <Input
                                    value={(editedStep.params.name as string) || ''}
                                    onChange={(e) => updateParam('name', e.target.value)}
                                    onBlur={(e) => {
                                        const nameVal = e.target.value;
                                        if (nameVal && !editedStep.params.contentTypeId) {
                                            const autoId = generateIdFromName(nameVal);
                                            if (autoId) updateParam('contentTypeId', autoId);
                                        }
                                    }}
                                    className={cn("bg-muted/20 border-border/50 pr-10", fieldErrors.name && "border-destructive/50")}
                                    placeholder="e.g., Blog Post"
                                />
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 opacity-20 hover:opacity-100 transition-opacity">
                                    <Wand2 className="h-4 w-4 text-primary" />
                                </div>
                            </div>
                            {fieldErrors.name && <p className="text-sm font-bold text-destructive uppercase px-1">{fieldErrors.name}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Content Type ID</Label>
                            <Input
                                value={(editedStep.params.contentTypeId as string) || ''}
                                onChange={(e) => updateParam('contentTypeId', e.target.value)}
                                className={cn("bg-muted/20 border-border/50", fieldErrors.contentTypeId && "border-destructive/50")}
                                placeholder="e.g., blogPost"
                            />
                            {fieldErrors.contentTypeId && <p className="text-sm font-bold text-destructive uppercase px-1">{fieldErrors.contentTypeId}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Manifest Description</Label>
                            <Textarea
                                value={(editedStep.params.description as string) || ''}
                                onChange={(e) => updateParam('description', e.target.value)}
                                className="bg-muted/20 border-border/50 min-h-[80px]"
                                placeholder="What is the purpose of this content type?"
                            />
                        </div>
                    </div>
                );

            case 'deleteContentType':
                return (
                    <div className="space-y-4">
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription className="text-sm font-extrabold uppercase tracking-widest leading-relaxed">
                                CRITICAL: Ensure all entries of this type are purged in Contentful before deployment.
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Content Type ID</Label>
                            <Input
                                value={(editedStep.params.contentTypeId as string) || ''}
                                onChange={(e) => updateParam('contentTypeId', e.target.value)}
                                className={cn("bg-muted/20 border-border/50", fieldErrors.contentTypeId && "border-destructive/50")}
                                placeholder="e.g., blogPost"
                            />
                            {fieldErrors.contentTypeId && <p className="text-sm font-bold text-destructive uppercase px-1">{fieldErrors.contentTypeId}</p>}
                        </div>
                    </div>
                );

            case 'transformEntries':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Target Content Type</Label>
                            <Input
                                value={(editedStep.params.contentType as string) || ''}
                                onChange={(e) => updateParam('contentType', e.target.value)}
                                className={cn("bg-muted/20 border-border/50", fieldErrors.contentType && "border-destructive/50")}
                                placeholder="e.g., product"
                            />
                            {fieldErrors.contentType && <p className="text-sm font-bold text-destructive uppercase px-1">{fieldErrors.contentType}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Target Field</Label>
                            <Input
                                value={(editedStep.params.targetField as string) || ''}
                                onChange={(e) => updateParam('targetField', e.target.value)}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., summary"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Operation Vector</Label>
                            <Select value={(editedStep.params.transform as string) || 'copy'} onValueChange={(val) => updateParam('transform', val)}>
                                <SelectTrigger className="bg-muted/20 border-border/50 h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border/50">
                                    <SelectItem value="replace">REPLACE (Static Value)</SelectItem>
                                    <SelectItem value="copy">CLONE (No Change)</SelectItem>
                                    <SelectItem value="slug">GENERATIVE (Slugify)</SelectItem>
                                    <SelectItem value="lowercase">MUTATE (Lowercase)</SelectItem>
                                    <SelectItem value="uppercase">MUTATE (Uppercase)</SelectItem>
                                    <SelectItem value="trim">CLEAN (Trim)</SelectItem>
                                    <SelectItem value="defaultLocale">LOCALE (Fallback to Default)</SelectItem>
                                    <SelectItem value="clearEmpty">CLEAN (Clear Empty Strings)</SelectItem>
                                    <SelectItem value="findReplace">FIND & REPLACE (Text)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {editedStep.params.transform === 'replace' ? (
                            <div className="space-y-2">
                                <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Static Payload</Label>
                                <Textarea
                                    value={(editedStep.params.staticValue as string) || ''}
                                    onChange={(e) => updateParam('staticValue', e.target.value)}
                                    className="bg-muted/20 border-border/50 font-mono text-xs"
                                    placeholder='e.g., "active"'
                                />
                            </div>
                        ) : (editedStep.params.transform === 'copy' || editedStep.params.transform === 'slug') ? (
                            <div className="space-y-2">
                                <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Source Field</Label>
                                <Input
                                    value={(editedStep.params.sourceField as string) || ''}
                                    onChange={(e) => updateParam('sourceField', e.target.value)}
                                    className="bg-muted/20 border-border/50"
                                    placeholder="e.g., title"
                                />
                                <p className="text-[10px] text-muted-foreground px-1 uppercase tracking-widest font-bold">Field to read from (different from target)</p>
                            </div>
                        ) : null}

                        {editedStep.params.transform === 'findReplace' && (
                            <>
                                <div className="space-y-2">
                                    <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Find Text</Label>
                                    <Input
                                        value={(editedStep.params.findText as string) || ''}
                                        onChange={(e) => updateParam('findText', e.target.value)}
                                        className="bg-muted/20 border-border/50 font-mono text-xs"
                                        placeholder="e.g., old-domain.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Replace With</Label>
                                    <Input
                                        value={(editedStep.params.replaceText as string) || ''}
                                        onChange={(e) => updateParam('replaceText', e.target.value)}
                                        className="bg-muted/20 border-border/50 font-mono text-xs"
                                        placeholder="e.g., new-domain.com"
                                    />
                                </div>
                            </>
                        )}
                    </div>
                );

            case 'addValidation':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Content Type ID</Label>
                            <Input
                                value={(editedStep.params.contentType as string) || ''}
                                onChange={(e) => updateParam('contentType', e.target.value)}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., blogPost"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Field ID</Label>
                            <Input
                                value={(editedStep.params.fieldId as string) || ''}
                                onChange={(e) => updateParam('fieldId', e.target.value)}
                                className={cn("bg-muted/20 border-border/50", fieldErrors.fieldId && "border-destructive/50")}
                                placeholder="e.g., email"
                            />
                            {fieldErrors.fieldId && <p className="text-sm font-bold text-destructive uppercase px-1">{fieldErrors.fieldId}</p>}
                        </div>
                    </div>
                );

            case 'editField':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Content Type ID</Label>
                            <Input
                                value={(editedStep.params.contentType as string) || ''}
                                onChange={(e) => updateParam('contentType', e.target.value)}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., blogPost"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Field ID</Label>
                            <Input
                                value={(editedStep.params.fieldId as string) || ''}
                                onChange={(e) => updateParam('fieldId', e.target.value)}
                                className={cn("bg-muted/20 border-border/50", fieldErrors.fieldId && "border-destructive/50")}
                                placeholder="e.g., summary"
                            />
                            {fieldErrors.fieldId && <p className="text-sm font-bold text-destructive uppercase px-1">{fieldErrors.fieldId}</p>}
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">New Name (Optional)</Label>
                            <Input
                                value={(editedStep.params.name as string) || ''}
                                onChange={(e) => updateParam('name', e.target.value)}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., Article Summary"
                            />
                        </div>
                        <div className="flex flex-col space-y-1 px-1">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="editRequiredField"
                                    checked={!!editedStep.params.required}
                                    disabled={!!editedStep.params.disabled || !!editedStep.params.omitted}
                                    onCheckedChange={(val) => {
                                        if (val) {
                                            updateParam('disabled', false);
                                            updateParam('omitted', false);
                                        }
                                        updateParam('required', val);
                                    }}
                                    className="border-primary/20 data-[state=checked]:bg-primary disabled:opacity-50 disabled:cursor-not-allowed"
                                />
                                <Label htmlFor="editRequiredField" className={cn("text-sm font-bold uppercase tracking-widest text-muted-foreground cursor-pointer", (!!editedStep.params.disabled || !!editedStep.params.omitted) && "opacity-50 cursor-not-allowed")}>Required</Label>
                            </div>
                            {fieldErrors.required && <p className="text-sm font-bold text-destructive uppercase mt-1">{fieldErrors.required}</p>}
                        </div>
                        <div className="flex items-center space-x-2 px-1">
                            <Checkbox
                                id="editDisabledField"
                                checked={!!editedStep.params.disabled}
                                onCheckedChange={(val) => {
                                    if (val) updateParam('required', false);
                                    updateParam('disabled', val);
                                }}
                                className="border-primary/20 data-[state=checked]:bg-primary"
                            />
                            <Label htmlFor="editDisabledField" className="text-sm font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">Disabled (Read-Only in UI)</Label>
                        </div>
                        <div className="flex items-center space-x-2 px-1 pb-2">
                            <Checkbox
                                id="editOmittedField"
                                checked={!!editedStep.params.omitted}
                                onCheckedChange={(val) => {
                                    if (val) updateParam('required', false);
                                    updateParam('omitted', val);
                                }}
                                className="border-primary/20 data-[state=checked]:bg-primary"
                            />
                            <Label htmlFor="editOmittedField" className="text-sm font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">Omitted (Hidden from API Response)</Label>
                        </div>
                        {renderWidgetSelector()}
                    </div>
                );

            case 'setDisplayField':
                return (
                    <div className="space-y-4">
                        <Alert className="bg-primary/5 border-primary/20 py-2">
                            <Info className="h-4 w-4 text-primary" />
                            <AlertDescription className="text-sm font-bold uppercase tracking-widest text-primary/80">
                                The display field is shown as the entry title in the Contentful web app.
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Content Type ID</Label>
                            <Input
                                value={(editedStep.params.contentType as string) || ''}
                                onChange={(e) => updateParam('contentType', e.target.value)}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., blogPost"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Field ID (to use as title)</Label>
                            <Input
                                value={(editedStep.params.fieldId as string) || ''}
                                onChange={(e) => updateParam('fieldId', e.target.value)}
                                className={cn("bg-muted/20 border-border/50", fieldErrors.fieldId && "border-destructive/50")}
                                placeholder="e.g., title"
                            />
                            {fieldErrors.fieldId && <p className="text-sm font-bold text-destructive uppercase px-1">{fieldErrors.fieldId}</p>}
                        </div>
                    </div>
                );

            case 'moveField':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Content Type ID</Label>
                            <Input
                                value={(editedStep.params.contentType as string) || ''}
                                onChange={(e) => updateParam('contentType', e.target.value)}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., blogPost"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Field ID to Move</Label>
                            <Input
                                value={(editedStep.params.fieldId as string) || ''}
                                onChange={(e) => updateParam('fieldId', e.target.value)}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., slug"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Direction</Label>
                            <Select
                                value={(editedStep.params.direction as string) || 'afterField'}
                                onValueChange={(val) => updateParam('direction', val)}
                            >
                                <SelectTrigger className="bg-muted/20 border-border/50 h-11">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-card border-border/50">
                                    <SelectItem value="afterField">After Field</SelectItem>
                                    <SelectItem value="beforeField">Before Field</SelectItem>
                                    <SelectItem value="toTheTop">To The Top</SelectItem>
                                    <SelectItem value="toTheBottom">To The Bottom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {(editedStep.params.direction === 'afterField' || editedStep.params.direction === 'beforeField' || !editedStep.params.direction) && (
                            <div className="space-y-2">
                                <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Reference Field ID</Label>
                                <Input
                                    value={(editedStep.params.referenceField as string) || ''}
                                    onChange={(e) => updateParam('referenceField', e.target.value)}
                                    className="bg-muted/20 border-border/50"
                                    placeholder="e.g., title"
                                />
                            </div>
                        )}
                    </div>
                );

            case 'updateEntry':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Content Type ID</Label>
                            <Input
                                value={(editedStep.params.contentType as string) || ''}
                                onChange={(e) => updateParam('contentType', e.target.value)}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., blogPost"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Entry ID (Unique)</Label>
                            <Input
                                value={(editedStep.params.entryId as string) || ''}
                                onChange={(e) => updateParam('entryId', e.target.value)}
                                className="bg-muted/20 border-border/50 font-mono"
                                placeholder="e.g., 5KMiN6YP..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Target Field ID</Label>
                            <Input
                                value={(editedStep.params.fieldId as string) || ''}
                                onChange={(e) => updateParam('fieldId', e.target.value)}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., title"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Value Injection</Label>
                            <Textarea
                                value={(editedStep.params.newValue as string) || ''}
                                onChange={(e) => updateParam('newValue', e.target.value)}
                                className="bg-muted/20 border-border/50 min-h-[80px] font-mono"
                                placeholder='e.g., "Updated Title"'
                            />
                            <p className="text-xs font-medium text-muted-foreground/60 italic px-1">Supports raw strings or JSON objects.</p>
                        </div>
                    </div>
                );

            case 'deriveLinkedEntries':
                return (
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Source Model (Content Type)</Label>
                            <Input
                                value={(editedStep.params.contentType as string) || ''}
                                onChange={(e) => updateParam('contentType', e.target.value)}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., blogPost"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Derived Model (Target)</Label>
                            <Input
                                value={(editedStep.params.derivedContentType as string) || ''}
                                onChange={(e) => updateParam('derivedContentType', e.target.value)}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., author"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-sm font-extrabold uppercase tracking-widest text-muted-foreground px-1">Source Matrix (Fields)</Label>
                            <Input
                                value={(editedStep.params.sourceFields as string) || ''}
                                onChange={(e) => updateParam('sourceFields', e.target.value)}
                                className="bg-muted/20 border-border/50"
                                placeholder="e.g., authorName, authorBio"
                            />
                            <p className="text-xs font-medium text-muted-foreground/60 italic px-1">Comma-separated ID list.</p>
                        </div>
                        <div className="flex items-center space-x-2 pt-2 px-1">
                            <Checkbox
                                id="setDisplayField"
                                checked={!!editedStep.params.setAsDisplayField}
                                onCheckedChange={(val) => updateParam('setAsDisplayField', val)}
                                className="border-primary/20 data-[state=checked]:bg-primary"
                            />
                            <Label htmlFor="setDisplayField" className="text-sm font-bold uppercase tracking-widest text-muted-foreground cursor-pointer">Set as Target Title (Display Field)</Label>
                        </div>
                    </div>
                );

            default:
                return (
                    <div className="flex flex-col items-center justify-center py-10 opacity-30 select-none">
                        <Layout className="h-10 w-10 mb-2" />
                        <p className="text-sm font-bold uppercase tracking-widest">Configuration module undefined</p>
                    </div>
                );
        }
    };

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-2xl border-primary/20 bg-card/95 backdrop-blur-xl p-0 overflow-hidden shadow-2xl [&>button]:hidden">
                <DialogHeader className="p-6 pb-2 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-1">
                                <span className="text-2xl">{editedStep.icon}</span>
                                <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">
                                    Configure Operation
                                </DialogTitle>
                            </div>
                            <div className="flex items-center gap-2">
                                <Badge variant="secondary" className="text-xs font-black uppercase tracking-widest bg-primary/10 text-primary border-primary/20">
                                    {editedStep.type}
                                </Badge>
                                <span className="text-muted-foreground/40">•</span>
                                <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest italic">{editedStep.label}</span>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 opacity-40 hover:opacity-100">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                <ScrollArea className="max-h-[60vh] px-6 py-4">
                    <div className="pb-8 px-1">
                        {renderFieldEditor()}
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 pt-2 bg-muted/40 border-t border-border/50 shrink-0 flex flex-row items-center justify-between sm:justify-between">
                    <div className="hidden sm:block">
                        <div className="flex items-center gap-2 opacity-40">
                            <Info className="h-3.5 w-3.5" />
                            <p className="text-xs font-bold uppercase tracking-widest">Settings are serialized to JSON</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="text-sm font-black uppercase tracking-widest px-6 h-10 hover:bg-transparent"
                        >
                            Abort
                        </Button>
                        <Button
                            onClick={handleSave}
                            className="bg-primary hover:bg-primary/90 text-white font-black px-8 shadow-lg shadow-primary/40 text-sm uppercase tracking-widest h-10 gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Commit Changes
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
