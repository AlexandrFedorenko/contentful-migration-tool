import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert, AlertTriangle, Info } from "lucide-react";
import {
    History, Database, CloudUpload, FileJson, Upload,
    CheckCircle2, Terminal, MapPin, Flame,
    Zap, Globe, ExternalLink, ArrowRight, Package, FolderOpen, Hash
} from "lucide-react";
import { cn } from "@/lib/utils";

const StepBlock = ({ number, title, children, color = "primary", last = false }: {
    number: number; title: string; children: React.ReactNode;
    color?: "primary" | "rose" | "amber" | "green"; last?: boolean;
}) => {
    const colorMap = {
        primary: "bg-primary/5 border-primary/20 text-primary group-hover:bg-primary group-hover:text-white",
        rose: "bg-rose-500/5 border-rose-500/20 text-rose-500 group-hover:bg-rose-500 group-hover:text-white",
        amber: "bg-amber-500/5 border-amber-500/20 text-amber-500 group-hover:bg-amber-500 group-hover:text-white",
        green: "bg-green-500/5 border-green-500/20 text-green-500 group-hover:bg-green-500 group-hover:text-white",
    };
    return (
        <div className={cn("flex gap-6 group relative", !last && "pb-8")}>
            <div className="flex flex-col items-center shrink-0">
                <div className={cn("h-10 w-10 rounded-xl border flex items-center justify-center text-xs font-black transition-all shadow-lg", colorMap[color])}>{number}</div>
                {!last && <div className="w-[1px] flex-1 bg-border/50 mt-2" />}
            </div>
            <div className="pt-1 flex-1">
                <h4 className="text-sm font-black uppercase tracking-tight text-foreground mb-2">{title}</h4>
                <div className="text-[12px] font-medium text-muted-foreground leading-relaxed">{children}</div>
            </div>
        </div>
    );
};

const DocBadge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "rose" | "amber" | "green" | "muted" }) => {
    const v = { default: "bg-primary/10 text-primary border-primary/20", rose: "bg-rose-500/10 text-rose-400 border-rose-500/20", amber: "bg-amber-500/10 text-amber-400 border-amber-500/20", green: "bg-green-500/10 text-green-400 border-green-500/20", muted: "bg-muted/30 text-muted-foreground border-border/50" };
    return <span className={cn("inline-flex items-center px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border", v[variant])}>{children}</span>;
};

const CodeLine = ({ children }: { children: React.ReactNode }) => (
    <code className="block w-full text-[11px] font-mono text-green-300 bg-muted/40 px-4 py-2 rounded leading-loose whitespace-pre-wrap break-all">{children}</code>
);

const CliFlag = ({ flag, description, required = false }: { flag: string; description: string; required?: boolean }) => (
    <div className="flex gap-4 py-3 border-b border-border/50 last:border-0">
        <div className="shrink-0 w-56">
            <code className="text-[11px] font-mono text-primary">{flag}</code>
            {required && <span className="ml-2 text-[8px] font-black uppercase tracking-widest text-rose-400">required</span>}
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">{description}</p>
    </div>
);

