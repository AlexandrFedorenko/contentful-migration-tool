import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Database,
    FileJson,
    CheckCircle2,
    Eye,
    Settings,
    Trash2,
    Download,
    ImageIcon,
    Layers,
    Globe,
    Code2,
    ShieldCheck,
    AlertTriangle,
    Search,
    FileText,
    Pencil,
    Info,
    Video,
    Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

const SectionHeader = ({ icon: Icon, children }: { icon: React.ElementType; children: React.ReactNode }) => (
    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground px-2 flex items-center gap-2">
        <Icon className="h-3 w-3 text-primary" />{children}
    </h3>
);

const BackupsDoc: React.FC = () => {
    return (
        <div className="space-y-12">
            <header className="space-y-2 border-l-4 border-primary pl-6">
                <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
                    Archival Library
                </h2>
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-[0.2em]">Centralized snapshot repository & management</p>
                <p className="text-sm text-foreground/70 leading-relaxed max-w-3xl">
                    The <strong className="text-primary">Backups Library</strong> is the centralized vault for all environment
                    snapshots. Every backup — whether created manually via the Backup page or automatically
                    as a safety backup before a migration — is stored here and available for preview, download,
                    and restoration.
                </p>
            </header>

            {/* ── What is stored ────────────────────────────────────────── */}
            <section className="space-y-6">
                <SectionHeader icon={FileJson}>Manifest Architecture</SectionHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { icon: Layers, label: "Content Types", desc: "Full schema definitions including field-level validations, display fields, and editor interfaces." },
                        { icon: Database, label: "Entry Registry", desc: "Complete content payloads across all active locales, including published, draft, and archived entries." },
                        { icon: ImageIcon, label: "Asset Metadata & CDN URLs", desc: "Asset titles, file names, content types, sizes, and Contentful CDN image/video URLs for preview rendering." },
                        { icon: Globe, label: "Locale Mapping", desc: "Language configuration, default locale, fallback chains, and locale codes." }
                    ].map((item, i) => (
                        <div key={i} className="p-4 rounded-xl bg-muted/20 border border-border/50 flex gap-4 group hover:border-primary/20 transition-all">
                            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary/60 group-hover:text-primary transition-colors shrink-0">
                                <item.icon className="h-4 w-4" />
                            </div>
                            <div>
                                <h5 className="text-[10px] font-black uppercase tracking-widest text-foreground/90 mb-1">{item.label}</h5>
                                <p className="text-[11px] font-medium text-muted-foreground">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="flex gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
                    <Database className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Storage Protocol</p>
                        <p className="text-[11px] text-primary/80">
                            Backups are stored as JSON records in the database, associated with your account and space.
                            Asset binary files (images, videos, PDFs) are <strong className="text-primary italic">not</strong> stored in the backup — only their metadata and Contentful CDN URLs are saved.
                            This allows the Backup Preview to render images and videos directly from the CDN without downloading them.
                        </p>
                    </div>
                </div>
            </section>

            {/* ── Backup Types ──────────────────────────────────────────── */}
            <section className="space-y-6">
                <SectionHeader icon={Zap}>Backup Types</SectionHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <Card className="bg-card border-border/50 shadow-xl overflow-hidden">
                        <CardHeader className="bg-primary/5 border-b border-border/50 py-3">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                <Database className="h-3.5 w-3.5" />Manual Backups
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3 text-[11px] text-muted-foreground">
                            <p>Created via the <strong className="text-foreground/80">Create Backup</strong> page. Include <strong>all</strong> data: Content Types, Entries, Assets, Locales, Tags, and Editor Interfaces.</p>
                            <p>These backups contain full asset metadata with CDN URLs, so images and videos render correctly in preview.</p>
                            <p>Optionally, asset binary files can be archived into a ZIP for complete offline backup.</p>
                        </CardContent>
                    </Card>

                    <Card className="bg-card border-border/50 shadow-xl overflow-hidden">
                        <CardHeader className="bg-amber-500/5 border-b border-border/50 py-3">
                            <CardTitle className="text-[10px] font-black uppercase tracking-widest text-amber-400 flex items-center gap-2">
                                <ShieldCheck className="h-3.5 w-3.5" />Safety Backups (Pre-Transfer / Pre-Migrate)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-5 space-y-3 text-[11px] text-muted-foreground">
                            <p>Created <strong className="text-foreground/80">automatically</strong> before any Smart Restore or Smart Migrate operation. Named <code className="bg-muted px-1 rounded text-[10px]">pre-transfer-&#123;env&#125;-&#123;timestamp&#125;.json</code> or <code className="bg-muted px-1 rounded text-[10px]">pre-migrate-&#123;env&#125;-&#123;timestamp&#125;.json</code>.</p>
                            <p>These safety backups capture the target environment state (Content Types, Entries, Assets, Locales) so you can roll back if something goes wrong during migration.</p>
                            <p>Asset metadata with CDN URLs is included, so the preview page shows images and videos just like manual backups.</p>
                        </CardContent>
                    </Card>
                </div>
            </section>

            {/* ── Backup Preview ────────────────────────────────────────── */}
            <section className="space-y-6">
                <SectionHeader icon={Eye}>Backup Preview</SectionHeader>
                <Card className="bg-card backdrop-blur-xl border-border/50 shadow-xl overflow-hidden">
                    <CardHeader className="bg-muted/30 border-b border-border/50">
                        <CardTitle className="text-sm font-black uppercase tracking-widest text-foreground/80 flex items-center gap-2">
                            <Eye className="h-4 w-4 text-primary" />Archive Contents Analysis
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <p className="text-[12px] text-foreground/80 leading-relaxed font-medium">
                            Click <strong className="text-primary">Preview</strong> on any backup to open the interactive Archive Contents Analysis page.
                            The preview has three tabs:
                        </p>

                        {/* Three tabs */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                {
                                    icon: Layers,
                                    title: "Overview",
                                    color: "primary" as const,
                                    items: [
                                        "Statistics: number of Content Types, Entries, Assets, Locales",
                                        "Assets Preview: scrollable list of all assets with thumbnails, titles, IDs, and file type badges",
                                        "Locale selection for targeted restore",
                                    ]
                                },
                                {
                                    icon: Search,
                                    title: "Content Browser",
                                    color: "primary" as const,
                                    items: [
                                        "Left sidebar lists Content Types with entry counts",
                                        "Right panel shows entries with expandable field details",
                                        "Asset references render as inline image/video previews when asset data is available",
                                        "Rich text fields render with full formatting",
                                        "Entry references display as linked badges",
                                    ]
                                },
                                {
                                    icon: Code2,
                                    title: "Raw JSON",
                                    color: "primary" as const,
                                    items: [
                                        "Full raw JSON of the backup file",
                                        "Syntax highlighted with search capability",
                                        "Useful for debugging field structures and references",
                                    ]
                                }
                            ].map((tab) => (
                                <Card key={tab.title} className="bg-muted/20 border-border/50 overflow-hidden">
                                    <CardHeader className="bg-primary/5 border-b border-border/50 py-3">
                                        <CardTitle className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                                            <tab.icon className="h-3.5 w-3.5" />{tab.title}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-4 space-y-2">
                                        {tab.items.map((item, i) => (
                                            <div key={i} className="flex gap-2 text-[11px] text-muted-foreground">
                                                <span className="text-primary shrink-0">▸</span>
                                                <span>{item}</span>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* ── Asset Rendering ───────────────────────────────────────── */}
            <section className="space-y-6">
                <SectionHeader icon={ImageIcon}>Asset Rendering in Preview</SectionHeader>
                <Card className="bg-card border-border/50 shadow-xl">
                    <CardContent className="p-6 space-y-5">
                        <p className="text-[12px] text-foreground/80 leading-relaxed">
                            The preview page renders assets directly from Contentful&apos;s CDN — <strong className="text-primary">no downloading needed</strong>.
                            Each asset in the backup contains a CDN URL (e.g. <code className="text-primary bg-primary/10 px-1 rounded text-[10px]">images.ctfassets.net/...</code>)
                            which is used to display the media inline.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                {
                                    icon: ImageIcon,
                                    title: "Images",
                                    desc: "JPEG, PNG, WebP, GIF, SVG — rendered as inline thumbnails with title and file size badge.",
                                    color: "bg-green-500/10 border-green-500/20 text-green-400"
                                },
                                {
                                    icon: Video,
                                    title: "Videos & Documents",
                                    desc: "Non-image assets (MP4, PDF, DOCX) shown with a file icon, title, and content type badge.",
                                    color: "bg-blue-500/10 border-blue-500/20 text-blue-400"
                                },
                                {
                                    icon: AlertTriangle,
                                    title: "Unresolved References",
                                    desc: "If an entry references an asset not present in the backup data, only the Asset ID is shown with an \"Attachment\" badge.",
                                    color: "bg-amber-500/10 border-amber-500/20 text-amber-400"
                                }
                            ].map((item) => (
                                <div key={item.title} className={cn("p-4 rounded-xl border flex gap-3", item.color)}>
                                    <item.icon className="h-5 w-5 shrink-0 mt-0.5" />
                                    <div>
                                        <h5 className="text-[10px] font-black uppercase tracking-widest mb-1">{item.title}</h5>
                                        <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="flex gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg">
                            <AlertTriangle className="h-4 w-4 text-amber-400 shrink-0 mt-0.5" />
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-1">Why some assets show only an ID</p>
                                <p className="text-[11px] text-amber-200/70 leading-relaxed">
                                    Entry fields can contain <strong>Link references</strong> to assets (e.g. <code className="bg-muted/30 px-1 rounded">sys.type: &quot;Link&quot;, linkType: &quot;Asset&quot;</code>).
                                    If the backup includes the full asset data in its <code className="bg-muted/30 px-1 rounded">assets</code> array, the preview resolves the reference and shows the actual image by CDN URL.
                                    If the asset data is missing (the backup only has the Link pointer), the preview falls back to showing the Asset ID.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* ── Inventory Management ──────────────────────────────────── */}
            <section className="space-y-6">
                <SectionHeader icon={Settings}>Inventory Management</SectionHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { icon: <Eye className="h-5 w-5" />, title: "Preview", desc: "Open the interactive Archive Contents Analysis to inspect entries, assets, and raw data." },
                        { icon: <Pencil className="h-5 w-5" />, title: "Rename", desc: "Change the backup filename for easier identification. Click the rename icon next to the backup name." },
                        { icon: <Download className="h-5 w-5" />, title: "Download", desc: "Export the JSON backup to your computer for external archival, CLI import, or manual peer review." },
                        { icon: <Trash2 className="h-5 w-5" />, title: "Delete", desc: "Permanently remove a backup and its associated files. This action cannot be undone." }
                    ].map((step, i) => (
                        <div key={i} className="p-5 rounded-2xl bg-card border border-border/50 space-y-3 hover:bg-muted/20 transition-all group">
                            <div className="h-10 w-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform border border-primary/10">
                                {step.icon}
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-foreground">{step.title}</h4>
                            <p className="text-[11px] font-medium text-muted-foreground leading-relaxed">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* ── Search & Filter ──────────────────────────────────────── */}
            <section className="space-y-6">
                <SectionHeader icon={Search}>Search & Filter</SectionHeader>
                <Card className="bg-card border-border/50 shadow-xl">
                    <CardContent className="p-6 space-y-4 text-[11px] text-muted-foreground">
                        <p className="text-[12px] text-foreground/80 font-medium">
                            The backup list supports real-time search and type-based filtering:
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex gap-3 p-3 bg-muted/20 border border-border/50 rounded-lg">
                                <Search className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-black text-foreground/80 uppercase tracking-wide text-[10px] mb-1">Search</p>
                                    <p>Type in the search field to filter backups by filename. The filter updates in real time as you type.</p>
                                </div>
                            </div>
                            <div className="flex gap-3 p-3 bg-muted/20 border border-border/50 rounded-lg">
                                <FileText className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <div>
                                    <p className="font-black text-foreground/80 uppercase tracking-wide text-[10px] mb-1">Type Filters</p>
                                    <p>Filter by backup type: <strong>All</strong>, <strong>Manual</strong> (user-created), or <strong>Auto</strong> (safety backups created before migrations).</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </section>

            {/* ── Technical details ────────────────────────────────────── */}
            <section className="space-y-6">
                <SectionHeader icon={Info}>Technical Details</SectionHeader>
                <Card className="bg-card border-border/50 shadow-xl">
                    <CardContent className="p-6 space-y-3 text-[11px] text-muted-foreground">
                        {[
                            { label: "Storage", desc: "Backups are stored as JSON in the database (PostgreSQL via Prisma), not on the filesystem. Each backup is tied to a user account and Space ID." },
                            { label: "Backup Limit", desc: "Each user has a configurable backup limit per space. When the limit is reached, creating a new backup requires overwriting an existing one." },
                            { label: "Asset CDN", desc: "Asset images and videos are NOT stored in the backup. Only the Contentful CDN URLs are saved, allowing the preview to render media directly from images.ctfassets.net." },
                            { label: "Safety Backups", desc: "Automatically created before Smart Restore and Smart Migrate operations. Include entries, content types, locales, and full asset metadata with CDN URLs." },
                            { label: "Naming Convention", desc: "Manual backups: {SpaceName}-{Env}-{ISO timestamp}.json. Safety backups: pre-transfer-{env}-{timestamp}.json or pre-migrate-{env}-{timestamp}.json." },
                        ].map((item) => (
                            <div key={item.label} className="flex gap-3">
                                <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                <p><strong className="text-foreground/80">{item.label}:</strong> {item.desc}</p>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </section>

            {/* ── Security ─────────────────────────────────────────────── */}
            <section className="space-y-6">
                <SectionHeader icon={ShieldCheck}>Security & Privacy</SectionHeader>
                <Card className="bg-card/40 border-green-500/10 shadow-xl">
                    <CardContent className="p-6 space-y-3 text-[11px] text-muted-foreground">
                        <div className="flex gap-3"><span className="text-green-400 shrink-0">▸</span><span>Backups are stored in the database and associated only with your authenticated user account.</span></div>
                        <div className="flex gap-3"><span className="text-green-400 shrink-0">▸</span><span>Asset ZIP archives (when created via server mode) are placed in a temporary directory and purged after download or after 30 minutes.</span></div>
                        <div className="flex gap-3"><span className="text-green-400 shrink-0">▸</span><span>Contentful tokens are stored encrypted (AES) and decrypted only at request time — they are never logged or exposed.</span></div>
                        <div className="flex gap-3"><span className="text-green-400 shrink-0">▸</span><span>All backup operations (create, delete, restore) are logged with timestamps and user IDs for audit purposes.</span></div>
                    </CardContent>
                </Card>
            </section>
        </div>
    );
};

export default BackupsDoc;
