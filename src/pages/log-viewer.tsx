/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    ArrowLeft,
    Printer,
    FileText,
    Loader2,
    AlertTriangle,
    ChevronLeft
} from "lucide-react";
import { api } from '@/utils/api';


export default function LogViewerPage() {
    const router = useRouter();
    const { fileName } = router.query;
    const [content, setContent] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!fileName) return;

        const fetchLog = async () => {
            setLoading(true);
            try {
                const result = await api.get<any>(`/api/admin/error-log?file=${encodeURIComponent(fileName as string)}`);

                if (result.success && result.data?.content) {
                    try {
                        const formatted = JSON.stringify(JSON.parse(result.data.content), null, 2);
                        setContent(formatted);
                    } catch {
                        setContent(result.data.content);
                    }
                } else {
                    setError(result.error || 'Failed to load log file');
                }
            } catch {
                setError('Failed to fetch log file');
            } finally {
                setLoading(false);
            }
        };

        fetchLog();
    }, [fileName]);

    if (!fileName) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <AlertTriangle className="h-12 w-12 text-rose-500" />
                <p className="text-sm font-black uppercase tracking-widest text-muted-foreground">No manifest identifier specified</p>
                <Button variant="ghost" onClick={() => router.back()} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Return to Terminal
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto p-8 space-y-8 animate-in fade-in duration-500">
            {/* Header */}
            <header className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.back()}
                        className="gap-2 px-4 rounded-xl hover:bg-white/5 text-muted-foreground hover:text-foreground transition-all"
                    >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Abort Viewer</span>
                    </Button>
                    <div className="h-8 w-[1px] bg-white/5" />
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <h1 className="text-3xl font-black uppercase tracking-tight text-foreground">
                                Neural <span className="text-primary italic">Telemetry</span>
                            </h1>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground">Deep Log Fragment Analysis</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.print()}
                        className="rounded-xl bg-white/5 border-white/10 hover:bg-white/10 text-[10px] font-black uppercase tracking-widest gap-2"
                    >
                        <Printer className="h-3.5 w-3.5" />
                        Print Manifest
                    </Button>
                </div>
            </header>

            {/* Log Terminal */}
            <Card className="bg-black/90 backdrop-blur-xl border-white/10 shadow-3xl rounded-3xl overflow-hidden shadow-2xl">
                <CardHeader className="py-4 px-8 border-b border-white/5 bg-white/5 flex flex-row items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">System Manifest</span>
                            <span className="text-[9px] font-mono text-white/50">{fileName}</span>
                        </div>
                    </div>
                    <FileText className="h-4 w-4 text-white/20" />
                </CardHeader>
                <CardContent className="p-0">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-32 space-y-4">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">Decrypting telemetry data...</p>
                        </div>
                    ) : error ? (
                        <div className="p-12 text-center space-y-4">
                            <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
                            <p className="text-xs font-black uppercase tracking-widest text-rose-500">{error}</p>
                        </div>
                    ) : (
                        <div className="relative group">
                            <div className="absolute top-4 right-6 text-[10px] font-black uppercase tracking-widest text-white/20 group-hover:text-primary transition-colors pointer-events-none italic">
                                Read_Only_Access_Active
                            </div>
                            <pre className="p-8 margin-0 overflow-x-auto font-mono text-[11px] leading-relaxed text-emerald-400 selection:bg-emerald-500/20 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent min-h-[500px]">
                                {content}
                            </pre>
                        </div>
                    )}
                </CardContent>
            </Card>

            <footer className="text-center">
                <p className="text-[9px] font-black uppercase tracking-[0.3em] text-muted-foreground/30">
                    &copy; CMT NEURAL CORE PROTCOL LOG_V.01
                </p>
            </footer>
        </div>
    );
}
