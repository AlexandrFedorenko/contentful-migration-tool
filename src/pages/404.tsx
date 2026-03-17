import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import {
    Home,
    SearchX,
    AlertTriangle,
    ChevronLeft,
    Terminal
} from "lucide-react";

export default function Custom404() {
    const router = useRouter();

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-700">
            <Head>
                <title>404 - Lost in DevSpace | Contentful CMT</title>
            </Head>

            <div className="relative mb-12">
                <div className="absolute inset-0 blur-3xl bg-primary/20 rounded-full animate-pulse" />
                <div className="relative h-32 w-32 rounded-[2rem] border border-white/10 bg-black/40 flex items-center justify-center">
                    <SearchX className="h-16 w-16 text-primary/40" />
                </div>
                <div className="absolute -bottom-2 -right-2 h-10 w-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center animate-bounce">
                    <AlertTriangle className="h-5 w-5" />
                </div>
            </div>

            <div className="space-y-4 max-w-md">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary mb-4">
                    <Terminal className="h-3 w-3" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Error 404: Node Not Found</span>
                </div>

                <h1 className="text-4xl font-black uppercase tracking-tight text-foreground">
                    Neural Link <span className="text-primary italic">Severed</span>
                </h1>

                <p className="text-[11px] font-medium text-muted-foreground leading-relaxed uppercase tracking-widest italic pt-2">
                    The requested manifest fragment does not exist in the current architectural layer. The coordinates provided are outside the known system boundaries.
                </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 mt-12 w-full max-w-sm">
                <Button
                    onClick={() => router.push('/dashboard')}
                    className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest gap-3 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]"
                >
                    <Home className="h-5 w-5" />
                    Reset Core
                </Button>

                <Button
                    variant="outline"
                    onClick={() => router.back()}
                    className="w-full h-14 rounded-2xl bg-white/5 border-white/10 hover:bg-white/10 text-[11px] font-black uppercase tracking-widest gap-3"
                >
                    <ChevronLeft className="h-5 w-5" />
                    Reverse Sequence
                </Button>
            </div>

            <footer className="mt-24">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] text-muted-foreground/20">
                    &copy; CMT_SYSTEM_FAILSAFE TERMINAL_ERROR_V4.04
                </p>
            </footer>
        </div>
    );
}