const RestoreBackupDoc: React.FC = () => (
    <div className="space-y-14">

        <header className="space-y-3 border-l-4 border-rose-500 pl-6">
            <h2 className="text-3xl font-black uppercase tracking-tight">Restore Backup</h2>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Restoring Contentful environment content from a backup</p>
            <p className="text-sm text-foreground/70 leading-relaxed max-w-3xl">
                The <strong className="text-rose-400">Restore Backup</strong> page lets you bring back content (entries, content types, locales, and media files) from a previously saved backup into a selected Contentful environment. You can use cloud-hosted backups stored on the server or upload local files directly from your computer.
            </p>
        </header>

        <div className="flex gap-3 p-4 bg-rose-500/5 border border-rose-500/20 rounded-lg">
            <ShieldAlert className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-rose-400 mb-1">⚠ Destructive Operation</p>
                <p className="text-[12px] text-rose-300/80 leading-relaxed">
                    Restoring a backup <strong>overwrites</strong> existing content in the target environment. If <strong className="text-rose-400">Full Environment Purge</strong> is enabled, all data will be deleted before the restore begins. Always back up the target environment first.
                </p>
            </div>
        </div>

        {/* Step-by-step */}
        <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" />Step-by-step: How to run a restore
            </h3>
            <Card className="bg-card border-border/50 shadow-xl overflow-hidden">
                <CardContent className="p-8 space-y-0">
                    <StepBlock number={1} title="Select a Space">
                        In the top-left card (<strong>Target Space</strong>), choose the Contentful space you want to restore content into. If a space is already selected on the main dashboard, it will be pre-filled automatically.
                    </StepBlock>
                    <StepBlock number={2} title="Choose the Target Environment">
                        In the right card (<strong>Target Environment</strong>), pick the environment to restore into — for example <code className="text-primary bg-primary/10 px-1 rounded">master</code>, <code className="text-primary bg-primary/10 px-1 rounded">staging</code>, or <code className="text-primary bg-primary/10 px-1 rounded">dev</code>.
                        <div className="mt-3 flex gap-2 p-2 bg-amber-500/5 border border-amber-500/20 rounded-md">
                            <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[11px] text-amber-300/80">Never restore directly into <strong>production / master</strong> without testing on staging first.</p>
                        </div>
                    </StepBlock>
                    <StepBlock number={3} title="Configure Restore Options">
                        Below the environment selector you will find two checkboxes:
                        <div className="mt-3 space-y-3">
                            <div className="flex gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1">Full Environment Purge</p>
                                    <p className="text-[11px] text-muted-foreground">When enabled, <strong>all</strong> existing entries, assets, and content types in the target environment are deleted before the restore begins. Use this when you want a clean, exact copy of the backup with no leftover data mixed in.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                                <Upload className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[11px] font-black text-primary uppercase tracking-wider mb-1">Include Asset Restoration</p>
                                    <p className="text-[11px] text-muted-foreground">Enables restoration of media files (images, videos, documents). If the backup was created with a ZIP archive of assets, they will be pulled from the cloud automatically. Otherwise, upload a ZIP manually via the Local JSON + ZIP tab.</p>
                                </div>
                            </div>
                        </div>
                    </StepBlock>
                    <StepBlock number={4} title="Select the Backup Source (tabs)">
                        Below the options panel, three tabs appear — choose the one that matches how your backup is stored:
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-3 gap-3">
                            {[
                                { icon: <History className="h-5 w-5 text-indigo-400" />, label: "Cloud Vault", badge: "Recommended", bv: "green" as const, desc: "All backups saved in the system. Click any row to select it." },
                                { icon: <FileJson className="h-5 w-5 text-primary" />, label: "Local JSON", badge: "No media", bv: "muted" as const, desc: "Upload a .json backup file from your computer. Content structure only." },
                                { icon: <Package className="h-5 w-5 text-green-400" />, label: "Local JSON + ZIP", badge: "With media", bv: "green" as const, desc: "Upload a JSON file and a ZIP archive with media files simultaneously." },
                            ].map((tab) => (
                                <div key={tab.label} className="p-4 bg-card border border-border/50 rounded-xl space-y-2">
                                    <div className="flex items-center gap-2">{tab.icon}<span className="text-[11px] font-black uppercase tracking-wider">{tab.label}</span><DocBadge variant={tab.bv}>{tab.badge}</DocBadge></div>
                                    <p className="text-[10px] text-muted-foreground leading-relaxed">{tab.desc}</p>
                                </div>
                            ))}
                        </div>
                    </StepBlock>
                    <StepBlock number={5} title="Click «EXECUTE RESTORATION»" last>
                        Once everything is selected, the <strong>EXECUTE RESTORATION</strong> button becomes active. Click it to start. A spinner shows while the restore runs. Live logs appear in <em>Migration Logs</em> below. When finished, a result modal shows success (green) or failure (red) with a detailed error message.
                    </StepBlock>
                </CardContent>
            </Card>
        </section>

        {/* Modes in depth */}
        <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Database className="h-3 w-3 text-primary" />Backup source modes — in depth</h3>
            <div className="space-y-4">
                <Card className="bg-card border-border/50 overflow-hidden">
                    <CardHeader className="bg-indigo-500/5 border-b border-border/50 py-4">
                        <div className="flex items-center gap-3"><History className="h-5 w-5 text-indigo-400" /><CardTitle className="text-sm font-black uppercase tracking-widest">Cloud Vault — server-hosted backups</CardTitle><DocBadge variant="green">Recommended</DocBadge></div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                        <p className="text-[12px] text-foreground/80 leading-relaxed">Shows every backup saved automatically by the system. Each row contains the date, name, and whether a ZIP of assets is available alongside the JSON.</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">How to use:</p>
                        <ol className="space-y-1.5 list-decimal list-inside text-[11px] text-muted-foreground">
                            <li>Open the <strong className="text-foreground/80">Cloud Vault</strong> tab.</li>
                            <li>Find the backup you need — use date and name columns to identify it.</li>
                            <li>Click the row to select it (blue highlight border appears).</li>
                            <li>If the backup has a ZIP archive, a <CheckCircle2 className="inline h-3 w-3 text-green-400" /> icon appears in the Assets column.</li>
                            <li>Enable <em>Include Asset Restoration</em> — the system locates the ZIP automatically and shows <em>&quot;Cloud archive detected &amp; synchronized&quot;</em>.</li>
                        </ol>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border/50 overflow-hidden">
                    <CardHeader className="bg-primary/5 border-b border-border/50 py-4">
                        <div className="flex items-center gap-3"><FileJson className="h-5 w-5 text-primary" /><CardTitle className="text-sm font-black uppercase tracking-widest">Local JSON — upload a JSON file from your computer</CardTitle></div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                        <p className="text-[12px] text-foreground/80 leading-relaxed">Use when you have a <code className="text-primary bg-primary/10 px-1 rounded">.json</code> backup file on your machine. Restores content structure only — no media files.</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">How to use:</p>
                        <ol className="space-y-1.5 list-decimal list-inside text-[11px] text-muted-foreground">
                            <li>Open the <strong className="text-foreground/80">Local JSON</strong> tab.</li>
                            <li>Click <strong className="text-foreground/80">BROWSE JSON FILE</strong>.</li>
                            <li>Select a <code className="text-primary bg-primary/10 px-1 rounded">.json</code> file on your computer.</li>
                            <li>The file name and size appear below (e.g., <em>FILE READY: 2.34 MB</em>).</li>
                            <li>Click <strong className="text-foreground/80">EXECUTE RESTORATION</strong>.</li>
                        </ol>
                        <div className="flex gap-2 p-2 bg-muted/20 border border-border/50 rounded-md">
                            <Info className="h-3 w-3 text-muted-foreground shrink-0 mt-0.5" />
                            <p className="text-[10px] text-muted-foreground">Only <code>.json</code> files are accepted. The file must be a backup created by this tool or a compatible Contentful export.</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-card border-border/50 overflow-hidden">
                    <CardHeader className="bg-green-500/5 border-b border-border/50 py-4">
                        <div className="flex items-center gap-3"><Package className="h-5 w-5 text-green-400" /><CardTitle className="text-sm font-black uppercase tracking-widest">Local JSON + ZIP — content with media files</CardTitle></div>
                    </CardHeader>
                    <CardContent className="p-6 space-y-3">
                        <p className="text-[12px] text-foreground/80 leading-relaxed">Full restore — a JSON file for content <strong>plus</strong> a ZIP archive with all media files (images, videos, documents).</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">ZIP requirements:</p>
                        <ul className="space-y-1.5 text-[11px] text-muted-foreground">
                            <li className="flex gap-2"><span className="text-green-400 shrink-0">▸</span>The archive must contain an <code className="text-green-400 bg-green-500/10 px-1 rounded">assets/</code> folder at its root.</li>
                            <li className="flex gap-2"><span className="text-green-400 shrink-0">▸</span>Maximum ZIP size is <strong className="text-foreground/80">1 GB</strong>. Larger files will be rejected by the server.</li>
                            <li className="flex gap-2"><span className="text-green-400 shrink-0">▸</span>Files are processed in-memory and deleted from the server immediately after the restore completes.</li>
                        </ul>
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mt-4">How to use:</p>
                        <ol className="space-y-1.5 list-decimal list-inside text-[11px] text-muted-foreground">
                            <li>Open the <strong className="text-foreground/80">Local JSON + ZIP</strong> tab.</li>
                            <li>In block <strong className="text-foreground/80">1. JSON Backup</strong>, click <em>SELECT JSON</em> and choose your backup file.</li>
                            <li>In block <strong className="text-foreground/80">2. Assets ZIP</strong>, click <em>SELECT ZIP</em> and choose your media archive.</li>
                            <li>Both blocks must show a green <CheckCircle2 className="inline h-3 w-3 text-green-400" /> icon with their file size.</li>
                            <li>Click <strong className="text-foreground/80">EXECUTE RESTORATION</strong>.</li>
                        </ol>
                        <div className="flex gap-2 p-2 bg-amber-500/5 border border-amber-500/20 rounded-md">
                            <AlertTriangle className="h-3 w-3 text-amber-400 shrink-0 mt-0.5" />
                            <p className="text-[10px] text-amber-300/80">The start button stays disabled until <strong>both</strong> files are selected.</p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </section>

        {/* Locale Mapping */}
        <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Globe className="h-3 w-3 text-primary" />Locale Mapping</h3>
            <Card className="bg-card border-border/50 shadow-xl overflow-hidden">
                <CardHeader className="bg-muted/20 border-b border-border/50 py-4"><div className="flex items-center gap-3"><MapPin className="h-5 w-5 text-primary" /><CardTitle className="text-sm font-black uppercase tracking-widest">What it is and when it appears</CardTitle></div></CardHeader>
                <CardContent className="p-6 space-y-4">
                    <p className="text-[12px] text-foreground/80 leading-relaxed">Before starting, the system compares the <strong>locales in the backup</strong> (e.g. <code className="text-primary bg-primary/10 px-1 rounded">en-US</code>) with the locales in the target environment (e.g. <code className="text-primary bg-primary/10 px-1 rounded">en</code>). If they <strong>do not match</strong>, a locale mapping modal opens automatically.</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">How to work with the modal:</p>
                    <ol className="space-y-2 list-decimal list-inside text-[11px] text-muted-foreground">
                        <li>The left column shows locales from the backup (source).</li>
                        <li>The right column lists available locales in the target environment.</li>
                        <li>For each source locale, select the matching target locale from the dropdown.</li>
                        <li>Click <strong className="text-foreground/80">Confirm &amp; Restore</strong> — the system applies the mapping and starts the restore.</li>
                        <li>Click <strong className="text-foreground/80">Cancel</strong> to abort without restoring.</li>
                    </ol>
                    <div className="flex gap-2 p-2 bg-primary/5 border border-primary/20 rounded-md">
                        <Info className="h-3 w-3 text-primary shrink-0 mt-0.5" />
                        <p className="text-[11px] text-primary/80">If locales already match, the modal never appears and the restore starts immediately. For locally uploaded JSON files, locale validation is skipped entirely.</p>
                    </div>
                </CardContent>
            </Card>
        </section>

        {/* Under the hood */}
        <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Flame className="h-3 w-3 text-rose-400" />What happens behind the scenes</h3>
            <Card className="bg-card border-border/50 shadow-xl"><CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-muted-foreground">
                    {[
                        { s: "1", l: "Authentication", d: "The server verifies your Contentful token stored in your profile." },
                        { s: "2", l: "Purge (if enabled)", d: "All existing Entries, Assets and Content Types are deleted before the restore, respecting API rate limits." },
                        { s: "3", l: "Load content", d: "The backup is fetched from the cloud by backupId, or read from the uploaded JSON file." },
                        { s: "4", l: "Locale transform", d: "Locales are remapped per the selected mapping. Incompatible locales are filtered out automatically." },
                        { s: "5", l: "CLI import", d: "Contentful CLI executes: contentful space import --content-file ..." },
                        { s: "6", l: "Cleanup", d: "All temporary files (JSON, ZIP, extracted assets) are deleted from the server after the restore finishes." },
                    ].map((item) => (
                        <div key={item.s} className="flex gap-3">
                            <div className="h-6 w-6 rounded bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-[9px] font-black shrink-0">{item.s}</div>
                            <div><p className="font-black text-foreground/80 uppercase tracking-wide text-[10px]">{item.l}</p><p className="mt-0.5">{item.d}</p></div>
                        </div>
                    ))}
                </div>
            </CardContent></Card>
        </section>

        {/* Errors */}
        <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><ShieldAlert className="h-3 w-3 text-rose-400" />Errors and how they are handled</h3>
            <Card className="bg-card/40 border-rose-500/10 shadow-xl"><CardContent className="p-6 space-y-3">
                {[
                    { t: "Result modal", d: "A modal always opens when the restore finishes — green for success, red for failure. Shows the backup name, target environment, and any error message." },
                    { t: "Detailed error log", d: "If the CLI import fails, a button appears to view the full log with the exact Contentful error. It can be minimised to a corner notification labelled «Restore Interrupted» and reopened at any time." },
                    { t: "Migration Logs panel", d: "At the bottom of the page, every step is logged in real time: initialisation, progress, completion, or error. Useful for diagnosing exactly what went wrong." },
                ].map((item) => (
                    <div key={item.t} className="flex gap-3 p-3 bg-muted/20 rounded-lg border border-border/50">
                        <CloudUpload className="h-4 w-4 text-rose-400 shrink-0 mt-0.5" />
                        <div><p className="text-[11px] font-black text-foreground/80 uppercase tracking-wide mb-1">{item.t}</p><p className="text-[11px] text-muted-foreground leading-relaxed">{item.d}</p></div>
                    </div>
                ))}
            </CardContent></Card>
        </section>

        {/* CLI */}
        <section className="space-y-6" id="restore-cli">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2"><Terminal className="h-3 w-3 text-green-400" />Running a restore via the CLI (manual method)</h3>
            <Card className="bg-muted/30 border-green-500/10 shadow-2xl overflow-hidden">
                <CardHeader className="bg-green-500/5 border-b border-green-500/10 py-4">
                    <div className="flex items-center gap-3"><Terminal className="h-5 w-5 text-green-400" /><CardTitle className="text-sm font-black uppercase tracking-widest text-green-300">Contentful CLI — contentful space import</CardTitle></div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prerequisites</p>
                        <div className="space-y-1.5 text-[11px] text-muted-foreground">
                            <p className="flex gap-2"><span className="text-green-400 shrink-0">▸</span>Node.js ≥ 18 installed. Check: <code className="text-green-300 bg-muted/40 px-1 rounded">node -v</code></p>
                            <p className="flex gap-2"><span className="text-green-400 shrink-0">▸</span>Contentful CLI: <code className="text-green-300 bg-muted/40 px-1 rounded">npm install -g contentful-cli</code></p>
                            <p className="flex gap-2"><span className="text-green-400 shrink-0">▸</span>Personal Access Token (PAT) from <a href="https://app.contentful.com/account/profile/cma_tokens" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-1">Settings → API Keys <ExternalLink className="h-3 w-3" /></a></p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><FolderOpen className="h-3 w-3" />Where to place the backup file</p>
                        <CodeLine>{`# Recommended folder structure\n/projects/contentful-restore/\n  ├── backup-2024-01-15.json\n  └── assets.zip          ← optional, for media files`}</CodeLine>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Hash className="h-3 w-3" />Base command</p>
                        <CodeLine>{`contentful space import \\\n  --space-id <YOUR_SPACE_ID> \\\n  --environment-id <TARGET_ENV> \\\n  --management-token <YOUR_PAT> \\\n  --content-file ./backup.json`}</CodeLine>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Zap className="h-3 w-3" />All available flags</p>
                        <Card className="bg-muted/20 border-green-500/10 overflow-hidden"><CardContent className="p-4 divide-y divide-border/50">
                            <CliFlag flag="--space-id <ID>" description="Your Contentful space ID. Find it in the URL: app.contentful.com/spaces/<SPACE_ID>" required />
                            <CliFlag flag="--environment-id <ENV>" description="ID of the target environment (e.g. master, staging, dev). Defaults to master." required />
                            <CliFlag flag="--management-token <PAT>" description="Personal Access Token with write permissions. Generate at: app.contentful.com/account/profile/cma_tokens" required />
                            <CliFlag flag="--content-file <PATH>" description="Path to the JSON backup file. Example: ./backup.json" required />
                            <CliFlag flag="--content-model-only" description="Import only Content Types (structure), not entries or assets. Useful for setting up a fresh environment." />
                            <CliFlag flag="--skip-content-model" description="Skip Content Type import; restore only entries. Use when the content model already exists in the target." />
                            <CliFlag flag="--skip-locales" description="Do not import locales from the backup. Existing target locales remain unchanged." />
                            <CliFlag flag="--skip-webhook-creation" description="Do not restore webhooks. Recommended for staging/dev environments." />
                            <CliFlag flag="--error-log-file <PATH>" description="Path to a file where import errors will be saved as JSON. Example: ./restore-errors.json" />
                            <CliFlag flag="--upload-timeout <MS>" description="Asset upload timeout in milliseconds. Default: 30000 (30 s). Increase for large media sets." />
                            <CliFlag flag="--publish" description="Automatically publish all imported entries and assets. Without this flag they remain as Drafts." />
                            <CliFlag flag="--rate-limit <N>" description="API requests per second (default: 7). Reduce to 3–5 if you encounter 429 rate-limit errors." />
                        </CardContent></Card>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Usage examples</p>
                        <div>
                            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Full restore to staging with auto-publish:</p>
                            <CodeLine>{`contentful space import \\\n  --space-id abc123xyz \\\n  --environment-id staging \\\n  --management-token CFPAT-xxxxxxxxxxxx \\\n  --content-file ./backup-2024-01-15.json \\\n  --publish`}</CodeLine>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Content model only — no entries:</p>
                            <CodeLine>{`contentful space import \\\n  --space-id abc123xyz \\\n  --environment-id dev \\\n  --management-token CFPAT-xxxxxxxxxxxx \\\n  --content-file ./backup.json \\\n  --content-model-only`}</CodeLine>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">With error logging and a lower rate limit:</p>
                            <CodeLine>{`contentful space import \\\n  --space-id abc123xyz \\\n  --environment-id master \\\n  --management-token CFPAT-xxxxxxxxxxxx \\\n  --content-file ./backup.json \\\n  --error-log-file ./restore-errors.json \\\n  --rate-limit 5`}</CodeLine>
                        </div>
                    </div>

                    <div className="flex gap-2 p-3 bg-primary/5 border border-primary/20 rounded-md">
                        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Tips</p>
                            <div className="text-[11px] text-foreground/70 leading-relaxed space-y-1">
                                <p>• Always test on <strong>staging</strong> before touching <strong>master / production</strong>.</p>
                                <p>• Getting 429 errors? Add <code className="text-primary bg-primary/10 px-1 rounded">--rate-limit 3</code>.</p>
                                <p>• See all flags: <code className="text-primary bg-primary/10 px-1 rounded">contentful space import --help</code></p>
                            </div>
                        </div>
                    </div>

                    <div className="pt-2 flex flex-wrap gap-3">
                        <a href="https://www.contentful.com/developers/docs/tutorials/cli/import-and-export/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-green-500/10 border border-green-500/20 text-green-300 text-[10px] font-black uppercase tracking-widest hover:bg-green-500/20 transition-all">
                            <ExternalLink className="h-3.5 w-3.5" />Official Contentful CLI Docs — Import &amp; Export<ArrowRight className="h-3 w-3" />
                        </a>
                        <a href="https://github.com/contentful/contentful-cli" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-muted/20 border border-border/50 text-muted-foreground text-[10px] font-black uppercase tracking-widest hover:bg-muted/30 transition-all">
                            <ExternalLink className="h-3.5 w-3.5" />GitHub: contentful/contentful-cli
                        </a>
                    </div>
                </CardContent>
            </Card>
        </section>
    </div>
);

export default RestoreBackupDoc;
