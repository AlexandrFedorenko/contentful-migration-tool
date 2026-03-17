import React, { useState } from 'react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from "@/components/ui/tabs";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
    ScrollArea
} from "@/components/ui/scroll-area";
import {
    Code2,
    FileText,
    AlertCircle,
    CheckCircle2,
    History
} from "lucide-react";
import { FieldRenderer, ContentfulEntry, ContentfulAsset } from '@/components/ContentRenderer/ContentRenderer';
import { cn } from "@/lib/utils";

interface DiffViewerProps {
    oldValue: Record<string, unknown> | undefined;
    newValue: Record<string, unknown> | undefined;
    sourceAssets?: ContentfulAsset[];
    targetAssets?: ContentfulAsset[];
    sourceEntries?: ContentfulEntry[];
    targetEntries?: ContentfulEntry[];
}

const FieldDiffRenderer = ({
    label,
    oldVal,
    newVal,
    sourceAssets,
    targetAssets,
    sourceEntries,
    targetEntries
}: {
    label: string,
    oldVal: unknown,
    newVal: unknown,
    sourceAssets?: ContentfulAsset[],
    targetAssets?: ContentfulAsset[],
    sourceEntries?: ContentfulEntry[],
    targetEntries?: ContentfulEntry[]
}) => {
    const isModified = oldVal !== undefined && newVal !== undefined && JSON.stringify(oldVal) !== JSON.stringify(newVal);
    const isAdded = oldVal === undefined && newVal !== undefined;
    const isDeleted = oldVal !== undefined && newVal === undefined;

    if (!isModified && !isAdded && !isDeleted) return null;

    return (
        <div className="mb-8 last:mb-0">
            <div className="flex items-center gap-3 mb-3 px-1">
                <div className="h-2 w-2 rounded-full bg-primary/40 shrink-0" />
                <span className="text-xs font-black uppercase tracking-widest text-foreground/80">{label}</span>
                {isModified && (
                    <Badge variant="outline" className="bg-amber-500/5 text-amber-500 border-amber-500/20 text-[8px] font-black uppercase tracking-widest h-4">
                        Modified
                    </Badge>
                )}
                {isAdded && (
                    <Badge variant="outline" className="bg-emerald-500/5 text-emerald-500 border-emerald-500/20 text-[8px] font-black uppercase tracking-widest h-4">
                        Added
                    </Badge>
                )}
                {isDeleted && (
                    <Badge variant="outline" className="bg-rose-500/5 text-rose-500 border-rose-500/20 text-[8px] font-black uppercase tracking-widest h-4">
                        Deleted
                    </Badge>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(isModified || isDeleted) && (
                    <div className={cn(
                        "rounded-xl border p-4 bg-card/30 backdrop-blur-sm transition-all duration-300",
                        isDeleted ? "border-rose-500/30 bg-rose-500/5" : "border-amber-500/20"
                    )}>
                        <div className="flex items-center gap-2 mb-3">
                            <History className="h-3 w-3 text-muted-foreground opacity-50" />
                            <span className="text-[9px] font-black uppercase tracking-tighter text-muted-foreground">Original Manifest (Target)</span>
                        </div>
                        <div className="opacity-70 grayscale-[0.5]">
                            <FieldRenderer value={oldVal} assets={targetAssets} entries={targetEntries} />
                        </div>
                    </div>
                )}
                {(isModified || isAdded) && (
                    <div className={cn(
                        "rounded-xl border p-4 bg-card/30 backdrop-blur-sm transition-all duration-300",
                        isAdded ? "border-emerald-500/30 bg-emerald-500/5" : "border-emerald-500/20"
                    )}>
                        <div className="flex items-center gap-2 mb-3">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500/60" />
                            <span className="text-[9px] font-black uppercase tracking-tighter text-emerald-500/60">Updated Payload (Source)</span>
                        </div>
                        <FieldRenderer value={newVal} assets={sourceAssets} entries={sourceEntries} />
                    </div>
                )}
            </div>
        </div>
    );
};

const RawJsonDiff = ({ oldValue, newValue }: { oldValue: unknown, newValue: unknown }) => {
    return (
        <div className="space-y-4">
            <Accordion type="multiple" defaultValue={['new', 'old']} className="space-y-3">
                <AccordionItem value="new" className="border-emerald-500/20 bg-emerald-500/5 rounded-xl px-4 overflow-hidden">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Source Entry (Proposed)</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <pre className="p-4 rounded-lg bg-muted/40 font-mono text-[11px] leading-relaxed overflow-auto max-h-[400px] border border-border/50">
                            {JSON.stringify(newValue, null, 2)}
                        </pre>
                    </AccordionContent>
                </AccordionItem>

                <AccordionItem value="old" className="border-rose-500/20 bg-rose-500/5 rounded-xl px-4 overflow-hidden">
                    <AccordionTrigger className="hover:no-underline py-4">
                        <div className="flex items-center gap-3">
                            <History className="h-4 w-4 text-rose-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-rose-500">Target Entry (Current)</span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent>
                        <pre className="p-4 rounded-lg bg-muted/40 font-mono text-[11px] leading-relaxed overflow-auto max-h-[400px] border border-border/50">
                            {JSON.stringify(oldValue, null, 2)}
                        </pre>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    );
};

export default function DiffViewer({
    oldValue,
    newValue,
    sourceAssets,
    targetAssets,
    sourceEntries,
    targetEntries
}: DiffViewerProps) {
    const [tabValue, setTabValue] = useState('fields');

    const allKeys = Array.from(new Set([
        ...Object.keys(oldValue || {}),
        ...Object.keys(newValue || {})
    ]));

    return (
        <Card className="flex-1 flex flex-col bg-card/95 backdrop-blur-xl border-primary/20 shadow-2xl overflow-hidden min-h-[500px]">
            <Tabs value={tabValue} onValueChange={setTabValue} className="flex-1 flex flex-col">
                <div className="bg-muted/20 border-b border-border/50 px-2">
                    <TabsList className="bg-transparent h-14 w-full justify-start gap-6 p-0">
                        <TabsTrigger
                            value="fields"
                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 bg-transparent text-[10px] font-black uppercase tracking-widest px-2 transition-all gap-2"
                        >
                            <FileText className="h-3.5 w-3.5" />
                            Attribute Delta
                        </TabsTrigger>
                        <TabsTrigger
                            value="json"
                            className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none h-14 bg-transparent text-[10px] font-black uppercase tracking-widest px-2 transition-all gap-2"
                        >
                            <Code2 className="h-3.5 w-3.5" />
                            Raw Manifest
                        </TabsTrigger>
                    </TabsList>
                </div>

                <div className="flex-1 overflow-hidden relative">
                    <ScrollArea className="h-full">
                        <div className="p-6">
                            <TabsContent value="fields" className="mt-0 outline-none">
                                {allKeys.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-20 opacity-30 select-none">
                                        <AlertCircle className="h-10 w-10 mb-2" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest">No structural variances detected</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {allKeys.map(key => (
                                            <FieldDiffRenderer
                                                key={key}
                                                label={key}
                                                oldVal={(oldValue as Record<string, unknown>)?.[key]}
                                                newVal={(newValue as Record<string, unknown>)?.[key]}
                                                sourceAssets={sourceAssets}
                                                targetAssets={targetAssets}
                                                sourceEntries={sourceEntries}
                                                targetEntries={targetEntries}
                                            />
                                        ))}
                                    </div>
                                )}
                            </TabsContent>

                            <TabsContent value="json" className="mt-0 outline-none">
                                <RawJsonDiff oldValue={oldValue} newValue={newValue} />
                            </TabsContent>
                        </div>
                    </ScrollArea>
                </div>
            </Tabs>
        </Card>
    );
}
