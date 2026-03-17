import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Layout,
    Folders,
    Info,
    AlertTriangle,
    CheckCircle,
    ChevronDown,
    ChevronUp,
    ArrowRight,
    Database,
    Scan,
    MousePointerClick,
    Split,
    RefreshCw
} from "lucide-react";

const Section: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode; defaultOpen?: boolean }> = ({
    title, icon, children, defaultOpen = true
}) => {
    const [open, setOpen] = useState(defaultOpen);
    return (
        <div className="border border-border/50 rounded-2xl overflow-hidden bg-card">
            <button
                onClick={() => setOpen(!open)}
                className="w-full flex items-center justify-between px-6 py-4 bg-muted/20 hover:bg-muted/30 transition-colors text-left"
            >
                <div className="flex items-center gap-3">
                    <div className="text-blue-500">{icon}</div>
                    <span className="text-base font-bold text-foreground/80">{title}</span>
                </div>
                {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {open && <div className="p-6 space-y-5">{children}</div>}
        </div>
    );
};

const ViewsMigrateDoc: React.FC = () => {
    return (
        <div className="space-y-8 max-w-5xl">
            {/* Header */}
            <header className="space-y-3 border-l-4 border-blue-500 pl-6">
                <h2 className="text-3xl font-black tracking-tight text-foreground">
                    Views Sync
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">
                    Copy &ldquo;Saved Views&rdquo; and folder structures from one Contentful environment to another.
                    This feature fills a gap in the standard Contentful CLI, which does not support view migration.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                    {['Saved Views', 'Folder Sync', 'Cross-Environment', 'No CLI Needed'].map(tag => (
                        <Badge key={tag} variant="outline" className="text-xs font-bold text-blue-500 border-blue-500/30 bg-blue-500/5">{tag}</Badge>
                    ))}
                </div>
            </header>

            {/* What is it */}
            <Section title="What Are Saved Views?" icon={<Layout className="h-4 w-4" />}>
                <p className="text-base text-muted-foreground leading-relaxed">
                    In Contentful, <strong className="text-foreground">Saved Views</strong> are custom filters and column
                    configurations that your team creates inside the web app to organize content entries. They appear as
                    folders and saved filters in the sidebar of the Contentful entry list.
                </p>
                <p className="text-base text-muted-foreground leading-relaxed">
                    For example, your team might have a folder called <strong className="text-foreground">&quot;Blog Posts&quot;</strong> with
                    saved views like &quot;Published Articles&quot;, &quot;Drafts Pending Review&quot;, or &quot;Archived Content&quot; — each
                    showing different columns and filters.
                </p>
                <div className="flex gap-3 p-3 bg-blue-500/5 border border-blue-500/20 rounded-lg items-start">
                    <Info className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-base font-bold text-blue-500 mb-1">Why does this matter?</p>
                        <p className="text-base text-blue-500/80 leading-relaxed">
                            When you create a new environment (for example, a staging or feature branch), Contentful copies your
                            content types and entries — but <strong>not</strong> the saved views and folders. Your team loses all their
                            carefully organized filters and has to recreate them manually. Views Sync solves this problem.
                        </p>
                    </div>
                </div>
            </Section>

            {/* What gets synced */}
            <Section title="What Gets Copied" icon={<Folders className="h-4 w-4" />}>
                <p className="text-base text-muted-foreground leading-relaxed mb-4">
                    When you run Views Sync, the following data is transferred from the source environment to the target:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        { title: 'Sidebar Folders', desc: 'The folder structure visible in the left sidebar of the Contentful entry list. Folder names, order, and hierarchy are preserved.' },
                        { title: 'Saved Views Inside Folders', desc: 'Each individual saved view within a folder, including its name, the content type it filters by, and its unique identifier.' },
                        { title: 'Column Configurations', desc: 'Which fields are shown as columns in the entry list for each saved view (e.g., Title, Status, Updated date).' },
                        { title: 'Search Filters & Sorting', desc: 'Any active search text, filter conditions, and sort order (ascending/descending) that were saved in the view.' },
                    ].map(item => (
                        <div key={item.title} className="p-4 rounded-xl bg-accent/20 border border-border/50 space-y-2">
                            <h4 className="text-base font-bold text-foreground">{item.title}</h4>
                            <p className="text-base text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Step by step */}
            <Section title="How to Use — Step by Step" icon={<ArrowRight className="h-4 w-4" />}>
                <div className="grid grid-cols-1 gap-4">
                    {[
                        {
                            step: '01',
                            icon: <Database className="h-5 w-5" />,
                            title: 'Select Your Space',
                            desc: 'Open the Views Sync page from the dashboard. At the top, select the Contentful space you want to work with from the "Active Space" dropdown.'
                        },
                        {
                            step: '02',
                            icon: <Split className="h-5 w-5" />,
                            title: 'Choose Source and Target Environments',
                            desc: 'Pick the source environment (where your views already exist — typically "master" or "production") and the target environment (where you want to copy them — for example, "dev" or "staging"). They must be different.'
                        },
                        {
                            step: '03',
                            icon: <Scan className="h-5 w-5" />,
                            title: 'Scan Source Folders',
                            desc: 'Click "Initialize Source Scan". The system reads all saved view folders from the source environment and displays them as a list. Each folder shows its name and how many views it contains.'
                        },
                        {
                            step: '04',
                            icon: <MousePointerClick className="h-5 w-5" />,
                            title: 'Select Folders to Migrate',
                            desc: 'Check the folders you want to copy. You can expand any folder to preview the individual views inside it. Use "Link All" to select everything at once, or pick specific folders.'
                        },
                        {
                            step: '05',
                            icon: <RefreshCw className="h-5 w-5" />,
                            title: 'Run the Migration',
                            desc: 'Click the "Commit Selected Nodes" button at the bottom. The system copies the selected folders and views to the target environment. You will see a success message with the count of migrated items.'
                        },
                    ].map(s => (
                        <div key={s.step} className="flex gap-4 p-5 rounded-xl bg-accent/20 border border-border/50">
                            <div className="shrink-0 flex flex-col items-center gap-1">
                                <div className="h-10 w-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
                                    {s.icon}
                                </div>
                                <span className="text-xs font-bold text-blue-500/40">Step {s.step}</span>
                            </div>
                            <div className="space-y-1 pt-1">
                                <h4 className="text-base font-bold text-foreground">{s.title}</h4>
                                <p className="text-base text-muted-foreground leading-relaxed">{s.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Duplicate handling */}
            <Section title="How Duplicates Are Handled" icon={<CheckCircle className="h-4 w-4" />}>
                <p className="text-base text-muted-foreground leading-relaxed">
                    Views Sync is designed to be safe to run multiple times. Here is how it handles existing data in the target environment:
                </p>
                <div className="space-y-3 mt-4">
                    {[
                        {
                            icon: <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />,
                            text: 'If a folder does not exist in the target environment, it is created with all its views.'
                        },
                        {
                            icon: <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />,
                            text: 'If a folder already exists in the target, only new views (not already present by ID) are added to it. Existing views are not overwritten or duplicated.'
                        },
                        {
                            icon: <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />,
                            text: 'If all views in a folder already exist in the target, that folder is skipped entirely.'
                        },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-accent/20">
                            {item.icon}
                            <p className="text-base text-muted-foreground leading-relaxed">{item.text}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Common use cases */}
            <Section title="Common Use Cases" icon={<Folders className="h-4 w-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[
                        {
                            title: 'New Environment Setup',
                            desc: 'When creating a new environment (e.g., a staging branch for QA), use Views Sync to instantly copy all your team\'s saved views from production. No manual recreation needed.'
                        },
                        {
                            title: 'Onboarding New Team Members',
                            desc: 'Copy a standardized set of views to a shared environment so that new editors see the same organized content structure from day one.'
                        },
                        {
                            title: 'Content Audit Preparation',
                            desc: 'Create specialized views (e.g., "Missing SEO Fields", "Unpublished Drafts") in one environment and quickly sync them to others for a content audit.'
                        },
                        {
                            title: 'Feature Branch Workflow',
                            desc: 'When developers create short-lived feature environments, they can sync the team\'s views to maintain the same content editing experience across branches.'
                        },
                    ].map(item => (
                        <div key={item.title} className="p-4 rounded-xl bg-accent/20 border border-border/50 space-y-2">
                            <h4 className="text-base font-bold text-foreground">{item.title}</h4>
                            <p className="text-base text-muted-foreground leading-relaxed">{item.desc}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Important notes */}
            <Section title="Important Notes" icon={<AlertTriangle className="h-4 w-4" />} defaultOpen={false}>
                <div className="space-y-3">
                    {[
                        'Saved Views reference Content Types by ID. Make sure the same Content Types exist in the target environment before syncing views. If a view references a Content Type that doesn\'t exist in the target, the view will appear but may show an error when opened in Contentful.',
                        'Views Sync copies views — it does not delete or modify existing views in the target environment. It is a non-destructive, additive operation.',
                        'You need a valid Contentful Management Token with access to both the source and target environments. Set this up in your profile settings.',
                        'Source and target must be different environments within the same space. Cross-space migration is not supported.',
                        'The migration runs immediately — there is no preview or dry-run mode. However, since it only adds data and never removes anything, it is safe to run at any time.',
                    ].map((text, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-accent/20">
                            <ArrowRight className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                            <p className="text-base text-muted-foreground leading-relaxed">{text}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Footer note */}
            <div className="flex gap-3 p-3 bg-muted/20 border-border/50 border rounded-lg items-start">
                <Info className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                    <p className="text-base font-bold text-muted-foreground mb-1">Technical Detail</p>
                    <p className="text-base text-muted-foreground/80 leading-relaxed">
                        Under the hood, Views Sync uses the Contentful Management API&apos;s <code className="text-blue-500">UIConfig</code> endpoint
                        to read and write the <code className="text-blue-500">entryListViews</code> configuration. This is the same data store
                        that the Contentful web app uses to persist your sidebar folders and saved views.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ViewsMigrateDoc;
