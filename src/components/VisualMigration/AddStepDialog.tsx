
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
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import {
    Plus,
    Trash2,
    Edit3,
    Shuffle,
    X
} from "lucide-react";
import { MigrationStep } from '@/templates/migration-templates';

interface AddStepDialogProps {
    open: boolean;
    onClose: () => void;
    onAdd: (step: MigrationStep) => void;
    contentType: string;
}

export const AddStepDialog: React.FC<AddStepDialogProps> = ({
    open,
    onClose,
    onAdd,
    contentType
}) => {
    const [stepType, setStepType] = useState<string>('createField');
    const [fieldId, setFieldId] = useState('');
    const [fieldType, setFieldType] = useState('Symbol');
    const [newFieldId, setNewFieldId] = useState('');

    const handleAdd = () => {
        let step: MigrationStep;

        switch (stepType) {
            case 'createField':
                step = {
                    id: Date.now().toString(),
                    type: 'field',
                    operation: 'createField',
                    label: `Create field "${fieldId}"`,
                    icon: '➕',
                    params: {
                        fieldId,
                        fieldType,
                        required: false
                    }
                };
                break;
            case 'deleteField':
                step = {
                    id: Date.now().toString(),
                    type: 'field',
                    operation: 'deleteField',
                    label: `Delete field "${fieldId}"`,
                    icon: '🗑️',
                    params: { fieldId }
                };
                break;
            case 'renameField':
                step = {
                    id: Date.now().toString(),
                    type: 'field',
                    operation: 'renameField',
                    label: `Rename "${fieldId}" → "${newFieldId}"`,
                    icon: '✏️',
                    params: { oldFieldId: fieldId, newFieldId }
                };
                break;
            case 'transformEntries':
                step = {
                    id: Date.now().toString(),
                    type: 'transformation',
                    operation: 'transformEntries',
                    label: `Transform entries in "${contentType}"`,
                    icon: '🔄',
                    params: {
                        contentType,
                        sourceField: fieldId,
                        targetField: newFieldId || fieldId
                    }
                };
                break;
            default:
                return;
        }

        onAdd(step);
        onClose();
        // Reset form
        setFieldId('');
        setNewFieldId('');
    };

    const tabs = [
        { label: 'Create Field', value: 'createField', icon: <Plus className="h-3.5 w-3.5" /> },
        { label: 'Delete Field', value: 'deleteField', icon: <Trash2 className="h-3.5 w-3.5" /> },
        { label: 'Rename Field', value: 'renameField', icon: <Edit3 className="h-3.5 w-3.5" /> },
        { label: 'Transform', value: 'transformEntries', icon: <Shuffle className="h-3.5 w-3.5" /> }
    ];

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
            <DialogContent className="sm:max-w-xl bg-card/95 backdrop-blur-xl border-primary/20 p-0 overflow-hidden shadow-2xl">
                <DialogHeader className="p-6 pb-2">
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-black uppercase tracking-tight text-foreground">
                            Injection Protocol
                        </DialogTitle>
                        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 opacity-40 hover:opacity-100">
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mt-1">Add new step to migration sequence</p>
                </DialogHeader>

                <Tabs value={stepType} onValueChange={setStepType} className="w-full">
                    <div className="px-6 border-b border-border/50">
                        <TabsList className="bg-transparent h-12 w-full justify-start gap-4 p-0">
                            {tabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.value}
                                    value={tab.value}
                                    className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-12 bg-transparent text-[10px] font-black uppercase tracking-widest px-1 transition-all"
                                >
                                    <span className="flex items-center gap-2">
                                        {tab.icon}
                                        {tab.label}
                                    </span>
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    <div className="p-6 py-8 min-h-[220px]">
                        <TabsContent value="createField" className="mt-0 space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">Field ID</Label>
                                <Input
                                    value={fieldId}
                                    onChange={(e) => setFieldId(e.target.value)}
                                    placeholder="e.g., slug, author, publishDate"
                                    className="bg-muted/20 border-border/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">Field Type</Label>
                                <Select value={fieldType} onValueChange={setFieldType}>
                                    <SelectTrigger className="bg-muted/20 border-border/50 h-11">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-card border-border/50">
                                        <SelectItem value="Symbol">Text (Short)</SelectItem>
                                        <SelectItem value="Text">Text (Long)</SelectItem>
                                        <SelectItem value="Integer">Number (Integer)</SelectItem>
                                        <SelectItem value="Number">Number (Decimal)</SelectItem>
                                        <SelectItem value="Date">Date</SelectItem>
                                        <SelectItem value="Boolean">Boolean</SelectItem>
                                        <SelectItem value="Link">Reference</SelectItem>
                                        <SelectItem value="Array">Array</SelectItem>
                                        <SelectItem value="RichText">Rich Text</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </TabsContent>

                        <TabsContent value="deleteField" className="mt-0 space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">Field ID to Delete</Label>
                                <Input
                                    value={fieldId}
                                    onChange={(e) => setFieldId(e.target.value)}
                                    placeholder="e.g., oldField, deprecatedField"
                                    className="bg-muted/20 border-border/50 border-destructive/20 focus-visible:ring-destructive"
                                />
                            </div>
                            <p className="text-[9px] font-medium text-destructive/60 italic px-1 flex items-center gap-2">
                                <Trash2 className="h-3 w-3" />
                                Warning: This operation is destructive and cannot be undone.
                            </p>
                        </TabsContent>

                        <TabsContent value="renameField" className="mt-0 space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">Current Field ID</Label>
                                <Input
                                    value={fieldId}
                                    onChange={(e) => setFieldId(e.target.value)}
                                    placeholder="e.g., oldName"
                                    className="bg-muted/20 border-border/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">New Field ID</Label>
                                <Input
                                    value={newFieldId}
                                    onChange={(e) => setNewFieldId(e.target.value)}
                                    placeholder="e.g., newName"
                                    className="bg-muted/20 border-border/50 border-primary/20"
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="transformEntries" className="mt-0 space-y-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
                            <div className="space-y-2">
                                <Label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">Source Field</Label>
                                <Input
                                    value={fieldId}
                                    onChange={(e) => setFieldId(e.target.value)}
                                    placeholder="e.g., title"
                                    className="bg-muted/20 border-border/50"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground px-1">Target Field</Label>
                                <Input
                                    value={newFieldId}
                                    onChange={(e) => setNewFieldId(e.target.value)}
                                    placeholder="e.g., slug (leave empty to use source field)"
                                    className="bg-muted/20 border-border/50"
                                />
                            </div>
                            <p className="text-[9px] font-medium text-muted-foreground/60 italic px-1">
                                This will apply a transformation template to the selected fields.
                            </p>
                        </TabsContent>
                    </div>
                </Tabs>

                <DialogFooter className="p-6 bg-muted/40 border-t border-border/50 flex items-center justify-between sm:justify-between">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-[10px] font-black uppercase tracking-widest h-10"
                    >
                        Abort
                    </Button>
                    <Button
                        onClick={handleAdd}
                        disabled={!fieldId}
                        className="bg-primary hover:bg-primary/90 text-white font-black px-8 shadow-lg shadow-primary/40 text-[10px] uppercase tracking-widest h-10 gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Inject Step
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
