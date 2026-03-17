import React, { useState, useEffect } from 'react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { ArrowRight, Languages, Info } from 'lucide-react';
import type { BackupLocale } from '@/types/backup';
import type { LocaleMapping } from '@/utils/locale-filter';

interface LocaleRemapModalProps {
    open: boolean;
    onClose: () => void;
    sourceLocales: BackupLocale[];
    targetLocales: BackupLocale[];
    initialMapping: LocaleMapping;
    onApply: (mapping: LocaleMapping) => void;
}

/**
 * Locale Code Remap Modal
 *
 * Allows user to map source locale codes → target locale codes.
 * Use case: source uses "en", target uses "en-US" as default (can't be renamed).
 *
 * The right column shows target locales fetched via CMA.
 * After confirming, the mapping is applied to both Transfer and Export flows.
 */
export function LocaleRemapModal({
    open,
    onClose,
    sourceLocales,
    targetLocales,
    initialMapping,
    onApply,
}: LocaleRemapModalProps) {
    const [localMap, setLocalMap] = useState<LocaleMapping>(initialMapping);

    // Sync whenever modal opens with fresh initial mapping
    useEffect(() => {
        if (open) setLocalMap(initialMapping);
    }, [open, initialMapping]);

    const handleChange = (sourceCode: string, targetCode: string) => {
        setLocalMap(prev => {
            const next = { ...prev };
            if (targetCode === sourceCode || targetCode === '__identity__') {
                delete next[sourceCode]; // no mapping needed
            } else {
                next[sourceCode] = targetCode;
            }
            return next;
        });
    };

    const handleApply = () => {
        onApply(localMap);
        onClose();
    };

    const hasMapping = Object.keys(localMap).length > 0;

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-lg border-primary/20 shadow-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-lg font-extrabold">
                        <Languages className="h-5 w-5 text-primary" />
                        Locale Code Remapping
                    </DialogTitle>
                    <DialogDescription className="text-sm text-muted-foreground pt-1 leading-relaxed">
                        Map source locale codes to target locale codes. Useful when source uses{' '}
                        <code className="text-xs bg-muted px-1 rounded">en</code> but target expects{' '}
                        <code className="text-xs bg-muted px-1 rounded">en-US</code>.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-2 px-1 py-2 bg-primary/5 border border-primary/10 rounded-lg text-xs text-muted-foreground">
                    <Info className="h-3.5 w-3.5 text-primary shrink-0" />
                    The renamed locale keys will be applied to downloaded JSON and ZIP — import on the target account will pass without errors.
                </div>

                {/* Header row */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground px-1">
                    <span>Source locale</span>
                    <span />
                    <span>Target locale</span>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {sourceLocales.map((srcLocale) => {
                        const currentTarget = localMap[srcLocale.code] ?? srcLocale.code;
                        const hasRemap = localMap[srcLocale.code] && localMap[srcLocale.code] !== srcLocale.code;

                        return (
                            <div
                                key={srcLocale.code}
                                className="grid grid-cols-[1fr_auto_1fr] items-center gap-2"
                            >
                                {/* Source */}
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold truncate">{srcLocale.name}</p>
                                        <p className="text-[10px] text-muted-foreground font-mono">{srcLocale.code}</p>
                                    </div>
                                    {srcLocale.default && (
                                        <Badge variant="secondary" className="text-[9px] h-4 px-1 shrink-0">default</Badge>
                                    )}
                                </div>

                                {/* Arrow */}
                                <ArrowRight className={`h-4 w-4 shrink-0 transition-colors ${hasRemap ? 'text-primary' : 'text-muted-foreground/30'}`} />

                                {/* Target selector */}
                                <Select
                                    value={currentTarget}
                                    onValueChange={(val) => handleChange(srcLocale.code, val)}
                                >
                                    <SelectTrigger className={`h-9 text-xs font-mono transition-colors ${hasRemap ? 'border-primary/40 bg-primary/5 text-primary' : ''}`}>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {/* Identity option */}
                                        <SelectItem value={srcLocale.code} className="text-xs font-mono">
                                            {srcLocale.code} <span className="text-muted-foreground ml-1">(no remap)</span>
                                        </SelectItem>
                                        {targetLocales
                                            .filter(t => t.code !== srcLocale.code)
                                            .map(tgt => (
                                                <SelectItem key={tgt.code} value={tgt.code} className="text-xs font-mono">
                                                    {tgt.code}
                                                    {tgt.default && (
                                                        <span className="text-muted-foreground ml-1">(default)</span>
                                                    )}
                                                </SelectItem>
                                            ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        );
                    })}
                </div>

                {hasMapping && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/5 border border-primary/10 text-xs text-primary">
                        <Languages className="h-3 w-3 shrink-0" />
                        <span className="font-bold">{Object.keys(localMap).length} remap(s) configured</span>
                    </div>
                )}

                <DialogFooter className="gap-2">
                    <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
                    <Button size="sm" onClick={handleApply} className="bg-primary hover:bg-primary/90">
                        Apply Mapping
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
