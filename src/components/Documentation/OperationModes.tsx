import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Zap,
    Database,
    History,
    Repeat,
    Hammer,
    Cpu,
    CheckCircle2,
    ShieldAlert,
    Info
} from "lucide-react";

const OperationModes: React.FC = () => {
    return (
        <div className="space-y-12">
            <header className="space-y-2 border-l-4 border-primary pl-6">
                <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
                    Protocol Manifest
                </h2>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Deployment modes & operational logic</p>
            </header>

            <Card className="bg-card border-border/50 border-l-4 border-l-primary shadow-2xl overflow-hidden group">
                <CardHeader className="bg-primary/5 border-b border-border/50 p-8">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Zap className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-2xl font-black uppercase tracking-tight">Neural Sync (Smart Migration)</CardTitle>
                            <CardDescription className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] mt-1">Recommended Deployment Protocol</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                        Smart Migration is the flagship feature of the CMT infrastructure. It performs multi-environment
                        analysis to identify structural variances and allows for surgical content payloads.
                    </p>

                    <div className="space-y-6">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                            <Cpu className="h-3 w-3" />
                            Operational Phases:
                        </h4>
                        <div className="grid grid-cols-1 gap-6">
                            {[
                                { title: "Heuristic Scan", desc: "The engine maps source and target nodes to build a virtual content graph." },
                                { title: "Delta Detection", desc: "Comparing entries by ID and versioning to detect even minor attribute variances." },
                                { title: "Visual Comparison", desc: "Direct side-by-side manifest comparison with color-coded variance detection." }
                            ].map((phase, i) => (
                                <div key={i} className="flex gap-4 group">
                                    <div className="text-[10px] font-black text-primary/40 mt-1">{String(i + 1).padStart(2, '0')}</div>
                                    <div className="flex-1">
                                        <span className="text-xs font-black uppercase tracking-widest text-foreground/90 block mb-1">{phase.title}</span>
                                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">{phase.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="pt-6 border-t border-border/50 space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Variance Key:</h4>
                        <div className="flex flex-wrap gap-4">
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                                <Badge className="bg-emerald-500 text-white text-[8px] font-black uppercase tracking-widest h-4">NEW</Badge>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Source exclusive entry</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-amber-500/5 border border-amber-500/20">
                                <Badge className="bg-amber-500 text-white text-[8px] font-black uppercase tracking-widest h-4">MODIFIED</Badge>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Version mismatch detected</span>
                            </div>
                            <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/5 border border-rose-500/20">
                                <Badge className="bg-rose-500 text-white text-[8px] font-black uppercase tracking-widest h-4">DELETED</Badge>
                                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Target exclusive entry</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg items-start">
                        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Advanced Capabilities</p>
                            <p className="text-[11px] font-medium text-primary/80">
                                Includes recursive dependency resolution and selective locale synchronization.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Create Backup */}
                <Card className="bg-card border-border/50 shadow-xl overflow-hidden hover:border-primary/20 transition-all group">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <div className="flex items-center gap-4">
                            <Database className="h-5 w-5 text-primary" />
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Snapshot Protocol</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                            Generates a full serialized snapshot of the environment state.
                        </p>
                        <div className="space-y-2">
                            {["Content Schemas", "Entry Registry", "Asset Payloads", "Webhooks & Locales"].map((obj, i) => (
                                <div key={i} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-foreground/70">
                                    <div className="h-1 w-1 rounded-full bg-primary" />
                                    {obj}
                                </div>
                            ))}
                        </div>
                        <div className="flex gap-3 p-3 bg-primary/5 border border-primary/10 rounded-lg items-start">
                            <Info className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[9px] font-bold uppercase tracking-widest text-primary/60">Stored as local manifest</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Restore Mode */}
                <Card className="bg-card border-border/50 shadow-xl overflow-hidden border-b-4 border-b-rose-500/30 group">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <div className="flex items-center gap-4">
                            <History className="h-5 w-5 text-rose-500" />
                            <CardTitle className="text-sm font-black uppercase tracking-widest">State Restoration</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                            Injects content from a local manifest into the designated target node.
                        </p>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500/60">Auto-Snapshot Triggered</span>
                            <CheckCircle2 className="h-3 w-3 text-rose-500/60" />
                        </div>
                        <div className="flex gap-3 p-3 bg-rose-500/5 border border-rose-500/20 rounded-lg items-start">
                            <ShieldAlert className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-1">Destructive Action</p>
                                <p className="text-[10px] font-medium text-rose-500/80">Restoration overwrites targeted environment registries.</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Standard Migration */}
                <Card className="bg-card border-border/50 shadow-xl overflow-hidden group">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <div className="flex items-center gap-3">
                            <Info className="h-4 w-4 text-muted-foreground shrink-0" />
                            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Global Mirroring</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                            A brute-force sync of the entire environment state. Leverages the Contentful CLI
                            engine for 1:1 architectural replication.
                        </p>
                    </CardContent>
                </Card>

                {/* Visual Builder */}
                <Card className="bg-card border-border/50 shadow-xl overflow-hidden border-l-4 border-l-amber-500/30 group">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <div className="flex items-center gap-4">
                            <Hammer className="h-5 w-5 text-amber-500" />
                            <CardTitle className="text-sm font-black uppercase tracking-widest">Structural Forge</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-4">
                        <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">
                            Blueprint-based schema modification. Design structural shifts without manually writing migration scripts.
                        </p>
                        <div className="grid grid-cols-2 gap-2">
                            {["SEO Injection", "Slug Schema", "Field Redefinition", "Auto-Codegen"].map((feat, i) => (
                                <div key={i} className="p-2 rounded bg-amber-500/5 border border-amber-500/10 text-[8px] font-black uppercase tracking-widest text-amber-500/80">
                                    {feat}
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default OperationModes;
