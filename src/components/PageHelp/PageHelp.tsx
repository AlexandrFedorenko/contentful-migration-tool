import React from 'react';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { HelpCircle, ExternalLink } from 'lucide-react';
import Link from 'next/link';

import { TAB_SLUGS, TabIndex } from '@/hooks/useDocumentationTabs';

interface PageHelpProps {
    description: string;
    docTab: number; // Index of the tab in Documentation page
}

export const PageHelp: React.FC<PageHelpProps> = ({ description, docTab }) => {
    const slug = TAB_SLUGS[docTab as TabIndex] || docTab;

    return (
        <div className="flex items-center ml-2">
            <TooltipProvider>
                <div className="flex items-center gap-1.5">
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <div className="flex items-center text-muted-foreground hover:text-primary transition-colors cursor-help">
                                <HelpCircle className="h-4 w-4" />
                            </div>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="max-w-[300px] bg-card/95 backdrop-blur-md border-border/50 p-3 shadow-xl">
                            <p className="text-xs leading-relaxed font-medium">
                                {description}
                            </p>
                        </TooltipContent>
                    </Tooltip>

                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Link
                                href={`/doc?tab=${slug}`}
                                passHref
                                target="_blank"
                                className="flex items-center text-primary/60 hover:text-primary transition-colors"
                            >
                                <ExternalLink className="h-3.5 w-3.5" />
                            </Link>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="bg-muted/40 p-6 pr-14 border-b border-border/50 font-bold text-[10px] uppercase tracking-widest px-3 py-1.5">
                            Full Docs
                        </TooltipContent>
                    </Tooltip>
                </div>
            </TooltipProvider>
        </div>
    );
};
