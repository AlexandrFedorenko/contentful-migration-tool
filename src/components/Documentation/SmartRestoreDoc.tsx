import React from 'react';
import { useRouter } from 'next/router';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Sparkles, Layers, Globe, ArrowRight, Shield, Zap, Info, AlertTriangle,
    Download, Send, Settings2, ChevronRight, GitBranch, Clock, CheckCircle2,
    Search, Eye, RefreshCw, FileJson, Trash2, Link2, ExternalLink
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const Step = ({ n, title, desc }: { n: number; title: string; desc: React.ReactNode }) => (
    <div className="flex gap-4 group">
        <div className="text-[10px] font-black text-violet-500/40 group-hover:text-violet-500 transition-colors mt-1 tabular-nums">
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

const SmartRestoreDoc: React.FC = () => {
    const router = useRouter();

    return (
        <div className="space-y-12">
            {/* Header */}
            <header className="space-y-2 border-l-4 border-violet-500 pl-6">
                <h2 className="text-3xl font-black uppercase tracking-tight text-foreground flex items-center gap-3">
                    <Sparkles className="h-7 w-7 text-violet-500" />
                    Smart Restore
                </h2>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">
                    Live CMA transfer · Selective content · Locale remapping · Cross-space migration · Real-time logs
                </p>
                <Button
                    size="sm"
                    variant="outline"
                    className="mt-2 border-violet-500/30 text-violet-400 hover:bg-violet-500/10"
                    onClick={() => router.push('/smart-restore')}
                >
                    <Sparkles className="h-3.5 w-3.5 mr-2" />
                    Open Smart Restore
                    <ArrowRight className="h-3.5 w-3.5 ml-2" />
                </Button>
            </header>

            {/* What is Smart Restore */}
            <Card className="bg-card border-border/50 border-l-violet-500/30 shadow-2xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <Zap className="h-5 w-5 text-violet-500" />
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground/80">
                            What is Smart Restore?
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-4">
                    <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                        <strong className="text-violet-400">Smart Restore</strong> is the next-generation content transfer engine
                        that works with the <strong className="text-foreground">Contentful Management API (CMA) directly</strong> —
                        no JSON files, no CLI black-boxes. It connects to your Contentful space in real time, lets you see and
                        select exactly which content types, entries, and locales to transfer, and then moves them to any target
                        environment via intelligent CMA upserts.
                    </p>
                    <p className="text-sm text-foreground/70 leading-relaxed">
                        This is the recommended way to move content between Contentful environments when you need full control
                        over what gets transferred. Whether you are syncing staging → production, seeding a new environment,
                        or migrating content between completely different Contentful spaces — Smart Restore handles it all.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 pt-2">
                        {[
                            { label: "Live CMA Data", color: "bg-violet-500/10 text-violet-400" },
                            { label: "Selective CTs", color: "bg-blue-500/10 text-blue-400" },
                            { label: "Locale Remap", color: "bg-emerald-500/10 text-emerald-400" },
                            { label: "Cross-Space", color: "bg-amber-500/10 text-amber-400" },
                            { label: "Real-Time Logs", color: "bg-pink-500/10 text-pink-400" },
                        ].map((b) => <Badge key={b.label} {...b} />)}
                    </div>
                </CardContent>
            </Card>

            {/* Prerequisites */}
            <Card className="bg-card border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground/80 flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-violet-500" /> Before you start — Prerequisites
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                        <div className="flex gap-3 items-start">
                            <span className="text-violet-400 text-xs font-bold mt-0.5 shrink-0">1.</span>
                            <div className="text-xs text-foreground/70">
                                <strong className="text-foreground">Contentful CMA Token configured.</strong> Go to <em>Settings → Access Tokens</em> in the app
                                and paste your Contentful <strong>Content Management API (CMA) Personal Access Token</strong>.
                                This token gives the application permission to read and write content in your spaces.
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <span className="text-violet-400 text-xs font-bold mt-0.5 shrink-0">2.</span>
                            <div className="text-xs text-foreground/70">
                                <strong className="text-foreground">At least one Space with content.</strong> The source environment must contain
                                at least one Content Type with entries.
                            </div>
                        </div>
                        <div className="flex gap-3 items-start">
                            <span className="text-violet-400 text-xs font-bold mt-0.5 shrink-0">3.</span>
                            <div className="text-xs text-foreground/70">
                                <strong className="text-foreground">Target environment exists.</strong> The target environment (where content will be transferred to)
                                must already exist in the target space. Smart Restore does not create environments.
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg items-start">
                        <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-500 mb-1">Where to get a CMA Token</p>
                            <div className="text-[11px] text-blue-400/80 space-y-1">
                                <p>In the Contentful web app: <strong>Settings → CMA Tokens → Create personal access token</strong>.</p>
                                <p>
                                    Official documentation:{' '}
                                    <a href="https://www.contentful.com/developers/docs/references/authentication/" target="_blank" rel="noopener noreferrer" className="underline hover:text-blue-300">
                                        Contentful Authentication Reference ↗
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Smart Restore vs Classic Restore */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
                    <GitBranch className="h-3 w-3" /> Smart Restore vs Classic Restore
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        {
                            title: "Classic Restore", icon: <Clock className="h-4 w-4" />, color: "border-red-500/10",
                            items: [
                                "Requires a previously created JSON backup file",
                                "Uses the contentful-cli import command (black box)",
                                "No live preview — you import blindly",
                                "Hard to select specific Content Types or locales",
                                "Risk of locale duplication and broken links",
                                "Cannot transfer between different spaces easily",
                            ], bad: true
                        },
                        {
                            title: "Smart Restore", icon: <CheckCircle2 className="h-4 w-4" />, color: "border-violet-500/20",
                            items: [
                                "Fetches live data directly from Contentful via CMA",
                                "Direct upsert — full control, no CLI dependency",
                                "Real preview with entry counts, sample titles, field values",
                                "Select Content Types, locales, and see dependencies",
                                "Correct locale handling — keys stripped, never duplicated",
                                "Supports same-space, cross-environment, and cross-space transfers",
                            ], bad: false
                        }
                    ].map((col) => (
                        <Card key={col.title} className={cn("border", col.color, "bg-card/20")}>
                            <CardHeader className="pb-2 border-b border-border/50">
                                <CardTitle className={cn("text-xs font-black uppercase tracking-widest flex items-center gap-2", col.bad ? "text-red-400" : "text-violet-400")}>
                                    {col.icon} {col.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-4 space-y-2">
                                {col.items.map((item, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-foreground/70">
                                        <span className={cn("text-[10px] font-bold mt-0.5 shrink-0", col.bad ? "text-red-400" : "text-violet-400")}>
                                            {col.bad ? "✗" : "✓"}
                                        </span>
                                        {item}
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Step-by-Step Guide — Full Flow */}
            <Card className="bg-card border-border/50 border-l-violet-500/30 shadow-2xl overflow-hidden">
                <CardHeader className="bg-muted/30 border-b border-border/50">
                    <div className="flex items-center gap-3">
                        <Eye className="h-5 w-5 text-violet-500" />
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground/80">
                            Step-by-Step Guide — How to Use Smart Restore
                        </CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Follow these steps to perform a content transfer. The interface is divided into clear sections that guide you through the entire process.
                    </p>

                    <div className="space-y-5">
                        <Step n={1} title="Open Smart Restore" desc={
                            <span>Navigate to <strong className="text-foreground">Smart Restore</strong> from the Dashboard. The page opens with the<strong className="text-foreground"> Source Environment</strong> section at the top.</span>
                        } />

                        <Step n={2} title="Select Source Space & Environment" desc={
                            <span>Choose the <strong className="text-foreground">Space</strong> and <strong className="text-foreground">Environment</strong> that contains the content you want to transfer. This is where the data will be read FROM. By default, your currently selected space is pre-filled.</span>
                        } />

                        <Step n={3} title='Click "Load Preview"' desc={
                            <span>Press the <strong className="text-foreground">Load Preview</strong> button. The system will connect to the Contentful CMA, fetch all Content Types, their entry counts, sample entries with full field data, and available locales. This may take a few seconds depending on the size of your space.</span>
                        } />

                        <Step n={4} title="Review the Content Selection Panel" desc={
                            <span>Once the preview loads, you will see two main sections:
                                <br /><strong className="text-foreground">• Locales</strong> — all available locales in the source environment. The default locale is marked with a <code className="bg-muted px-1 rounded text-[10px]">def</code> badge.
                                <br /><strong className="text-foreground">• Content Types</strong> — a full list of every Content Type with its entry count. You can search/filter Content Types by name or ID using the search bar.
                            </span>
                        } />

                        <Step n={5} title="Select Locales" desc={
                            <span>By default, <strong className="text-foreground">all locales are included</strong> (no checkboxes are checked, which means &quot;include everything&quot;). To <strong>exclude</strong> a locale, simply <strong>uncheck</strong> it. Only checked locales will be transferred. If a locale has a different code in the target (e.g., <code className="bg-muted px-1 rounded text-[10px]">en</code> in source → <code className="bg-muted px-1 rounded text-[10px]">en-US</code> in target), you can configure this in the <strong>Locale Remap</strong> section (see below).</span>
                        } />

                        <Step n={6} title="Select Content Types" desc={
                            <span>Check the Content Types you want to transfer. You can use <strong className="text-foreground">All</strong> / <strong className="text-foreground">None</strong> shortcuts, or use the <strong>search bar</strong> to filter by name or ID. When you select a Content Type that references another Content Type (e.g., a Landing Page that references a Hero Component), the dependency is <strong>automatically resolved</strong> and added to the selection with an <strong className="text-amber-400">auto-dep</strong> badge.</span>
                        } />

                        <Step n={7} title="Preview Entries (Optional)" desc={
                            <span>Click the <strong>expand arrow (▼)</strong> on any Content Type to see its sample entries in a Contentful-style list with <strong>Name</strong>, <strong>Content Type</strong>, <strong>Updated</strong>, and <strong>Status</strong> columns. Click on any entry row to expand it further and see the full field values for each locale. Images are displayed as thumbnails, references show as pills with resolved titles, and Rich Text content is rendered as readable text.</span>
                        } />

                        <Step n={8} title="Choose Action Mode" desc={
                            <span>In the <strong className="text-foreground">Action</strong> section below the content list, choose between two modes:
                                <br /><strong className="text-blue-400">• Live Transfer</strong> — direct real-time transfer via CMA to a target environment.
                                <br /><strong className="text-emerald-400">• Export JSON</strong> — generate a downloadable JSON file for importing elsewhere.
                            </span>
                        } />

                        <Step n={9} title="Configure Target (Live Transfer only)" desc={
                            <span>For <strong className="text-foreground">Live Transfer</strong>, select the <strong>target Space</strong> and <strong>target Environment</strong>. This is where the content will be written TO. You can choose the same space (different environment) or a completely different space — both are supported as long as your CMA token has access.</span>
                        } />

                        <Step n={10} title="Configure Transfer Options" desc={
                            <span>Three key options are available:
                                <br /><strong className="text-foreground">• Clear environment before transfer</strong> — ⚠️ Deletes ALL content in the target before writing. Use with extreme caution.
                                <br /><strong className="text-foreground">• Include Assets</strong> — Also transfers images, files, and other Assets referenced by the selected entries.
                                <br /><strong className="text-foreground">• Merge Mode</strong> — <code className="bg-muted px-1 rounded text-[10px]">Upsert</code> (update existing + create new) or <code className="bg-muted px-1 rounded text-[10px]">Skip Existing</code> (only create entries that don&apos;t exist yet).
                            </span>
                        } />

                        <Step n={11} title="Execute" desc={
                            <span>Press <strong className="text-foreground">Start Transfer</strong> or <strong className="text-foreground">Build Export</strong>. For Live Transfer, a <strong>real-time log stream</strong> will appear showing every step: safety backup creation, Content Type upserts, entry transfers, asset processing, publishing, and the final summary with success/failure counts.</span>
                        } />
                    </div>
                </CardContent>
            </Card>

            {/* Two Modes */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
                    <Layers className="h-3 w-3" /> Two Operation Modes in Detail
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="bg-card border-border/50">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-blue-400 flex items-center gap-2">
                                <Send className="h-4 w-4" /> Mode 1: Live Transfer
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Transfer content <strong className="text-foreground">in real time between Contentful environments</strong>.
                                Works within the same space (e.g., <code className="bg-muted px-1 rounded text-[10px]">staging → master</code>)
                                or across completely different spaces as long as your CMA token has access to both.
                            </p>
                            <div className="space-y-2">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground/60">What Happens During Transfer</h5>
                                {[
                                    { n: 1, title: "Safety backup of target", desc: "A full backup of the TARGET environment is automatically created and saved to your Backups History before any changes are made." },
                                    { n: 2, title: "Content Types fetched from source", desc: "All Content Types and their schemas are loaded. Dependencies are resolved automatically." },
                                    { n: 3, title: "Entries fetched and filtered", desc: "All entries for selected CTs are fetched. Locale filtering and remapping are applied. Entry-to-entry and entry-to-asset dependencies are resolved." },
                                    { n: 4, title: "Optional: target cleared", desc: "If 'Clear environment' is enabled, all existing entries, assets, and content types are deleted from the target." },
                                    { n: 5, title: "Content Types upserted", desc: "Content Type schemas are created or updated in the target, then published." },
                                    { n: 6, title: "Assets upserted (if enabled)", desc: "Referenced assets are created or updated, processed, and published in the target." },
                                    { n: 7, title: "Entries upserted", desc: "Entries are created or updated in the target. Fields are merged per-locale to avoid overwriting unselected locale data." },
                                    { n: 8, title: "Entries published", desc: "Entries that were published in source get published in target. Changed (draft-after-publish) status is preserved." },
                                ].map(s => <Step key={s.n} {...s} />)}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border/50">
                        <CardHeader className="pb-3 border-b border-border/50">
                            <CardTitle className="text-xs font-black uppercase tracking-widest text-emerald-400 flex items-center gap-2">
                                <Download className="h-4 w-4" /> Mode 2: Smart Export
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-4">
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Create a <strong className="text-foreground">selective JSON export</strong> from live data.
                                Download and import it on any Contentful account — perfect for cross-account migrations
                                where you don&apos;t have a single CMA token covering both accounts.
                            </p>
                            <div className="space-y-2">
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground/60">How It Works</h5>
                                {[
                                    { n: 1, title: "Select content (same as Live Transfer)", desc: "Pick CTs, locales, and configure remap — the selection phase is identical to Live Transfer." },
                                    { n: 2, title: "Build export on server", desc: "The server fetches live data, resolves all dependencies, filters locale keys, and applies the locale code remapping." },
                                    { n: 3, title: "Download JSON", desc: "You get a clean, import-ready JSON file. Locale codes are already remapped — no manual editing needed." },
                                    { n: 4, title: "Import on the target account", desc: "Use the Restore Backup page on the target account to upload and import this JSON file." },
                                ].map(s => <Step key={s.n} {...s} />)}
                            </div>
                            <div className="flex gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg items-start">
                                <Info className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[11px] text-emerald-400/80">
                                        Smart Export is ideal when source and target are on different Contentful accounts with separate CMA tokens.
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Locale Handling */}
            <Card className="bg-card border-violet-500/10">
                <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-violet-400 flex items-center gap-2">
                        <Globe className="h-4 w-4" /> Locale Handling — Selection, Filtering & Remapping
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div>
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground/60 mb-2">Locale Selection</h5>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                By default, ALL locales are included. When you <strong className="text-foreground">uncheck</strong> a locale,
                                the system removes that locale&apos;s key from every field of every entry and asset before transferring.
                                This is useful when you only need specific languages (e.g., only English and German, but not French).
                            </p>
                        </div>
                        <div>
                            <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground/60 mb-2">Locale Code Remapping</h5>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                Sometimes a source space uses <code className="bg-muted px-1 rounded text-[10px]">en</code> as the default locale,
                                but the target uses <code className="bg-muted px-1 rounded text-[10px]">en-US</code> (and Contentful does not allow
                                renaming locale codes). The <strong className="text-foreground">Locale Remap Modal</strong> lets you define this
                                mapping before export or transfer. The system auto-suggests obvious matches when it detects mismatches.
                            </p>
                        </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 font-mono text-xs space-y-1 text-muted-foreground">
                        <div className="text-violet-400 font-bold mb-2">{'// Remap example'}</div>
                        <div><span className="text-foreground">source:</span> &quot;en&quot; → <span className="text-emerald-400">target: &quot;en-US&quot;</span></div>
                        <div><span className="text-foreground">source:</span> &quot;de&quot; → <span className="text-emerald-400">target: &quot;de-DE&quot;</span></div>
                        <div><span className="text-foreground">source:</span> &quot;ru&quot; → <span className="text-emerald-400">target: &quot;ru&quot;</span> (no change)</div>
                        <div className="pt-2 text-[10px] text-muted-foreground/50">
                            {'// Result: locale keys inside ALL field values are renamed before write/download'}
                        </div>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-4 space-y-3">
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground/60">How locale data is structured in Contentful</h5>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            In Contentful, every field value is an object where each key is a locale code. For example, a &quot;title&quot; field looks like:
                        </p>
                        <div className="bg-muted/30 rounded-lg p-3 font-mono text-[11px] text-muted-foreground">
                            <div>{`{`}</div>
                            <div className="pl-4">{`"title": {`}</div>
                            <div className="pl-8"><span className="text-blue-400">&quot;en-US&quot;</span>: <span className="text-emerald-400">&quot;Welcome&quot;</span>,</div>
                            <div className="pl-8"><span className="text-blue-400">&quot;de-DE&quot;</span>: <span className="text-emerald-400">&quot;Willkommen&quot;</span></div>
                            <div className="pl-4">{`}`}</div>
                            <div>{`}`}</div>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            When Smart Restore filters locales, it removes unwanted locale keys from this object.
                            When it remaps, it renames the keys. The entry itself is <strong className="text-foreground">never duplicated</strong> —
                            it always stays as one object with one entry per locale key.
                        </p>
                    </div>

                    <div className="flex gap-3 p-3 bg-violet-500/5 border border-violet-500/20 rounded-lg items-start">
                        <Info className="h-4 w-4 text-violet-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-violet-500 mb-1">Important: 1 Entry = 1 Object</p>
                            <p className="text-[11px] text-violet-400/80">
                                Smart Restore never creates duplicate entries per locale. It only renames locale keys
                                inside field values. 40 entries with 3 locales stay as 40 entries — not 120.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Safety Backup */}
            <Card className="bg-card border-amber-500/10">
                <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Automatic Safety Backup
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Before <strong className="text-foreground">any write operation</strong> during Live Transfer,
                        the system automatically creates a <strong className="text-foreground">full backup of the TARGET environment</strong>
                        using CMA and saves it to your backups table (visible on the <strong>Backups History</strong> page).
                    </p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        The backup is named <code className="bg-muted px-1 rounded text-[10px]">pre-transfer-{'{env}'}-{'{timestamp}'}.json</code>.
                        If anything goes wrong during or after the transfer, go to <strong>Restore Backup</strong> → select this backup → restore to undo all changes.
                    </p>
                    <div className="flex gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg items-start">
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[11px] text-amber-400/80">
                                The safety backup runs <strong>even if &quot;Clear environment&quot; is checked</strong>.
                                It captures the complete state of the target before clearing.
                                This means you can always roll back even after a full wipe.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Dependency Resolution */}
            <div className="space-y-4">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
                    <Link2 className="h-3 w-3" /> Automatic Dependency Resolution
                </h3>
                <p className="text-xs text-muted-foreground px-2 leading-relaxed">
                    Contentful entries can reference other entries and assets through Link fields and Rich Text embedded blocks.
                    If you transfer an entry without also transferring its references, you get <strong className="text-foreground">broken links</strong> in the target.
                    Smart Restore prevents this with two levels of automatic dependency resolution:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-3 p-5 rounded-xl border border-border/50 bg-card">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Level 1 — Content Type Schema Dependencies</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            If Content Type <code className="bg-muted px-1 rounded">Landing Page</code> has a Reference field that accepts
                            <code className="bg-muted px-1 rounded ml-1">Hero Component</code>, selecting Landing Page automatically adds
                            Hero Component to the transfer set. This dependency is marked with an <strong className="text-amber-400">auto-dep</strong> badge in the UI.
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            The resolution is <strong className="text-foreground">recursive</strong> — if Hero Component itself references
                            <code className="bg-muted px-1 rounded ml-1">Button</code>, that gets added too.
                        </p>
                    </div>
                    <div className="space-y-3 p-5 rounded-xl border border-border/50 bg-card">
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Level 2 — Entry Data Link Resolution</h4>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            When entries are fetched, their field values are scanned recursively for Link objects
                            (<code className="bg-muted px-1 rounded">sys.type: &quot;Link&quot;</code>) and Rich Text embedded entries/assets.
                            All referenced entries and assets are added to the transfer set — ensuring <strong className="text-foreground">zero broken links</strong> in the target environment.
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                            This scan covers: top-level fields, arrays of links, and deeply nested Rich Text embedded blocks.
                        </p>
                    </div>
                </div>
            </div>

            {/* Entry Preview */}
            <Card className="bg-card border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground/80 flex items-center gap-2">
                        <Search className="h-4 w-4 text-violet-500" /> Content Preview & Search
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        After loading the preview, the Content Types list provides a rich interactive view:
                    </p>
                    <div className="space-y-2">
                        <div className="flex gap-3 items-start">
                            <span className="text-violet-400 text-xs font-bold mt-0.5 shrink-0">•</span>
                            <span className="text-xs text-foreground/70"><strong className="text-foreground">Search & Filter</strong> — type in the search bar to filter Content Types by name or ID. Useful when you have dozens of Content Types.</span>
                        </div>
                        <div className="flex gap-3 items-start">
                            <span className="text-violet-400 text-xs font-bold mt-0.5 shrink-0">•</span>
                            <span className="text-xs text-foreground/70"><strong className="text-foreground">Entry List</strong> — expand any Content Type to see its entries in a Contentful-style table (Name, Content Type, Updated, Status).</span>
                        </div>
                        <div className="flex gap-3 items-start">
                            <span className="text-violet-400 text-xs font-bold mt-0.5 shrink-0">•</span>
                            <span className="text-xs text-foreground/70"><strong className="text-foreground">Nested Entry Detail</strong> — click any entry row to expand it and see all field values. The default locale is shown first, followed by other locales.</span>
                        </div>
                        <div className="flex gap-3 items-start">
                            <span className="text-violet-400 text-xs font-bold mt-0.5 shrink-0">•</span>
                            <span className="text-xs text-foreground/70"><strong className="text-foreground">Rich Rendering</strong> — images show thumbnails, references show resolved titles, Rich Text shows extracted plain text, and entry statuses (Published / Draft / Changed) are color-coded.</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Transfer Options */}
            <Card className="bg-card border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground/80 flex items-center gap-2">
                        <Settings2 className="h-4 w-4 text-violet-500" /> Transfer Options Explained
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="space-y-4">
                        <div className="p-4 rounded-lg border border-border/50 bg-card">
                            <div className="flex items-center gap-2 mb-2">
                                <Trash2 className="h-3.5 w-3.5 text-red-400" />
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-red-400">Clear Environment Before Transfer</h5>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                When enabled, ALL existing entries, assets, and content types in the target environment are <strong className="text-red-400">permanently deleted</strong> before the transfer begins.
                                Use this when you want an exact mirror of the source — a clean slate.
                                A safety backup is always created first, so you can roll back.
                            </p>
                        </div>

                        <div className="p-4 rounded-lg border border-border/50 bg-card">
                            <div className="flex items-center gap-2 mb-2">
                                <FileJson className="h-3.5 w-3.5 text-blue-400" />
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-blue-400">Include Assets</h5>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                                When enabled, images, documents, and other media files referenced by the selected entries are also transferred.
                                Assets are upserted (created or updated), processed for all locales, and published if they were published in the source.
                            </p>
                        </div>

                        <div className="p-4 rounded-lg border border-border/50 bg-card">
                            <div className="flex items-center gap-2 mb-2">
                                <RefreshCw className="h-3.5 w-3.5 text-emerald-400" />
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Merge Mode</h5>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed mb-2">
                                Controls how existing entries are handled in the target:
                            </p>
                            <div className="space-y-1 pl-3">
                                <p className="text-xs text-foreground/70">
                                    <strong className="text-foreground">Upsert</strong> (default) — If an entry exists, update its fields. If it doesn&apos;t exist, create it. This is the safest option for syncing environments.
                                </p>
                                <p className="text-xs text-foreground/70">
                                    <strong className="text-foreground">Skip Existing</strong> — Only create entries that don&apos;t already exist in the target. Existing entries are left untouched. Useful for seeding new content without overwriting manual changes.
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Real-Time Logs */}
            <Card className="bg-card border-border/50">
                <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-foreground/80 flex items-center gap-2">
                        <Eye className="h-4 w-4 text-violet-500" /> Real-Time Progress Logs
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        During a Live Transfer, the system streams real-time progress logs to your screen using Server-Sent Events (SSE).
                        You can see exactly what&apos;s happening at every moment:
                    </p>
                    <div className="bg-muted/30 rounded-lg p-4 font-mono text-[11px] text-muted-foreground space-y-1">
                        <div>🛡️  Creating safety backup of target: space123/staging...</div>
                        <div>✅  Safety backup saved: &quot;pre-transfer-staging-2026-03-02.json&quot;</div>
                        <div>📦  Fetching content types from source...</div>
                        <div>{'    '}Found 12 content types</div>
                        <div>{'    '}Resolved 14 CTs (including dependencies)</div>
                        <div>📄  Fetching entries for 14 content types...</div>
                        <div>{'    '}Total entries fetched: 156</div>
                        <div>🔗  Resolving entry/asset dependencies...</div>
                        <div>{'    '}Resolved: 156 entries, 23 assets</div>
                        <div>📋  Upserting 14 content types...</div>
                        <div>{'    '}Content types done</div>
                        <div>📝  Upserting 156 entries...</div>
                        <div>{'    '}10/156 entries transferred...</div>
                        <div>{'    '}...</div>
                        <div>🚀  Publishing 120 entries...</div>
                        <div>{'    '}Entries: 156 ok, 0 failed</div>
                        <div>✅  Transfer complete!</div>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        Warnings (⚠️) are shown for individual failures but don&apos;t stop the overall transfer.
                        If a fatal error occurs, the stream shows ❌ and the transfer stops.
                    </p>
                </CardContent>
            </Card>

            {/* Useful Links */}
            <Card className="bg-card border-violet-500/10">
                <CardHeader className="pb-3 border-b border-border/50">
                    <CardTitle className="text-xs font-black uppercase tracking-widest text-violet-400 flex items-center gap-2">
                        <ExternalLink className="h-4 w-4" /> Useful Links
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">
                        These official Contentful resources explain concepts used by Smart Restore:
                    </p>
                    <div className="space-y-2">
                        {[
                            {
                                label: "Contentful Content Management API (CMA) Reference",
                                url: "https://www.contentful.com/developers/docs/references/content-management-api/",
                                desc: "Full API reference for all CMA endpoints used by Smart Restore."
                            },
                            {
                                label: "Authentication & Personal Access Tokens",
                                url: "https://www.contentful.com/developers/docs/references/authentication/",
                                desc: "How to create and manage CMA tokens for API access."
                            },
                            {
                                label: "Contentful Data Model — Content Types & Entries",
                                url: "https://www.contentful.com/developers/docs/concepts/data-model/",
                                desc: "Understanding Content Types, Entries, Assets, and Locales."
                            },
                            {
                                label: "Localization in Contentful",
                                url: "https://www.contentful.com/developers/docs/concepts/locales/",
                                desc: "How locales work in Contentful — default locale, fallback chains, and field-level localization."
                            },
                            {
                                label: "contentful-management.js SDK (GitHub)",
                                url: "https://github.com/contentful/contentful-management.js",
                                desc: "The official JavaScript SDK used internally by Smart Restore for CMA operations."
                            },
                        ].map((link) => (
                            <a
                                key={link.label}
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex gap-3 p-3 rounded-lg bg-card border border-border/50 hover:border-violet-500/20 transition-all group"
                            >
                                <ExternalLink className="h-3.5 w-3.5 text-violet-500 mt-0.5 shrink-0 opacity-40 group-hover:opacity-100 transition-opacity" />
                                <div>
                                    <h5 className="text-[10px] font-black uppercase tracking-wider text-foreground/80 mb-0.5 group-hover:text-violet-400 transition-colors">{link.label}</h5>
                                    <p className="text-[11px] text-muted-foreground">{link.desc}</p>
                                </div>
                            </a>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Related Documentation */}
            <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2">Related Documentation</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {[
                        { label: "Restore Backup", desc: "Use restored JSON backup after Smart Export", tab: "restore-backup" },
                        { label: "Create Backup", desc: "Manual backup before any risky operation", tab: "create-backup" },
                        { label: "Backups History", desc: "Find auto-created safety backups here", tab: "backups" },
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

export default SmartRestoreDoc;
