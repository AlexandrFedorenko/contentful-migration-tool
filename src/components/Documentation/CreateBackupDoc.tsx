import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    ShieldCheck, CloudDownload, FileArchive, Info, Zap,
    History, AlertTriangle, Terminal, ExternalLink, ArrowRight,
    CheckCircle2, Layers, FolderOpen, Hash, Flame, HardDrive
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const StepBlock = ({ number, title, children, color = "primary", last = false }: {
    number: number; title: string; children: React.ReactNode;
    color?: "primary" | "amber" | "green" | "rose"; last?: boolean;
}) => {
    const c = {
        primary: "bg-primary/5 border-primary/20 text-primary group-hover:bg-primary group-hover:text-white",
        amber: "bg-amber-500/5 border-amber-500/20 text-amber-500 group-hover:bg-amber-500 group-hover:text-white",
        green: "bg-green-500/5 border-green-500/20 text-green-500 group-hover:bg-green-500 group-hover:text-white",
        rose: "bg-rose-500/5 border-rose-500/20 text-rose-500 group-hover:bg-rose-500 group-hover:text-white",
    };
    return (
        <div className={cn("flex gap-6 group relative", !last && "pb-8")}>
            <div className="flex flex-col items-center shrink-0">
                <div className={cn("h-10 w-10 rounded-xl border flex items-center justify-center text-xs font-black transition-all shadow-lg", c[color])}>{number}</div>
                {!last && <div className="w-[1px] flex-1 bg-border/50 mt-2" />}
            </div>
            <div className="pt-1 flex-1">
                <h4 className="text-sm font-black uppercase tracking-tight text-foreground mb-2">{title}</h4>
                <div className="text-[12px] font-medium text-muted-foreground leading-relaxed">{children}</div>
            </div>
        </div>
    );
};

