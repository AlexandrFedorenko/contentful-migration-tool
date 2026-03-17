import React from 'react';
import {
    Card,
    CardContent,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Info,
    ArrowRight
} from "lucide-react";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { MigrationTemplate } from '@/templates/migration-templates';
import { cn } from "@/lib/utils";

interface TemplateCardProps {
    template: MigrationTemplate;
    onSelect: (template: MigrationTemplate) => void;
    isCustom?: boolean;
    onDelete?: (id: string) => void;
}

export const TemplateCard: React.FC<TemplateCardProps> = ({
    template,
    onSelect,
    isCustom = false
}) => {
    const getCategoryStyles = (category: string) => {
        switch (category) {
            case 'field': return 'bg-primary/10 text-primary border-primary/20';
            case 'transformation': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
            case 'derive': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'cleanup': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
            default: return 'bg-muted/10 text-muted-foreground border-border/50';
        }
    };

    return (
        <Card
            className="group cursor-pointer bg-card hover:bg-card/90 border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 overflow-hidden relative"
            onClick={() => onSelect(template)}
        >
            <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowRight className="h-4 w-4 text-primary animate-in slide-in-from-left-2" />
            </div>

            <CardContent className="p-5">
                <div className="flex items-start gap-4">
                    <div className="h-12 w-12 rounded-2xl bg-muted/20 border border-border/50 flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform duration-500">
                        {template.icon || '📝'}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-black uppercase tracking-tight truncate text-foreground/90 group-hover:text-foreground">
                                {template.name}
                            </h3>
                            {isCustom && (
                                <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest bg-blue-500/5 text-blue-500 border-blue-500/20 h-4">
                                    Custom
                                </Badge>
                            )}
                        </div>

                        <p className="text-[10px] leading-relaxed text-muted-foreground line-clamp-2 mb-3">
                            {template.description}
                        </p>

                        <div className="flex items-center gap-2">
                            <Badge className={cn("text-[8px] font-black uppercase tracking-widest border px-1.5 h-4", getCategoryStyles(template.category))}>
                                {template.category}
                            </Badge>

                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="h-5 w-5 rounded-full hover:bg-muted/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Info className="h-3 w-3 text-muted-foreground" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent className="text-[9px] font-bold uppercase tracking-widest bg-popover border-border/50">
                                        Manifest Type: {template.category}
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    </div>
                </div>
            </CardContent>

            <div className="h-0.5 w-full bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        </Card>
    );
};
