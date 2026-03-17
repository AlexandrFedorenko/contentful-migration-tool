import React, { useState, useEffect, useMemo } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,

} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableRow
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
    Globe,
    Info,
    AlertCircle,
    CheckCircle2
} from "lucide-react";
import type { Locale } from "@/types/common";

interface LocaleMappingModalProps {
    open: boolean;
    sourceLocales?: Locale[];
    targetLocales?: Locale[];
    validationResult?: {
        sourceLocales: Locale[];
        targetLocales: Locale[];
    } | null;
    onConfirm: (mapping: Record<string, string>) => void;
    onCancel: () => void;
}

export default function LocaleMappingModal({
    open,
    sourceLocales: propSourceLocales,
    targetLocales: propTargetLocales,
    validationResult,
    onConfirm,
    onCancel
}: LocaleMappingModalProps) {
    const [mapping, setMapping] = useState<Record<string, string>>({});

    const sourceLocales = useMemo(() => validationResult ? validationResult.sourceLocales : (propSourceLocales || []), [validationResult, propSourceLocales]);
    const targetLocales = useMemo(() => validationResult ? validationResult.targetLocales : (propTargetLocales || []), [validationResult, propTargetLocales]);

    useEffect(() => {
        if (open) {
            const newMapping: Record<string, string> = {};
            const targetDefault = targetLocales.find(l => l.default)?.code;

            sourceLocales.forEach(source => {
                const exactMatch = targetLocales.find(t => t.code === source.code);
                if (exactMatch) {
                    newMapping[source.code] = exactMatch.code;
                }
                else if (source.default && targetDefault) {
                    newMapping[source.code] = targetDefault;
                }
                else {
                    newMapping[source.code] = '__SKIP__';
                }
            });
            setMapping(newMapping);
        }
    }, [open, sourceLocales, targetLocales]);

    const handleChange = (sourceCode: string, targetCode: string) => {
        setMapping(prev => ({ ...prev, [sourceCode]: targetCode }));
    };

    const handleSave = () => {
        const finalMapping: Record<string, string> = {};
        Object.entries(mapping).forEach(([source, target]) => {
            if (target !== '__SKIP__') {
                finalMapping[source] = target;
            }
        });

        onConfirm(finalMapping);
    };

    const sourceDefault = sourceLocales.find(l => l.default);
    const isDefaultMapped = sourceDefault && mapping[sourceDefault.code] !== '__SKIP__';

    return (
        <Dialog open={open} onOpenChange={(val) => !val && onCancel()}>
            <DialogContent className="max-w-2xl border-primary/20 bg-card/95 backdrop-blur-xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-3 text-2xl font-extrabold pb-2">
                        <Globe className="h-6 w-6 text-primary" />
                        Map Backup Locales
                    </DialogTitle>
                </DialogHeader>

                <div className="flex-grow overflow-y-auto space-y-6 pr-2">
                    <Alert className="bg-indigo-500/10 border-indigo-500/20 text-indigo-400 py-3">
                        <Info className="h-4 w-4" />
                        <AlertTitle className="text-xs font-bold uppercase tracking-widest">Localization Resolution</AlertTitle>
                        <AlertDescription className="text-xs leading-relaxed">
                            Mismatch detected between backup and target environment. Map sources to targets or skip locales to exclude their content.
                        </AlertDescription>
                    </Alert>

                    {!isDefaultMapped && (
                        <Alert variant="destructive" className="bg-destructive/10 border-destructive/20 text-destructive py-3">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle className="text-xs font-bold uppercase tracking-widest">Critical Warning</AlertTitle>
                            <AlertDescription className="text-xs leading-relaxed">
                                You are skipping the Default Locale ({sourceDefault?.code}). This will likely cause validation errors as Content Types require a default value.
                            </AlertDescription>
                        </Alert>
                    )}

                    <div className="rounded-xl border border-border/50 bg-background/30 overflow-hidden shadow-inner">
                        <Table>
                            <TableHead className="bg-muted/50">
                                <TableRow className="hover:bg-transparent border-border/50">
                                    <TableCell className="font-bold text-xs uppercase tracking-widest text-muted-foreground w-1/2">Backup Locale</TableCell>
                                    <TableCell className="font-bold text-xs uppercase tracking-widest text-muted-foreground w-1/2">Target Mapping</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {sourceLocales.map((source) => (
                                    <TableRow key={source.code} className="border-border/50 hover:bg-muted/30">
                                        <TableCell>
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="font-mono font-bold text-primary">{source.code}</span>
                                                    {source.default && (
                                                        <Badge variant="outline" className="text-[9px] h-4 bg-primary/10 text-primary border-primary/20">DEFAULT</Badge>
                                                    )}
                                                </div>
                                                <span className="text-xs text-muted-foreground italic truncate max-w-[200px]">{source.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Select
                                                value={mapping[source.code] || '__SKIP__'}
                                                onValueChange={(val) => handleChange(source.code, val)}
                                            >
                                                <SelectTrigger className="w-full bg-background/40 h-10 border-border/50 hover:border-primary/50 transition-colors">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="__SKIP__" className="text-destructive font-semibold">
                                                        <div className="flex items-center gap-2">
                                                            <XCircle className="h-3 w-3" />
                                                            <span>(Skip / Don't Import)</span>
                                                        </div>
                                                    </SelectItem>
                                                    {targetLocales.map(target => (
                                                        <SelectItem key={target.code} value={target.code}>
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono font-bold">{target.code}</span>
                                                                {target.default && <span className="text-[10px] text-muted-foreground">(Default)</span>}
                                                                <span className="text-[10px] opacity-40">— {target.name}</span>
                                                            </div>
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>

                <DialogFooter className="pt-4 border-t border-border/50 flex flex-col sm:flex-row gap-3">
                    <Button variant="ghost" onClick={onCancel} className="w-full sm:w-auto">
                        Cancel Migration
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="w-full sm:w-auto px-8 font-bold bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                    >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Confirm & Restore
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// Helper for XCircle icon missing in imports
function XCircle(props: React.SVGProps<SVGSVGElement>) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <path d="m15 9-6 6" />
            <path d="m9 9 6 6" />
        </svg>
    );
}
