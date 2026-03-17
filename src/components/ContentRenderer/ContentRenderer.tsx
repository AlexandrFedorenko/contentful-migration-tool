import React from 'react';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface ContentfulFile {
    url: string;
    fileName: string;
    contentType: string;
}

export interface ContentfulAsset {
    sys: {
        id: string;
    };
    fields?: {
        file?: Record<string, ContentfulFile>;
    };
}

export interface ContentfulEntry {
    sys: {
        id: string;
        type?: string;
        linkType?: string;
    };
    fields: Record<string, unknown>;
}

export interface RichTextNode {
    nodeType: string;
    data?: {
        target?: {
            sys?: {
                id?: string;
                type?: string;
                linkType?: string;
            };
        };
    };
    content?: RichTextNode[];
    value?: string;
    marks?: Array<{ type: string }>;
}

// Helper to get title from an entry
export const getEntryTitle = (entry: ContentfulEntry) => {
    if (!entry || !entry.fields) return entry?.sys?.id || 'Unknown';
    const fields = entry.fields;

    // 1. Try specific title fields
    const titleField = Object.keys(fields).find(key => {
        const k = key.toLowerCase();
        return k.includes('title') || k.includes('name') || k.includes('label') || k.includes('headline') || k.includes('slug') || k.includes('header');
    });

    if (titleField) {
        const val = fields[titleField];
        if (typeof val === 'object' && val !== null) {
            return Object.values(val)[0] as string;
        }
        return String(val);
    }

    // 2. Fallback: Try FIRST string field
    const firstStringField = Object.values(fields).find(val => {
        if (typeof val === 'string') return true;
        if (typeof val === 'object' && val !== null) {
            const firstVal = Object.values(val)[0];
            return typeof firstVal === 'string';
        }
        return false;
    });

    if (firstStringField) {
        if (typeof firstStringField === 'string') return firstStringField;
        if (typeof firstStringField === 'object' && firstStringField !== null) {
            return Object.values(firstStringField)[0] as string;
        }
    }

    return entry.sys.id;
};

export const RichTextRenderer = ({ node, assets, entries }: { node: RichTextNode, assets?: ContentfulAsset[], entries?: ContentfulEntry[] }) => {
    if (node.nodeType === 'text') {
        return (
            <span className={cn(
                node.marks?.some((m) => m.type === 'bold') && "font-black underline decoration-primary/30",
                node.marks?.some((m) => m.type === 'italic') && "italic",
                node.marks?.some((m) => m.type === 'underline') && "underline underline-offset-4 decoration-primary/50"
            )}>
                {node.value}
            </span>
        );
    }

    if (node.nodeType === 'paragraph') {
        return (
            <p className="text-sm font-medium leading-relaxed text-foreground/80 mb-4">
                {node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}
            </p>
        );
    }

    if (node.nodeType === 'heading-1') return <h1 className="text-3xl font-black uppercase tracking-tight text-foreground mb-6 border-l-4 border-primary pl-4">{node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}</h1>;
    if (node.nodeType === 'heading-2') return <h2 className="text-2xl font-black uppercase tracking-tight text-foreground/90 mb-4 border-l-4 border-primary/50 pl-4">{node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}</h2>;
    if (node.nodeType === 'heading-3') return <h3 className="text-xl font-black uppercase tracking-tight text-foreground/80 mb-4">{node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}</h3>;

    if (node.nodeType === 'embedded-asset-block') {
        const assetId = node.data?.target?.sys?.id;
        const asset = assets?.find(a => a.sys.id === assetId);
        if (asset) {
            const fileData = Object.values(asset.fields?.file || {})[0] as ContentfulFile;
            if (fileData?.url && fileData.contentType?.startsWith('image/')) {
                return (
                    <div className="my-6 relative w-full h-[300px] rounded-2xl overflow-hidden border border-border/50 bg-muted/20 group">
                        <Image
                            src={fileData.url.startsWith('//') ? `https:${fileData.url}` : fileData.url}
                            alt={fileData.fileName}
                            fill
                            className="object-contain transition-transform duration-500 group-hover:scale-105"
                        />
                        <div className="absolute bottom-2 right-2 px-2 py-1 rounded bg-muted/60 text-[8px] font-black uppercase tracking-widest text-muted-foreground">
                            {fileData.fileName}
                        </div>
                    </div>
                );
            }
        }
        return <Badge variant="outline" className="my-2 text-[9px] font-black uppercase tracking-widest border-border/50 bg-muted/20">Asset: {assetId}</Badge>;
    }

    if (node.nodeType === 'embedded-entry-block' || node.nodeType === 'embedded-entry-inline') {
        const entryId = node.data?.target?.sys?.id;
        const entry = entries?.find(e => e.sys.id === entryId);
        const title = entry ? getEntryTitle(entry) : entryId;
        const label = title === entryId ? `ID: ${entryId}` : `${title} (ID: ${entryId})`;
        return <Badge variant="secondary" className="my-1 mr-1 text-[9px] font-black uppercase tracking-widest bg-primary/10 text-primary border-primary/20">{label}</Badge>;
    }

    if (node.nodeType === 'unordered-list') {
        return <ul className="space-y-2 mb-4 list-none pl-4 border-l border-border/50">{node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}</ul>;
    }
    if (node.nodeType === 'ordered-list') {
        return <ol className="space-y-2 mb-4 list-decimal pl-6 text-foreground/80">{node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}</ol>;
    }
    if (node.nodeType === 'list-item') {
        return <li className="text-sm font-medium">{node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}</li>;
    }

    // Fallback for other nodes
    return (
        <div className="pl-4 border-l border-border/50 opacity-80">
            {node.content?.map((child, i) => <RichTextRenderer key={i} node={child} assets={assets} entries={entries} />)}
        </div>
    );
};