const DocBadge = ({ children, variant = "default" }: { children: React.ReactNode; variant?: "default" | "amber" | "green" | "muted" }) => {
    const v = { default: "bg-primary/10 text-primary border-primary/20", amber: "bg-amber-500/10 text-amber-400 border-amber-500/20", green: "bg-green-500/10 text-green-400 border-green-500/20", muted: "bg-muted/30 text-muted-foreground border-border/50" };
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

// ─── Component ────────────────────────────────────────────────────────────────

const CreateBackupDoc: React.FC = () => (
    <div className="space-y-14">

        {/* Header */}
        <header className="space-y-3 border-l-4 border-primary pl-6">
            <h2 className="text-3xl font-black uppercase tracking-tight">Create Backup</h2>
            <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Capturing a point-in-time snapshot of your Contentful environment</p>
            <p className="text-sm text-foreground/70 leading-relaxed max-w-3xl">
                The <strong className="text-primary">Create Backup</strong> page lets you export the full content of a Contentful environment — entries, content types, locales, and optionally asset files — into a JSON backup (and an optional ZIP archive). Backups are stored on the server and can later be restored to the same or any other environment.
            </p>
        </header>

        {/* What gets backed up */}
        <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Layers className="h-3 w-3 text-primary" />What is included in a backup
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {["Content Types", "Entry Registry", "Locales", "Tags", "UI Extensions", "Asset Metadata"].map((item) => (
                    <div key={item} className="px-3 py-3 rounded-lg bg-primary/5 border border-primary/10 text-[9px] font-black uppercase tracking-widest text-foreground/70 flex items-center justify-center text-center">{item}</div>
                ))}
            </div>
            <p className="text-[11px] text-muted-foreground italic px-1">
                * Asset <em>binary files</em> (images, documents, videos) are not included by default — only their metadata and CDN URLs are saved. To include binary files you must enable the <strong className="text-foreground/80">Download Assets Archive</strong> option (see below).
            </p>
        </section>

        {/* Step-by-step */}
        <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Zap className="h-3 w-3 text-primary" />Step-by-step: How to create a backup
            </h3>
            <Card className={cn("bg-card/10 border-border/50 hover:bg-card/30", "shadow-xl overflow-hidden")}>
                <CardContent className="p-8 space-y-0">
                    <StepBlock number={1} title="Select a Space">
                        In the left panel (<strong>Target Space</strong>), choose the Contentful space you want to back up. If a space is already selected on the main dashboard, it will be pre-filled automatically.
                    </StepBlock>

                    <StepBlock number={2} title="Choose the Source Environment">
                        In the card on the right, open the <strong>Source Environment</strong> dropdown and select the environment you want to snapshot — for example <code className="text-primary bg-primary/10 px-1 rounded">master</code>, <code className="text-primary bg-primary/10 px-1 rounded">staging</code>, or any other environment available in the space.
                    </StepBlock>

                    <StepBlock number={3} title="Configure Backup Options">
                        Three checkboxes control what content is included:
                        <div className="mt-3 space-y-3">
                            <div className="flex gap-3 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[11px] font-black text-primary uppercase tracking-wider mb-1">Include Draft Entities <DocBadge>On by default</DocBadge></p>
                                    <p className="text-[11px] text-muted-foreground">Includes entries that have been saved but not yet published. Recommended to keep on — drafts can contain important unreleased content that would otherwise be lost.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 p-3 bg-primary/5 border border-primary/10 rounded-lg">
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[11px] font-black text-primary uppercase tracking-wider mb-1">Include Archived Entities <DocBadge>On by default</DocBadge></p>
                                    <p className="text-[11px] text-muted-foreground">Includes entries that have been archived in Contentful. Useful for disaster recovery — archived content can be retrieved later if needed.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                <FileArchive className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1">Download Assets Archive <DocBadge variant="amber">Optional</DocBadge></p>
                                    <p className="text-[11px] text-muted-foreground">When enabled, all media files (images, videos, PDFs) are downloaded and packaged into a separate ZIP archive. A confirmation dialog will appear explaining storage limits before proceeding.</p>
                                </div>
                            </div>
                        </div>
                    </StepBlock>

                    <StepBlock number={4} title="Choose an Asset Download Mode (if assets are enabled)" color="amber">
                        When <em>Download Assets Archive</em> is checked, two download modes become available:
                        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div className="p-3 bg-primary/5 border border-primary/10 rounded-lg">
                                <p className="text-[11px] font-black text-primary uppercase tracking-wider mb-1">Browser Download <DocBadge variant="green">Recommended</DocBadge></p>
                                <p className="text-[10px] text-muted-foreground">Assets are fetched directly to your browser and saved to your computer as a ZIP file. No server storage limit applies. Progress is shown on the button.</p>
                            </div>
                            <div className="p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg">
                                <p className="text-[11px] font-black text-amber-400 uppercase tracking-wider mb-1">Server Download</p>
                                <p className="text-[10px] text-muted-foreground">Assets are zipped on the server first, then sent to your browser. Limited to 1 GB. The archive is deleted from the server immediately after download.</p>
                            </div>
                        </div>
                    </StepBlock>

                    <StepBlock number={5} title="Click «START ENVIRONMENT BACKUP»" last>
                        Once a source environment is selected, the <strong>START ENVIRONMENT BACKUP</strong> button activates. Click it to begin. A spinner shows on the button while the backup is running. Progress is shown in the <em>Migration Logs</em> panel at the bottom of the page. When finished, the new backup appears in the <strong>Backup History</strong> table below.
                    </StepBlock>
                </CardContent>
            </Card>
        </section>

        {/* Backup limit / Overwrite dialog */}
        <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <HardDrive className="h-3 w-3 text-primary" />Backup limit and the overwrite dialog
            </h3>
            <Card className={cn("bg-card/10 border-border/50 hover:bg-card/30", "shadow-xl overflow-hidden")}>
                <CardContent className="p-6 space-y-4">
                    <p className="text-[12px] text-foreground/80 leading-relaxed">
                        Each user account is allowed a limited number of backups (typically <strong>1</strong>). If you already have a backup and try to create a new one, a warning dialog will appear:
                    </p>
                    <div className="flex gap-3 p-4 bg-rose-500/5 border border-rose-500/10 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                        <div className="space-y-2">
                            <p className="text-[11px] font-black text-rose-400 uppercase tracking-wider">Backup Limit Reached</p>
                            <p className="text-[11px] text-muted-foreground">The dialog warns that creating a new backup will <strong>permanently delete</strong> the existing one. The old backup cannot be recovered after overwriting.</p>
                            <p className="text-[11px] text-muted-foreground">You are given three choices:</p>
                            <ul className="space-y-1 text-[11px] text-muted-foreground list-none">
                                <li className="flex gap-2"><span className="text-blue-400 shrink-0">▸</span><strong className="text-foreground/80">Download existing backup first</strong> — downloads the old backup to your computer before proceeding. Recommended.</li>
                                <li className="flex gap-2"><span className="text-rose-400 shrink-0">▸</span><strong className="text-foreground/80">Overwrite &amp; Create New</strong> — deletes the old backup and creates a new one immediately.</li>
                                <li className="flex gap-2"><span className="text-muted-foreground shrink-0">▸</span><strong className="text-foreground/80">Cancel</strong> — closes the dialog without doing anything.</li>
                            </ul>
                        </div>
                    </div>
                    <div className="flex gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Note</p>
                            <p className="text-[11px] text-primary/80">
                                Always download the existing backup before overwriting if you might need to refer back to it later.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </section>

        {/* Backup History */}
        <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <History className="h-3 w-3 text-primary" />Backup History table
            </h3>
            <Card className={cn("bg-card/10 border-border/50 hover:bg-card/30", "shadow-xl overflow-hidden")}>
                <CardContent className="p-6 space-y-4">
                    <p className="text-[12px] text-foreground/80 leading-relaxed">
                        After a backup is created successfully, it appears in the <strong>Backup History</strong> table at the bottom of the page. From this table you can:
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-[11px] text-muted-foreground">
                        {[
                            { icon: <CloudDownload className="h-4 w-4 text-primary" />, t: "Download", d: "Download the JSON backup file to your computer for safekeeping or manual CLI import." },
                            { icon: <FileArchive className="h-4 w-4 text-amber-400" />, t: "Download ZIP", d: "If the backup was created with assets, download the ZIP archive separately." },
                            { icon: <History className="h-4 w-4 text-rose-400" />, t: "Delete", d: "Permanently remove a backup record and its associated files from the server." },
                        ].map((item) => (
                            <div key={item.t} className="flex gap-3 p-3 bg-muted/20 border border-border/50 rounded-lg">
                                <div className="shrink-0 mt-0.5">{item.icon}</div>
                                <div><p className="font-black text-foreground/80 uppercase tracking-wide text-[10px] mb-1">{item.t}</p><p>{item.d}</p></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </section>

        {/* Under the hood */}
        <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Flame className="h-3 w-3 text-rose-400" />What happens behind the scenes
            </h3>
            <Card className={cn("bg-card/10 border-border/50 hover:bg-card/30", "shadow-xl")}>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-muted-foreground">
                        {[
                            { s: "1", l: "Authentication", d: "Your Contentful token is decrypted from the database and used to authenticate the CLI." },
                            { s: "2", l: "Backup limit check", d: "The server checks whether you have reached your backup quota before starting the export." },
                            { s: "3", l: "CLI export", d: "Contentful CLI runs: contentful space export to capture all content as a JSON file." },
                            { s: "4", l: "Asset archiving", d: "If asset backup is requested (server mode), all asset files are downloaded and packed into a ZIP archive." },
                            { s: "5", l: "Database record", d: "A backup record is saved in the database with the name, timestamp, file size, and a flag indicating whether a ZIP is available." },
                            { s: "6", l: "Security note", d: "Asset ZIPs are neither stored permanently nor shared between users. They are purged from the server immediately after being sent to the client." },
                        ].map((item) => (
                            <div key={item.s} className="flex gap-3">
                                <div className="h-6 w-6 rounded bg-primary/10 border border-primary/20 text-primary flex items-center justify-center text-[9px] font-black shrink-0">{item.s}</div>
                                <div><p className="font-black text-foreground/80 uppercase tracking-wide text-[10px]">{item.l}</p><p className="mt-0.5">{item.d}</p></div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </section>

        {/* Security */}
        <section className="space-y-6">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <ShieldCheck className="h-3 w-3 text-green-400" />Security &amp; storage policy
            </h3>
            <Card className="bg-card/40 border-green-500/10 shadow-xl"><CardContent className="p-6 space-y-3 text-[11px] text-muted-foreground">
                <div className="flex gap-3"><span className="text-green-400 shrink-0">▸</span><span>JSON backup files are stored in the server-side <code className="text-primary bg-primary/10 px-1 rounded">/backups/&lt;spaceId&gt;/</code> directory and associated only with your account.</span></div>
                <div className="flex gap-3"><span className="text-green-400 shrink-0">▸</span><span>Asset ZIP archives (server mode) are placed in a temporary directory and deleted immediately after the download response is sent.</span></div>
                <div className="flex gap-3"><span className="text-green-400 shrink-0">▸</span><span>Contentful tokens are stored encrypted in the database and decrypted only at request time — they are never logged or exposed in responses.</span></div>
                <div className="flex gap-3"><span className="text-green-400 shrink-0">▸</span><span>All backup operations are logged with a timestamp and user ID for audit purposes.</span></div>
            </CardContent></Card>
        </section>

        {/* CLI */}
        <section className="space-y-6" id="backup-cli">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Terminal className="h-3 w-3 text-green-400" />Creating a backup via the CLI (manual method)
            </h3>
            <Card className="bg-muted/30 border-green-500/10 shadow-2xl overflow-hidden">
                <CardHeader className="bg-green-500/5 border-b border-green-500/10 py-4">
                    <div className="flex items-center gap-3"><Terminal className="h-5 w-5 text-green-400" /><CardTitle className="text-sm font-black uppercase tracking-widest text-green-300">Contentful CLI — contentful space export</CardTitle></div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">

                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Prerequisites</p>
                        <div className="space-y-1.5 text-[11px] text-muted-foreground">
                            <p className="flex gap-2"><span className="text-green-400 shrink-0">▸</span>Node.js ≥ 18 installed. Check with: <code className="text-green-300 bg-muted/40 px-1 rounded">node -v</code></p>
                            <p className="flex gap-2"><span className="text-green-400 shrink-0">▸</span>Contentful CLI installed: <code className="text-green-300 bg-muted/40 px-1 rounded">npm install -g contentful-cli</code></p>
                            <p className="flex gap-2"><span className="text-green-400 shrink-0">▸</span>Personal Access Token (PAT) from <a href="https://app.contentful.com/account/profile/cma_tokens" target="_blank" rel="noopener noreferrer" className="text-primary underline underline-offset-2 hover:text-primary/80 inline-flex items-center gap-1">Settings → API Keys <ExternalLink className="h-3 w-3" /></a></p>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><FolderOpen className="h-3 w-3" />Where the output file will be saved</p>
                        <p className="text-[11px] text-muted-foreground">By default, the CLI saves the export to the current working directory. Use <code className="text-green-300 bg-muted/40 px-1 rounded">--export-dir</code> to specify a folder:</p>
                        <CodeLine>{`# Output structure after export\n/projects/contentful-backups/\n  ├── contentful-export-2024-01-15.json   ← content backup\n  └── assets/                            ← only if --download-assets is used\n        ├── image1.png\n        └── document.pdf`}</CodeLine>
                    </div>

                    <div className="space-y-2">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Hash className="h-3 w-3" />Base command</p>
                        <CodeLine>{`contentful space export \\\n  --space-id <YOUR_SPACE_ID> \\\n  --environment-id <SOURCE_ENV> \\\n  --management-token <YOUR_PAT> \\\n  --export-dir ./backups`}</CodeLine>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2"><Zap className="h-3 w-3" />All available flags</p>
                        <Card className="bg-muted/20 border-green-500/10 overflow-hidden"><CardContent className="p-4 divide-y divide-border/50">
                            <CliFlag flag="--space-id <ID>" description="Your Contentful space ID. Find it in the URL: app.contentful.com/spaces/<SPACE_ID>" required />
                            <CliFlag flag="--environment-id <ENV>" description="ID of the source environment to export (e.g. master, staging). Defaults to master." required />
                            <CliFlag flag="--management-token <PAT>" description="Personal Access Token with read permissions. Generate at: app.contentful.com/account/profile/cma_tokens" required />
                            <CliFlag flag="--export-dir <PATH>" description="Directory where the exported JSON file will be saved. Defaults to the current working directory." />
                            <CliFlag flag="--download-assets" description="Download all binary asset files (images, videos, PDFs) into an assets/ subfolder alongside the JSON export." />
                            <CliFlag flag="--content-only" description="Export only entries — skip content types, locales, tags, and webhooks." />
                            <CliFlag flag="--content-model-only" description="Export only Content Types — no entries or assets. Useful for schema documentation." />
                            <CliFlag flag="--skip-roles" description="Do not export roles and permissions. Recommended if the target space uses different roles." />
                            <CliFlag flag="--skip-webhooks" description="Do not export webhooks. Useful when the backup is intended for a different environment." />
                            <CliFlag flag="--skip-content-model" description="Export only entries; skip Content Types. Use when the structure already exists in the target." />
                            <CliFlag flag="--query-entries <QUERY>" description="Filter which entries to export using a Contentful API query string. Example: content_type=article&fields.status=published" />
                            <CliFlag flag="--error-log-file <PATH>" description="File where export errors will be saved as JSON. Example: ./export-errors.json" />
                            <CliFlag flag="--rate-limit <N>" description="API requests per second (default: 7). Reduce to 3–5 if you encounter 429 rate-limit errors." />
                            <CliFlag flag="--use-verbose-renderer" description="Show detailed per-item progress output in the terminal. Useful for debugging large exports." />
                        </CardContent></Card>
                    </div>

                    <div className="space-y-4">
                        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Usage examples</p>
                        <div>
                            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Full export including all asset files:</p>
                            <CodeLine>{`contentful space export \\\n  --space-id abc123xyz \\\n  --environment-id master \\\n  --management-token CFPAT-xxxxxxxxxxxx \\\n  --export-dir ./backups \\\n  --download-assets`}</CodeLine>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Content model (structure) only — no entries or assets:</p>
                            <CodeLine>{`contentful space export \\\n  --space-id abc123xyz \\\n  --environment-id master \\\n  --management-token CFPAT-xxxxxxxxxxxx \\\n  --export-dir ./schema-backup \\\n  --content-model-only`}</CodeLine>
                        </div>
                        <div>
                            <p className="text-[10px] text-muted-foreground mb-1.5 uppercase tracking-wider font-bold">Export from staging with error log:</p>
                            <CodeLine>{`contentful space export \\\n  --space-id abc123xyz \\\n  --environment-id staging \\\n  --management-token CFPAT-xxxxxxxxxxxx \\\n  --export-dir ./backups/staging \\\n  --error-log-file ./export-errors.json \\\n  --rate-limit 5`}</CodeLine>
                        </div>
                    </div>

                    <div className="flex gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                        <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Tips</p>
                            <div className="text-[11px] text-foreground/70 leading-relaxed space-y-1">
                                <p>• The exported JSON file can be directly used with the <strong>Local JSON</strong> tab in the Restore Backup page.</p>
                                <p>• If you exported with <code className="text-primary bg-primary/10 px-1 rounded">--download-assets</code>, zip the <code className="text-primary bg-primary/10 px-1 rounded">assets/</code> folder and use it with the <strong>Local JSON + ZIP</strong> tab.</p>
                                <p>• Getting 429 errors? Add <code className="text-primary bg-primary/10 px-1 rounded">--rate-limit 3</code>.</p>
                                <p>• See all flags: <code className="text-primary bg-primary/10 px-1 rounded">contentful space export --help</code></p>
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

export default CreateBackupDoc;
