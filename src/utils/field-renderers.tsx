import React from 'react';
import Image from 'next/image';
import {
    Layers, FileText, ImageIcon,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

/* eslint-disable @typescript-eslint/no-explicit-any */

type ResolvedAssets = Record<string, { url: string; title: string; isImage?: boolean }>;
type ResolvedEntries = Record<string, { title: string; contentType?: string }>;

export function renderSingleVal(
    firstVal: unknown,
    resolvedAssets?: ResolvedAssets,
    resolvedEntries?: ResolvedEntries
): React.ReactNode {
    if (firstVal === undefined || firstVal === null) return <span className="text-muted-foreground italic">[Empty]</span>;

    if (Array.isArray(firstVal)) {
        if (firstVal.length === 0) return <span className="truncate text-muted-foreground italic">[Empty]</span>;

        const firstItem = firstVal[0];
        if (typeof firstItem === 'object' && (firstItem as any)?.sys?.type === 'Link') {
            const linkType = (firstItem as any).sys?.linkType;

            if (linkType === 'Asset') {
                return (
                    <div className="flex gap-2 flex-wrap mt-1">
                        {firstVal.map((item: any, i) => {
                            const id = item?.sys?.id;
                            const resolved = id ? resolvedAssets?.[id] : null;
                            if (resolved?.isImage) {
                                return (
                                    <div key={i} className="relative group rounded-lg overflow-hidden border border-white/10 bg-black/40 h-16 w-16 shrink-0 inline-flex items-center justify-center">
                                        <Image src={resolved.url} alt={resolved.title} fill className="object-contain" unoptimized />
                                    </div>
                                );
                            } else if (resolved) {
                                return (
                                    <Badge key={i} variant="outline" className="h-6 px-2 bg-blue-500/10 border-blue-500/20 text-blue-400">
                                        <FileText className="h-3 w-3 mr-1 shrink-0" />
                                        <span className="truncate max-w-[100px]">{resolved.title}</span>
                                    </Badge>
                                );
                            }
                            return <Badge key={i} variant="outline" className="h-6 px-1.5 bg-primary/5">Asset</Badge>;
                        })}
                    </div>
                );
            } else if (linkType === 'Entry') {
                return (
                    <div className="flex gap-1.5 flex-wrap mt-1">
                        {firstVal.map((item: any, i) => {
                            const id = item?.sys?.id;
                            const resolved = id ? resolvedEntries?.[id] : null;
                            return (
                                <Badge key={i} variant="outline" className="h-6 px-2 bg-indigo-500/10 border-indigo-500/20 text-indigo-300">
                                    <Layers className="h-3 w-3 mr-1 shrink-0" />
                                    <span className="truncate max-w-[150px]">{resolved?.title || `Ref: ${id?.substring(0, 6)}`}</span>
                                </Badge>
                            );
                        })}
                    </div>
                );
            }

            return (
                <Badge variant="outline" className="h-5 px-1.5 text-base bg-primary/10">
                    {firstVal.length} {linkType}{firstVal.length > 1 ? 's' : ''}
                </Badge>
            );
        }

        return <span className="truncate">{firstVal.join(', ')}</span>;
    }

    if (typeof firstVal === 'object' && firstVal !== null) {
        const linkObj = firstVal as { sys?: { type: string, linkType: string, id: string } };
        if (linkObj.sys?.type === 'Link') {
            if (linkObj.sys.linkType === 'Asset') {
                const id = linkObj.sys.id;
                const resolved = resolvedAssets?.[id];
                if (resolved) {
                    if (resolved.isImage) {
                        return (
                            <div className="flex flex-col gap-2 mt-2 mb-2 w-full">
                                <Image src={resolved.url} alt={resolved.title} width={400} height={128} className="h-32 w-auto max-w-md object-contain rounded-lg bg-black/50 border border-white/10" unoptimized />
                                {resolved.title !== 'Asset' && <span className="truncate text-base text-foreground/50 px-1">{resolved.title}</span>}
                            </div>
                        );
                    }
                    return (
                        <div className="flex items-center gap-1.5 text-base text-blue-400 mt-1">
                            <FileText className="h-4 w-4 shrink-0" />
                            <span className="truncate font-medium">{resolved.title}</span>
                        </div>
                    );
                }
                return (
                    <div className="flex items-center gap-1 text-base text-blue-400 mt-1">
                        <ImageIcon className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">Image / File (Asset)</span>
                    </div>
                );
            } else if (linkObj.sys.linkType === 'Entry') {
                const id = linkObj.sys.id;
                const resolved = resolvedEntries?.[id];
                return (
                    <Badge variant="outline" className="h-6 px-2 mt-1 bg-indigo-500/10 border-indigo-500/20 text-indigo-300 inline-flex items-center">
                        <Layers className="h-3 w-3 mr-1 shrink-0" />
                        <span className="truncate max-w-[200px]">{resolved?.title || `Ref: ${id.substring(0, 6)}`}</span>
                    </Badge>
                );
            }
            return <Badge variant="outline" className="h-5 px-1.5 text-base bg-primary/10">Ref: {linkObj.sys.id.substring(0, 6)}</Badge>;
        }

        const rtObj = firstVal as { nodeType?: string, content?: any[] };
        if (rtObj.nodeType === 'document' && Array.isArray(rtObj.content)) {
            let extractedText = '';
            let embeddedAssets = 0;
            let embeddedEntries = 0;

            const extractRichText = (nodes: any[]) => {
                for (const node of nodes) {
                    if (node.nodeType === 'text' && node.value) extractedText += node.value + ' ';
                    else if (node.nodeType?.includes('embedded-asset')) embeddedAssets++;
                    else if (node.nodeType?.includes('embedded-entry') || node.nodeType?.includes('entry-hyperlink')) embeddedEntries++;
                    if (node.content && Array.isArray(node.content)) extractRichText(node.content);
                }
            };
            extractRichText(rtObj.content);
            extractedText = extractedText.trim();

            return (
                <div className="flex flex-col gap-2">
                    {extractedText ? (
                        <div className="flex items-start gap-2 pt-1">
                            <FileText className="h-3.5 w-3.5 flex-shrink-0 text-muted-foreground mt-0.5" />
                            <span className="line-clamp-2 max-w-[500px] text-base leading-relaxed text-foreground/90">{extractedText}</span>
                        </div>
                    ) : (
                        <span className="truncate text-muted-foreground italic pt-1">[Rich Text]</span>
                    )}
                    {(embeddedAssets > 0 || embeddedEntries > 0) && (
                        <div className="flex gap-2">
                            {embeddedAssets > 0 && (
                                <Badge variant="secondary" className="bg-black/40 text-base text-blue-300 border-white/5 h-5">
                                    + {embeddedAssets} Asset{embeddedAssets > 1 ? 's' : ''}
                                </Badge>
                            )}
                            {embeddedEntries > 0 && (
                                <Badge variant="secondary" className="bg-black/40 text-base text-indigo-300 border-white/5 h-5">
                                    + {embeddedEntries} Ref{embeddedEntries > 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            );
        }
    }

    if (typeof firstVal === 'string' || typeof firstVal === 'number' || typeof firstVal === 'boolean') {
        return <span className="truncate">{String(firstVal)}</span>;
    }

    return <span className="truncate text-muted-foreground italic">[Complex Object]</span>;
}

export function renderSampleFieldVal(
    val: unknown,
    resolvedAssets?: ResolvedAssets,
    resolvedEntries?: ResolvedEntries,
    selectedLocales?: Set<string>,
    localeMapping?: Record<string, string>,
    defaultLocale: string = 'en-US'
): React.ReactNode {
    if (val === undefined || val === null) return <span className="text-muted-foreground italic">[Empty]</span>;
    if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
        return <span className="truncate">{String(val)}</span>;
    }

    if (typeof val === 'object' && !Array.isArray(val)) {
        const localizedObj = val as Record<string, any>;
        let keys = Object.keys(localizedObj);

        if (selectedLocales && selectedLocales.size > 0) {
            keys = keys.filter(k => selectedLocales.has(k));
        }

        keys.sort((a, b) => {
            if (a === defaultLocale) return -1;
            if (b === defaultLocale) return 1;
            return a.localeCompare(b);
        });

        if (keys.length === 0) return null;

        return (
            <div className="flex flex-col gap-3">
                {keys.map(localeKey => {
                    const mappedLocaleKey = localeMapping?.[localeKey] || localeKey;
                    const localeVal = localizedObj[localeKey];
                    return (
                        <div key={localeKey} className="flex flex-col gap-1.5 border-l-2 border-primary/20 pl-3 py-1">
                            <div className="flex items-center gap-2">
                                <span className="text-base font-mono font-bold uppercase tracking-wider text-muted-foreground bg-black/30 px-1.5 py-0.5 rounded">
                                    {localeKey}
                                </span>
                                {mappedLocaleKey !== localeKey && (
                                    <span className="text-base text-primary/70 font-mono tracking-tighter">
                                        → {mappedLocaleKey}
                                    </span>
                                )}
                            </div>
                            <div className="text-foreground/90 font-medium">
                                {renderSingleVal(localeVal, resolvedAssets, resolvedEntries)}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    }

    return <span className="truncate text-muted-foreground italic">[Unknown Format]</span>;
}

export function getSystemStatus(sys?: { version: number; publishedVersion?: number }) {
    if (!sys) return null;
    if (!sys.publishedVersion) {
        return <Badge variant="outline" className="h-5 px-2 text-base border-amber-500/30 text-amber-500/90 whitespace-nowrap">Draft</Badge>;
    }
    if (sys.version > sys.publishedVersion + 1) {
        return <Badge variant="outline" className="h-5 px-2 text-base border-blue-500/30 text-blue-400 whitespace-nowrap">Changed</Badge>;
    }
    return <Badge variant="outline" className="h-5 px-2 text-base border-emerald-500/30 text-emerald-500/90 whitespace-nowrap">Published</Badge>;
}

/* eslint-enable @typescript-eslint/no-explicit-any */