export const FieldRenderer = ({ value, assets, entries }: { value: unknown, assets?: ContentfulAsset[], entries?: ContentfulEntry[] }) => {
    if (!value || typeof value !== 'object') return null;

    return (
        <div className="space-y-4">
            {Object.entries(value as Record<string, unknown>).map(([locale, content]: [string, unknown]) => {
                // Handle Asset Link
                const item = content as { sys?: { type?: string; linkType?: string; id?: string }; nodeType?: string;[key: string]: unknown };
                if (item?.sys?.type === 'Link' && item?.sys?.linkType === 'Asset') {
                    const asset = assets?.find(a => a.sys.id === item.sys?.id);
                    if (asset) {
                        const fileData = asset.fields?.file?.[locale] || Object.values(asset.fields?.file || {})[0];
                        if (fileData?.url) {
                            const isImage = fileData.contentType?.startsWith('image/');
                            return (
                                <div key={locale} className="space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="h-1 w-1 rounded-full bg-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{locale}</span>
                                    </div>
                                    {isImage ? (
                                        <div className="relative w-full h-[200px] rounded-xl overflow-hidden border border-border/50 bg-muted/20">
                                            <Image
                                                src={fileData.url.startsWith('//') ? `https:${fileData.url}` : fileData.url}
                                                alt={fileData.fileName}
                                                fill
                                                className="object-contain transition-all hover:scale-105"
                                            />
                                        </div>
                                    ) : (
                                        <p className="text-xs font-mono text-foreground/70 bg-muted/20 p-2 rounded-lg border border-border/50">
                                            File: {fileData.fileName} <span className="text-primary/60 text-[10px] uppercase ml-2">({fileData.contentType})</span>
                                        </p>
                                    )}
                                </div>
                            );
                        }
                    }
                    return (
                        <div key={locale} className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{locale}</span>
                            <div className="p-2 rounded-lg bg-rose-500/5 border border-rose-500/20 text-[10px] font-black uppercase tracking-widest text-rose-500/80">
                                Asset Orphaned (ID: {item.sys?.id})
                            </div>
                        </div>
                    );
                }

                // Handle Entry Link
                if (item?.sys?.type === 'Link' && item?.sys?.linkType === 'Entry') {
                    const entry = entries?.find(e => e.sys.id === item.sys?.id);
                    const title = entry ? getEntryTitle(entry) : item.sys?.id;
                    const id = item.sys?.id || 'Unknown';
                    const label = title === id ? `ID: ${id}` : `${title} (ID: ${id})`;
                    return (
                        <div key={locale} className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{locale}</span>
                            <div>
                                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-muted/20 border-border/50 hover:border-primary/30 transition-colors">
                                    {label}
                                </Badge>
                            </div>
                        </div>
                    );
                }

                // Handle Rich Text
                if (item?.nodeType === 'document') {
                    return (
                        <div key={locale} className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{locale}</span>
                            <Card className="p-6 bg-muted/20 border-border/50 shadow-inner">
                                <RichTextRenderer node={item as RichTextNode} assets={assets} entries={entries} />
                            </Card>
                        </div>
                    );
                }

                // Handle Array of Links (e.g. Gallery)
                if (Array.isArray(content)) {
                    return (
                        <div key={locale} className="space-y-2">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{locale}</span>
                            <div className="flex flex-wrap gap-2">
                                {content.map((arrayItem: unknown, idx: number) => {
                                    const item = arrayItem as { sys?: { type?: string; linkType?: string; id?: string }; nodeType?: string };

                                    // Handle Asset Link in Array
                                    if (item?.sys?.type === 'Link' && item?.sys?.linkType === 'Asset') {
                                        const asset = assets?.find(a => a.sys.id === item.sys?.id);
                                        const fileData = (asset?.fields?.file?.[locale] || Object.values(asset?.fields?.file || {})[0]) as ContentfulFile | undefined;
                                        if (fileData?.url) {
                                            const isImage = fileData.contentType?.startsWith('image/');
                                            if (isImage) {
                                                return (
                                                    <div key={idx} className="relative w-24 h-24 rounded-lg overflow-hidden border border-border/50 bg-muted/20 group">
                                                        <Image
                                                            src={fileData.url.startsWith('//') ? `https:${fileData.url}` : fileData.url}
                                                            alt={fileData.fileName}
                                                            fill
                                                            className="object-cover transition-transform group-hover:scale-110"
                                                        />
                                                    </div>
                                                );
                                            }
                                        }
                                    }

                                    // Handle Entry Link in Array
                                    if (item?.sys?.type === 'Link' && item?.sys?.linkType === 'Entry') {
                                        const entry = entries?.find(e => e.sys.id === item.sys?.id);
                                        const title = entry ? getEntryTitle(entry) : item.sys?.id;
                                        const id = item.sys?.id || 'Unknown';
                                        const label = title === id ? `ID: ${id}` : `${title} (ID: ${id})`;
                                        return (
                                            <Badge key={idx} variant="outline" className="text-[9px] font-black uppercase tracking-widest bg-muted/20 border-border/50">
                                                {label}
                                            </Badge>
                                        );
                                    }

                                    return null;
                                })}
                            </div>
                        </div>
                    );
                }

                // Handle Text/Primitives/Objects
                let displayValue = String(content);
                let isObject = false;
                if (typeof content === 'object' && content !== null) {
                    displayValue = JSON.stringify(content, null, 2);
                    isObject = true;
                }

                return (
                    <div key={locale} className="space-y-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{locale}</span>
                        {isObject ? (
                            <pre className="m-0 text-[10px] font-mono p-4 rounded-xl bg-muted/40 border border-border/50 text-emerald-400 overflow-auto max-h-[300px] shadow-inner">
                                {displayValue}
                            </pre>
                        ) : (
                            <div className="text-sm font-medium text-foreground/80 bg-muted/20 p-4 rounded-xl border border-border/50 whitespace-pre-wrap leading-relaxed">
                                {displayValue}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};
