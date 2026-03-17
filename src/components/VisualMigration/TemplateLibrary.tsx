import React, { useState, useMemo, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    Search,
    Layers,
    Trash2,
    Eye,
    Play,
    Loader2,
    Filter,
    SortAsc
} from "lucide-react";
import { MigrationTemplate, MigrationStep, MIGRATION_TEMPLATES } from "@/templates/migration-templates";
import { useVisualBuilderTemplates } from '@/hooks/useVisualBuilderTemplates';

interface TemplateLibraryProps {
    onUseTemplate: (template: MigrationTemplate) => void;
    onPreviewCode: (template: MigrationTemplate) => void;
}

export const TemplateLibrary: React.FC<TemplateLibraryProps> = ({
    onUseTemplate,
    onPreviewCode
}) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [sortBy, setSortBy] = useState<'name' | 'category'>('category');

    const { templates: customTemplates, fetchTemplates, deleteTemplate, loading: loadingTemplates } = useVisualBuilderTemplates();

    useEffect(() => {
        fetchTemplates();
    }, [fetchTemplates]);

    // Combine built-in and custom templates
    const allTemplates = useMemo(() => {
        const mappedCustom: MigrationTemplate[] = customTemplates.map(t => ({
            id: t.id,
            name: t.name,
            description: t.description || '',
            category: 'custom',
            icon: '🏗️',
            steps: t.content as MigrationStep[]
        }));
        return [...MIGRATION_TEMPLATES, ...mappedCustom];
    }, [customTemplates]);

    // Filter and sort templates
    const filteredTemplates = useMemo(() => {
        let filtered = allTemplates;

        if (searchQuery) {
            filtered = filtered.filter(t =>
                t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                t.description.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (selectedCategory !== 'all') {
            filtered = filtered.filter(t => t.category === selectedCategory);
        }

        const sorted = [...filtered];
        if (sortBy === 'name') {
            sorted.sort((a, b) => a.name.localeCompare(b.name));
        } else {
            sorted.sort((a, b) => a.category.localeCompare(b.category));
        }

        return sorted;
    }, [allTemplates, searchQuery, selectedCategory, sortBy]);

    // Group by category
    const groupedTemplates = useMemo(() => {
        const groups: Record<string, MigrationTemplate[]> = {};
        filteredTemplates.forEach(template => {
            if (!groups[template.category]) {
                groups[template.category] = [];
            }
            groups[template.category].push(template);
        });
        return groups;
    }, [filteredTemplates]);

    const categories = [
        { value: 'all', label: 'All Templates' },
        { value: 'custom', label: 'My Custom' },
        { value: 'schema', label: 'Schema Ops' },
        { value: 'field', label: 'Field Ops' },
        { value: 'transformation', label: 'Data Transform' },
        { value: 'derive', label: 'Derive Ops' },
        { value: 'cleanup', label: 'Cleanup' }
    ];

    const getCategoryLabel = (category: string) => {
        return categories.find(c => c.value === category)?.label || category;
    };

    const handleDeleteCustom = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (confirm('Are you sure you want to delete this template?')) {
            await deleteTemplate(id);
        }
    };

    return (
        <Card className="h-full flex flex-col bg-card/95 backdrop-blur-xl border-primary/20 shadow-xl overflow-hidden">
            <CardHeader className="p-4 border-b border-border/50 bg-muted/20 shrink-0">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <CardTitle className="text-base font-black uppercase tracking-tight">Template Library</CardTitle>
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Automated migration blueprints</p>
                    </div>
                    {loadingTemplates && (
                        <div className="flex items-center gap-2 text-primary">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            <span className="text-xs font-black uppercase tracking-widest">Syncing...</span>
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground opacity-40" />
                        <Input
                            placeholder="Filter blueprints..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background/50 border-border/50 pl-9 h-10 text-sm"
                        />
                    </div>
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                                <SelectTrigger className="bg-background/50 border-border/50 h-10 text-xs font-black uppercase tracking-widest px-3">
                                    <div className="flex items-center gap-2">
                                        <Filter className="h-4 w-4 opacity-40" />
                                        <SelectValue placeholder="Category" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border/50">
                                    {categories.map(cat => (
                                        <SelectItem key={cat.value} value={cat.value} className="text-[10px] uppercase font-bold tracking-tight">
                                            {cat.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex-1">
                            <Select value={sortBy} onValueChange={(val: 'name' | 'category') => setSortBy(val)}>
                                <SelectTrigger className="bg-background/50 border-border/50 h-8 text-[9px] font-black uppercase tracking-widest px-3">
                                    <div className="flex items-center gap-2">
                                        <SortAsc className="h-3 w-3 opacity-40" />
                                        <SelectValue placeholder="Sort" />
                                    </div>
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border/50">
                                    <SelectItem value="category" className="text-[10px] uppercase font-bold tracking-tight">Category</SelectItem>
                                    <SelectItem value="name" className="text-[10px] uppercase font-bold tracking-tight">Name</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </CardHeader>

            <ScrollArea className="flex-1 p-2">
                <div className="space-y-4 pb-4">
                    {filteredTemplates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 opacity-30 select-none">
                            <Layers className="h-10 w-10 mb-2" />
                            <p className="text-sm font-bold uppercase tracking-widest">No matching blueprints</p>
                        </div>
                    ) : sortBy === 'category' ? (
                        <Accordion type="multiple" defaultValue={Object.keys(groupedTemplates)} className="space-y-2">
                            {Object.entries(groupedTemplates).map(([category, templates]) => (
                                <AccordionItem key={category} value={category} className="border-none bg-muted/10 rounded-xl overflow-hidden px-1">
                                    <AccordionTrigger className="hover:no-underline py-3 px-3 group">
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="text-[10px] font-black uppercase tracking-widest bg-primary/5 text-primary border-primary/20 h-5">
                                                {templates.length}
                                            </Badge>
                                            <span className="text-xs font-black uppercase tracking-widest group-hover:text-primary transition-colors">
                                                {getCategoryLabel(category)}
                                            </span>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="px-2 pb-2 space-y-2">
                                        {templates.map(template => (
                                            <InnerTemplateCard
                                                key={template.id}
                                                template={template}
                                                onUse={() => onUseTemplate(template)}
                                                onPreview={() => onPreviewCode(template)}
                                                onDelete={
                                                    template.category === 'custom'
                                                        ? (e) => handleDeleteCustom(template.id, e)
                                                        : undefined
                                                }
                                            />
                                        ))}
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="space-y-2 px-1">
                            {filteredTemplates.map(template => (
                                <InnerTemplateCard
                                    key={template.id}
                                    template={template}
                                    onUse={() => onUseTemplate(template)}
                                    onPreview={() => onPreviewCode(template)}
                                    onDelete={
                                        template.category === 'custom'
                                            ? (e) => handleDeleteCustom(template.id, e)
                                            : undefined
                                    }
                                />
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </Card>
    );
};

interface InnerTemplateCardProps {
    template: MigrationTemplate;
    onUse: () => void;
    onPreview: () => void;
    onDelete?: (e: React.MouseEvent) => void;
}

const InnerTemplateCard: React.FC<InnerTemplateCardProps> = ({ template, onUse, onPreview, onDelete }) => {
    return (
        <Card className="bg-card border-border/50 hover:border-primary/20 hover:bg-card/80 transition-all duration-300 group">
            <CardContent className="p-3">
                <div className="flex items-start gap-3 mb-3">
                    <div className="h-10 w-10 rounded-lg bg-muted/20 border border-border/50 flex items-center justify-center text-xl shrink-0">
                        {template.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                            <h4 className="text-xs font-black uppercase tracking-tight truncate group-hover:text-primary transition-colors">
                                {template.name}
                            </h4>
                            {onDelete && (
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={onDelete}
                                    className="h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 hover:bg-destructive/10"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            )}
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-tight">
                            {template.description}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        onClick={onUse}
                        className="flex-1 h-8 bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 text-xs font-black uppercase tracking-widest shadow-none"
                    >
                        <Play className="h-4 w-4 mr-1.5 fill-current" />
                        Apply
                    </Button>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onPreview}
                        className="flex-1 h-8 bg-muted/30 hover:bg-muted/50 text-muted-foreground hover:text-foreground text-xs font-black uppercase tracking-widest"
                    >
                        <Eye className="h-4 w-4 mr-1.5" />
                        Code
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};
