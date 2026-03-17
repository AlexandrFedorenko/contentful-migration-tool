import React from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    GitMerge, ArrowRight, Zap,
    Settings2, ChevronRight,
    Search, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Step = ({ n, title, desc }: { n: number; title: string; desc: React.ReactNode }) => (
    <div className="flex gap-4 group">
        <div className="text-[10px] font-black text-rose-500/40 group-hover:text-rose-500 transition-colors mt-1 tabular-nums">
            {String(n).padStart(2, '0')}
        </div>
        <div>
            <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground/80 mb-1">{title}</h5>
            <div className="text-[11px] font-medium text-muted-foreground">{desc}</div>
        </div>
    </div>
);

const Badge = ({ label, color }: { label: string; color: string }) => (
    <div className={cn("px-3 py-2 rounded-xl border border-border/50 text-[9px] font-black uppercase tracking-widest text-center", color)}>
        {label}
    </div>
);

const SmartMigrateDoc: React.FC = () => {
    const router = useRouter();

    return (
        <div className="space-y-12">
            {/* Header */}
            <header className="space-y-2 border-l-4 border-rose-500 pl-6">
                <h2 className="text-3xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                    <GitMerge className="h-7 w-7 text-rose-500" />
                    Smart Migrate
                </h2>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Real-time environment diffs · Sync changes · Content Type syncing · Entry syncing
                </p>
                <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 text-rose-400 border-rose-500/30 hover:bg-rose-500/10"
                    onClick={() => router.push('/smart-migration')}
                >
                    <GitMerge className="h-3.5 w-3.5 mr-2" />
                    Open Smart Migrate
                    <ArrowRight className="h-3.5 w-3.5 ml-2" />
                </Button>
            </header>

            {/* What is Smart Migrate */}
            <Card className="bg-card border-border/50 shadow-2xl overflow-hidden border-l-rose-500/30">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-rose-500" />
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground/80">
                            What is Smart Migrate?
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                        <strong className="text-rose-400">Smart Migrate</strong> is a powerful synchronization tool built specifically for
                        Contentful environments. Instead of blindly overwriting data or manually moving JSON files, Smart Migrate compares
                        two environments in real-time and shows you exactly what changed.
                    </p>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                        It connects via the CMA, compares Content Types and Entries between your <strong className="text-foreground">Source</strong> and
                        <strong className="text-foreground"> Target</strong> environments, and allows you to surgically sync over new or modified content.
                        It handles recursive dependencies (like referenced assets or nested entries) automatically.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2">
                        {[
                            { label: "Real-Time Diff", color: "bg-blue-500/10 text-blue-400" },
                            { label: "Lazy Loading", color: "bg-amber-500/10 text-amber-400" },
                            { label: "Show Changed Only", color: "bg-emerald-500/10 text-emerald-400" },
                            { label: "Smart Previews", color: "bg-violet-500/10 text-violet-400" },
                            { label: "Dependency Sync", color: "bg-pink-500/10 text-pink-400" },
                        ].map((b) => <Badge key={b.label} {...b} />)}
                    </div>
                </CardContent>
            </Card>

            {/* Prerequisites */}
            <Card className="bg-card border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground/80 flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-rose-500" /> Before you start — Prerequisites
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                        <div className="flex gap-3 items-start">
                            <span className="text-rose-400 text-xs font-bold mt-0.5 shrink-0">1.</span>
                            <div className="text-xs text-foreground/70">
                                <strong className="text-foreground">CMA Token configured.</strong> Ensure your Contentful Management API token is saved in Settings.
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <span className="text-rose-400 text-xs font-bold mt-0.5 shrink-0">2.</span>
                            <div className="text-xs text-foreground/70">
                                <strong className="text-foreground">Two environments.</strong> You need a Source environment (where the new content is) and a Target environment (where you want to move it to).
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Step-by-Step Guide */}
            <Card className="bg-card border-border/50 shadow-2xl overflow-hidden border-l-rose-500/30">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-rose-500" />
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground/80">
                            Step-by-Step Guide — How to Sync Changes
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        The Smart Migrate flow is designed to be safe, fast, and transparent. Follow these steps to sync your environments.
                    </p>

                    <div className="space-y-5">
                        <Step n={1} title="Select Source & Target" desc={
                            <span>Choose the <strong className="text-foreground">Source Environment</strong> (e.g., staging) and the <strong className="text-foreground">Target Environment</strong> (e.g., master). These can be in the same space or different spaces.</span>
                        } />

                        <Step n={2} title='Click "Load Live Diff"' desc={
                            <span>Press the <strong className="text-foreground">Load Live Diff</strong> button. The app will connect to Contentful, perform a top-level comparison of all Content Types and Locales, and immediately show you the results without freezing your browser.</span>
                        } />

                        <Step n={3} title="Use the 'Changed' Filter" desc={
                            <span>By default, the list is filtered to <strong className="text-foreground">Changed</strong>. This means it hides any Content Types that are 100% identical (<code className="bg-muted px-1 rounded text-[10px]">= EQUAL</code>) in both environments. You will only see Content Types that are <strong className="text-emerald-400">NEW</strong>, <strong className="text-amber-400">MODIFIED</strong>, or contain modified entries.</span>
                        } />

                        <Step n={4} title="Review Content Types" desc={
                            <span>Each visible Content Type card shows its overall status. If there are differences in the schema, you will see a badge. If the schema is identical but the entries inside are different, the UI will automatically scan and flag that there are modified entries.</span>
                        } />

                        <Step n={5} title="Lazy-load Entries" desc={
                            <span>To see exactly what changed inside a Content Type, click the <strong className="text-foreground">Show entries ▼</strong> button. This triggers a lazy-load to fetch the exact differences in entries for just that Content Type. You will see <strong className="text-emerald-400">NEW</strong> entries, <strong className="text-amber-400">MODIFIED</strong> entries (with a field-change count), and unmodified ones.</span>
                        } />

                        <Step n={6} title="Select Content for Migration" desc={
                            <span>Check the boxes next to the Content Types or individual Entries you wish to migrate. If you select an entry that requires a specific Content Type schema, Smart Migrate will automatically select the required dependencies to prevent broken links in the target.</span>
                        } />

                        <Step n={7} title="Configure Options" desc={
                            <span>Scroll to the bottom to configure migration options like <strong className="text-foreground">Include Assets</strong>, the Migration Mode (Upsert vs Skip), and whether to create a safety backup.</span>
                        } />

                        <Step n={8} title="Execute Migration" desc={
                            <span>Click <strong className="text-foreground">Start Migration</strong>. A real-time streaming console will appear, showing every single Content Type, Entry, and Asset as it is processed and published in the target environment.</span>
                        } />
                    </div>
                </CardContent>
            </Card>

            {/* Anatomy of the Diff */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
                    <Search className="h-3 w-3" /> Anatomy of the Smart Diff
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3 p-5 rounded-xl border border-border/50 bg-card">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">NEW Content</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Marked with a prominent green <code className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-1 rounded">⊕ NEW</code> badge.
                            This means the item exists in the Source but does not exist at all in the Target. Migrating this will create a brand new Content Type or Entry in the Target environment.
                        </p>
                    </div>
                    <div className="space-y-3 p-5 rounded-xl border border-border/50 bg-card">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-amber-400">MODIFIED Content</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Marked with a yellow <code className="bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 rounded">✎ MODIFIED</code> badge.
                            This means the item exists in both environments, but the fields or schema are different. For entries, the UI will tell you exactly how many fields differ (e.g., &quot;2 fields changed&quot;).
                        </p>
                    </div>
                    <div className="space-y-3 p-5 rounded-xl border border-border/50 bg-card">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-400">DELETED Content</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Marked with a red <code className="bg-rose-500/10 text-rose-400 border border-rose-500/30 px-1 rounded text-red-400">⊗ DELETED</code> badge.
                            This means the item exists in the Target environment but is missing from your Source environment. Note: The tool currently prevents selecting Deleted items to avoid accidentally wiping data from your Target. It serves purely as an informational warning that your Target has orphaned content.
                        </p>
                    </div>
                    <div className="space-y-3 p-5 rounded-xl border border-border/50 bg-card">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground/50">EQUAL Content</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            Marked with a gray <code className="bg-muted/20 text-muted-foreground border border-border/50 px-1 rounded text-foreground/50">= EQUAL</code> badge.
                            The item is 100% identical in both environments. By default, the &quot;Changed&quot; filter hides these items to keep the interface clean and focused on action items.
                        </p>
                    </div>
                </div>
            </div>

            {/* Performance */}
            <Card className="bg-card border-violet-500/10">
                <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-violet-400 flex items-center gap-2">
                        <Zap className="h-4 w-4" /> Progressive Background Loading
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Enterprise Contentful spaces can have thousands of entries. If Smart Migrate tried to download and compare all of them at once, the API would time out and the browser would crash.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        To solve this, Smart Migrate uses <strong className="text-foreground">Progressive Background Loading</strong>.
                        When you first load the diff, it only compares the Content Type definitions (schemas) and counts the total entries.
                        Then, silently in the background, it begins querying entries in small batches of 3 Content Types at a time.
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        If the background worker discovers that an &quot;Equal&quot; Content Type actually contains &quot;Modified&quot; entries inside, it will instantly pop that Content Type into your &quot;Changed&quot; view. This architecture guarantees infinite scale while keeping the UI snappy.
                    </p>
                </CardContent>
            </Card>

            {/* Related Documentation */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Related Documentation</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { label: "Smart Restore", desc: "For full environment cloning & backup restores", tab: "smart-restore" },
                        { label: "Backups History", desc: "View automatic safety snapshots", tab: "backups" },
                    ].map((link) => (
                        <button
                            key={link.label}
                            onClick={() => router.push(`/doc?tab=${link.tab}`)}
                            className="flex gap-3 p-4 rounded-xl bg-card border border-border/50 hover:border-violet-500/20 transition-all text-left group"
                        >
                            <ChevronRight className="h-4 w-4 text-violet-500 mt-0.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                            <div>
                                <h5 className="text-[10px] font-black uppercase tracking-wider text-foreground/80 mb-1">{link.label}</h5>
                                <p className="text-[11px] text-muted-foreground">{link.desc}</p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default SmartMigrateDoc;
