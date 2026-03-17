
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    LayoutDashboard,
    Zap,
    Database,
    Network,
    Info
} from "lucide-react";


const DashboardDoc: React.FC = () => {
    return (
        <div className="space-y-12">
            <header className="space-y-2 border-l-4 border-primary pl-6">
                <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
                    Command Center
                </h2>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">High-level environment telemetry & orchestration</p>
            </header>

            <Card className="bg-card border-border/50 border-l-primary/30 shadow-2xl overflow-hidden group">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <LayoutDashboard className="h-5 w-5 text-primary" />
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground/80">Operational Interface</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                        The <strong className="text-primary">Dashboard</strong> provides a high-fidelity overview of available
                        Contentful nodes and environments. It serves as the primary terminal for cross-space
                        maneuvers and system health monitoring.
                    </p>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
                    <Zap className="h-3 w-3" />
                    Core Modules
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: <Database className="h-5 w-5" />, title: "Space Selector", desc: "Rapidly switch between registered Contentful Spaces and Organizations." },
                        { icon: <Network className="h-5 w-5" />, title: "Node Telemetry", desc: "Real-time status of available environments (Master, Staging, Ephemeral)." },
                        { icon: <Zap className="h-5 w-5" />, title: "Quick Launch", desc: "Direct shortcuts to Migrations, Archival Libraries, and Global Forge." }
                    ].map((step, i) => (
                        <Card key={i} className="bg-card border-border/50 hover:border-primary/30 transition-all group p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary border border-primary/20 group-hover:scale-110 transition-transform">
                                    {step.icon}
                                </div>
                            </div>
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-foreground">{step.title}</h4>
                            <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">{step.desc}</p>
                        </Card>
                    ))}
                </div>
            </div>

            <div className="flex gap-3 p-3 bg-muted/30 border border-border/50 rounded-lg items-start">
                <Info className="h-4 w-4 text-primary opacity-60 shrink-0 mt-0.5" />
                <div>
                    <p className="text-[11px] font-medium text-muted-foreground">
                        Select a primary space to begin environment discovery. All subsequent migration
                        actions will utilize the context established in the Dashboard.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default DashboardDoc;
