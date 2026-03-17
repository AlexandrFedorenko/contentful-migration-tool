import React from 'react';
import { useAppSettings } from '@/hooks/useAppSettings';
import { Badge } from "@/components/ui/badge";
import { Zap } from "lucide-react";


const BetaBadge = React.memo(() => {
    const { settings, loading } = useAppSettings();

    if (loading || !settings?.betaBannerEnabled) {
        return null;
    }

    return (
        <div className="fixed bottom-20 right-5 z-[40] animate-in slide-in-from-right-4 duration-500">
            <div className="group relative">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-amber-500 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200" />
                <Badge
                    className="relative px-4 py-2 bg-muted/80 backdrop-blur-xl border-border/50 hover:bg-muted/90 transition-all cursor-default flex items-center gap-2 shadow-2xl"
                >
                    <Zap className="h-3 w-3 text-amber-500 fill-amber-500" />
                    <span className="text-xs font-bold tracking-normal bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/60">
                        {settings.betaBannerText}
                    </span>
                </Badge>
            </div>
        </div>
    );
});

BetaBadge.displayName = 'BetaBadge';

export default BetaBadge;
