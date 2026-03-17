"use client";
import React from 'react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    Plus,
    Shuffle,
    Trash2,
    Settings2,
    FileText,
    Database,
    Rows,
    MoveHorizontal,
    Pencil,
    Star,
    ArrowUpDown
} from "lucide-react";
import { MigrationStep } from '@/templates/migration-templates';

interface OperationSelectorProps {
    onSelectOperation: (operation: Partial<MigrationStep>) => void;
    contentType: string;
}

export const OperationSelector: React.FC<OperationSelectorProps> = ({
    onSelectOperation,
    contentType
}) => {
    const handleSelect = (operation: Partial<MigrationStep>) => {
        onSelectOperation(operation);
    };

    const operations = [
        {
            category: 'Content Type Operations',
            color: 'text-primary',
            items: [
                {
                    type: 'contentType' as const,
                    operation: 'createContentType',
                    label: 'Create Content Type',
                    icon: <FileText className="h-4 w-4" />,
                    defaultParams: { name: '', displayField: 'title' }
                },
                {
                    type: 'contentType' as const,
                    operation: 'deleteContentType',
                    label: 'Delete Content Type',
                    icon: <Trash2 className="h-4 w-4" />,
                    defaultParams: {}
                }
            ]
        },
        {
            category: 'Field Operations',
            color: 'text-amber-500',
            items: [
                {
                    type: 'field' as const,
                    operation: 'createField',
                    label: 'Create Field',
                    icon: <Plus className="h-4 w-4" />,
                    defaultParams: { fieldId: '', fieldType: 'Symbol', required: false }
                },
                {
                    type: 'field' as const,
                    operation: 'deleteField',
                    label: 'Delete Field',
                    icon: <Trash2 className="h-4 w-4" />,
                    defaultParams: { fieldId: '' }
                },
                {
                    type: 'field' as const,
                    operation: 'renameField',
                    label: 'Rename Field',
                    icon: <MoveHorizontal className="h-4 w-4" />,
                    defaultParams: { oldFieldId: '', newFieldId: '' }
                },
                {
                    type: 'field' as const,
                    operation: 'addValidation',
                    label: 'Add Validation',
                    icon: <Settings2 className="h-4 w-4" />,
                    defaultParams: { fieldId: '', validation: 'required' }
                },
                {
                    type: 'field' as const,
                    operation: 'editField',
                    label: 'Edit Field Properties',
                    icon: <Pencil className="h-4 w-4" />,
                    defaultParams: { fieldId: '', name: '', required: false }
                },
                {
                    type: 'field' as const,
                    operation: 'setDisplayField',
                    label: 'Set Display Field',
                    icon: <Star className="h-4 w-4" />,
                    defaultParams: { fieldId: '' }
                },
                {
                    type: 'field' as const,
                    operation: 'moveField',
                    label: 'Move Field Position',
                    icon: <ArrowUpDown className="h-4 w-4" />,
                    defaultParams: { fieldId: '', direction: 'afterField', referenceField: '' }
                }
            ]
        },
        {
            category: 'Data Transformations',
            color: 'text-emerald-500',
            items: [
                {
                    type: 'transformation' as const,
                    operation: 'updateEntry',
                    label: 'Update Entry (by ID)',
                    icon: <Database className="h-4 w-4" />,
                    defaultParams: {
                        contentType: contentType || '',
                        entryId: '',
                        fields: {}
                    }
                },
                {
                    type: 'transformation' as const,
                    operation: 'transformEntries',
                    label: 'Transform Entries (Bulk)',
                    icon: <Rows className="h-4 w-4" />,
                    defaultParams: {
                        contentType: contentType || '',
                        sourceField: '',
                        targetField: '',
                        transform: 'copy'
                    }
                },
                {
                    type: 'transformation' as const,
                    operation: 'deriveLinkedEntries',
                    label: 'Derive Linked Entries',
                    icon: <Shuffle className="h-4 w-4" />,
                    defaultParams: {
                        contentType: contentType || '',
                        derivedContentType: '',
                        sourceFields: []
                    }
                }
            ]
        }
    ];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="default"
                    className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold uppercase tracking-widest text-lg h-14 shadow-lg shadow-primary/20"
                >
                    <Plus className="h-5 w-5 mr-2" />
                    Acquire Operation
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-[360px] bg-card/95 backdrop-blur-xl border-primary/20 p-2 shadow-2xl max-h-[70vh] overflow-y-auto">
                {operations.map((category, catIndex) => (
                    <React.Fragment key={category.category}>
                        {catIndex > 0 && <DropdownMenuSeparator className="bg-border/50 my-2" />}
                        <DropdownMenuLabel className={`text-lg font-black uppercase tracking-tighter ${category.color} opacity-80 px-2 py-1.5`}>
                            {category.category}
                        </DropdownMenuLabel>
                        {category.items.map((item) => (
                            <DropdownMenuItem
                                key={item.operation}
                                onClick={() => handleSelect({
                                    id: Date.now().toString(),
                                    type: item.type,
                                    operation: item.operation,
                                    label: item.label,
                                    icon: getOperationIcon(item.operation),
                                    params: { contentType: contentType || '', ...item.defaultParams }
                                })}
                                className="bg-muted/20 border-border/50 min-h-[44px] flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer hover:bg-primary/5 focus:bg-primary/10 transition-colors group"
                            >
                                <div className={`shrink-0 opacity-40 group-hover:opacity-100 transition-opacity ${category.color}`}>
                                    {item.icon}
                                </div>
                                <span className="text-lg font-bold tracking-tight text-foreground/80 group-hover:text-foreground">
                                    {item.label}
                                </span>
                            </DropdownMenuItem>
                        ))}
                    </React.Fragment>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
};

function getOperationIcon(operation: string): string {
    const icons: Record<string, string> = {
        createContentType: '📋',
        deleteContentType: '🗑️',
        createField: '➕',
        deleteField: '❌',
        renameField: '✏️',
        addValidation: '✅',
        editField: '📝',
        setDisplayField: '⭐',
        moveField: '↕️',
        changeFieldControl: '🎨',
        updateEntry: '📝',
        transformEntries: '🔄',
        deriveLinkedEntries: '🔗'
    };
    return icons[operation] || '📝';
}
