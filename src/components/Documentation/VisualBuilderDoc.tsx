import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import {
    FileCode,
    Zap,
    Layers,
    BookOpen,
    AlertTriangle,
    CheckCircle,
    Code2,
    Database,
    ArrowRight,
    ChevronDown,
    ChevronUp,
    ExternalLink,
    Cpu,
    GitBranch,
    Save,
    Hammer,
    Library,
    Wrench,
    Info
} from "lucide-react";

const CodeBlock: React.FC<{ code: string; lang?: string }> = ({ code, lang = 'javascript' }) => (
    <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-inner">
        <div className="flex items-center gap-2 px-4 py-2 bg-muted/40 border-b border-border/50">
            <Code2 className="h-3 w-3 text-amber-500/60" />
            <span className="text-[10px] font-bold text-amber-500/60 uppercase tracking-widest">{lang}</span>
        </div>
        <pre className="p-4 bg-muted/30 font-mono text-[11px] text-slate-300 leading-relaxed overflow-x-auto whitespace-pre">
            {code.trim()}
        </pre>
    </div>
);

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
                    <div className="text-amber-500">{icon}</div>
                    <span className="text-sm font-bold uppercase tracking-widest text-foreground/80">{title}</span>
                </div>
                {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
            </button>
            {open && <div className="p-6 space-y-5">{children}</div>}
        </div>
    );
};

const VisualBuilderDoc: React.FC = () => {
    return (
        <div className="space-y-8 max-w-5xl">
            {/* Header */}
            <header className="space-y-3 border-l-4 border-amber-500 pl-6">
                <h2 className="text-3xl font-black uppercase tracking-tight text-foreground">
                    Visual Builder
                </h2>
                <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">
                    A visual tool for creating Contentful migration scripts. Build complex migrations
                    through a drag-and-drop interface and ready-made templates — no manual coding required.
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                    {['contentful-migration CLI', 'Drag & Drop', 'Templates', 'Code Preview'].map(tag => (
                        <Badge key={tag} variant="outline" className="text-[10px] font-bold text-amber-500 border-amber-500/30 bg-amber-500/5">{tag}</Badge>
                    ))}
                </div>
            </header>

            {/* How it works */}
            <Section title="How It Works" icon={<Cpu className="h-4 w-4" />}>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { step: '01', title: 'Choose Environment', desc: 'Select your Space and Target Environment at the top of the page.' },
                        { step: '02', title: 'Build Steps', desc: 'Use the "Visual Builder" tab for drag-and-drop or pick a ready-made template from "Template Library".' },
                        { step: '03', title: 'Run Migration', desc: 'Click "Generate Code" to preview the script, then "Run Migration" to execute it.' },
                    ].map(s => (
                        <div key={s.step} className="p-4 rounded-xl bg-accent/20 border border-border/50 space-y-2">
                            <span className="text-[10px] font-black text-amber-500/40">STEP {s.step}</span>
                            <h4 className="text-sm font-bold">{s.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg items-start">
                    <Zap className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-1">Important</p>
                        <p className="text-[11px] text-amber-500/80">
                            Every generated script is wrapped in <code className="bg-muted/30 px-1 rounded">module.exports = function(migration) {'{ ... }'}</code>
                            — the standard format of the <strong>contentful-migration</strong> CLI library.
                        </p>
                    </div>
                </div>
            </Section>

            {/* Builder Menu Reference */}
            <Section title="Builder Menu — All Operations" icon={<Hammer className="h-4 w-4" />}>
                <p className="text-xs text-muted-foreground mb-4">
                    Click <strong>&quot;Acquire Operation&quot;</strong> in the Visual Builder to open the dropdown menu. All available operations are grouped into three categories:
                </p>

                {/* Content Type Operations */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Content Type Operations</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { op: 'Create Content Type', desc: 'Creates a new Content Type in Contentful. You will specify the name, ID, and optional description. The generated code calls migration.createContentType().' },
                            { op: 'Delete Content Type', desc: 'Removes a Content Type entirely. All entries of this type must be deleted first in Contentful, otherwise the migration will fail.' },
                        ].map(({ op, desc }) => (
                            <div key={op} className="p-3 rounded-xl bg-accent/20 border border-border/50">
                                <p className="text-xs font-bold text-foreground/90 mb-1">📋 {op}</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Field Operations */}
                <div className="space-y-3 mt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Field Operations</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { op: 'Create Field', icon: '➕', desc: 'Add a new field to a Content Type. Choose the field type (Short Text, Long Text, Number, Date, Boolean, Reference, Media, Rich Text, Array), set it as required, and optionally mark it as the display field.' },
                            { op: 'Delete Field', icon: '❌', desc: 'Remove a field from a Content Type. Note: Contentful requires two steps — first omit the field, then delete it. The builder handles this automatically.' },
                            { op: 'Rename Field', icon: '✏️', desc: 'Change the internal ID of a field using changeFieldId(). You can also set a new display name.' },
                            { op: 'Add Validation', icon: '✅', desc: 'Mark a field as required. For more complex validations (regex, size limits, allowed values), use code editing.' },
                            { op: 'Edit Field Properties', icon: '📝', desc: 'Modify an existing field — change its name, toggle required/disabled/omitted flags, and select a widget appearance.' },
                            { op: 'Set Display Field', icon: '⭐', desc: 'Choose which field is shown as the entry title in the Contentful web app.' },
                            { op: 'Move Field Position', icon: '↕️', desc: 'Reorder where a field appears in the Contentful editor. Supports: move to top, to bottom, after a specific field, or before a specific field.' },
                        ].map(({ op, icon, desc }) => (
                            <div key={op} className="p-3 rounded-xl bg-accent/20 border border-border/50">
                                <p className="text-xs font-bold text-foreground/90 mb-1">{icon} {op}</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Data Transformations */}
                <div className="space-y-3 mt-4">
                    <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Data Transformations</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[
                            { op: 'Update Entry (by ID)', icon: '📝', desc: 'Update a single entry by its unique ID. Specify the Content Type, entry ID, field, and the new value.' },
                            { op: 'Transform Entries (Bulk)', icon: '🔄', desc: 'Apply a transformation to all entries of a Content Type. Supports: Copy, Slugify, Lowercase, Uppercase, Trim, Clear Empty, Default Locale Fallback, Find & Replace, and Static Value.' },
                            { op: 'Derive Linked Entries', icon: '🔗', desc: 'Create a new Content Type and populate it automatically from fields of an existing Content Type. Useful for extracting SEO metadata, author info, etc.' },
                        ].map(({ op, icon, desc }) => (
                            <div key={op} className="p-3 rounded-xl bg-accent/20 border border-border/50">
                                <p className="text-xs font-bold text-foreground/90 mb-1">{icon} {op}</p>
                                <p className="text-[11px] text-muted-foreground leading-relaxed">{desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </Section>

            {/* Default Templates Reference */}
            <Section title="Default Templates Library" icon={<Library className="h-4 w-4" />}>
                <p className="text-xs text-muted-foreground mb-4">
                    The Template Library contains <strong>19 ready-made templates</strong> grouped by category.
                    Click <strong>&quot;Apply&quot;</strong> to load a template into the Visual Builder, then customize the parameters.
                    Click <strong>&quot;Code&quot;</strong> to preview the generated migration script without applying.
                </p>

                {/* Schema Ops */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-2">Schema Operations — 10 Templates</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 border-b border-border/50">
                                    <th className="p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Template</th>
                                    <th className="p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs">
                                {[
                                    ['🔗 Add Reference Field', 'Create a reference field linking to another Content Type (e.g. author → person).'],
                                    ['🏷️ Add Tags Field', 'Create a tags field with an array of short text values (Array of Symbols).'],
                                    ['📋 Clone Content Type', 'Create a new Content Type with title, slug, and body fields as a starter template.'],
                                    ['↕️ Reorder Fields in UI', 'Move a field to a new position in the Contentful editor interface.'],
                                    ['⭐ Set Entry Title Field', 'Change which field is displayed as the entry title in Contentful.'],
                                    ['🎨 Switch Field to Dropdown', 'Change the editor appearance of a field from text input to dropdown.'],
                                    ['🔒 Make Field Required', 'Set an existing field as required without changing anything else.'],
                                    ['🖼️ Add Media Field', 'Create a field for attaching a single image or asset to an entry.'],
                                    ['📎 Add Multiple References', 'Create an array of entry references (e.g., Related Articles).'],
                                    ['🗑️ Delete Field', 'Remove a field from a Content Type. Ensure data is backed up before running.'],
                                ].map(([name, desc]) => (
                                    <tr key={name} className="hover:bg-muted/20 transition-colors">
                                        <td className="p-3 font-semibold text-foreground/80 whitespace-nowrap">{name}</td>
                                        <td className="p-3 text-muted-foreground">{desc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Data Transform */}
                <div className="space-y-3 mt-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2">Data Transformation — 6 Templates</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 border-b border-border/50">
                                    <th className="p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Template</th>
                                    <th className="p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs">
                                {[
                                    ['🔗 Auto-Generate Slugs', 'Generate URL-friendly slugs from the title field for all entries.'],
                                    ['📝 Find & Replace Text', 'Find and replace text across all entries (e.g., domain change).'],
                                    ['🌐 Set Default Locale Fallback', 'Fill empty locale fields with values from the default locale (en-US).'],
                                    ['🔡 Convert to Lowercase', 'Lowercase all values in a text field across all entries.'],
                                    ['📋 Copy Field Value', 'Clone a field value into a different field on the same Content Type.'],
                                    ['✏️ Set Static Value', 'Replace a field with a fixed static value (e.g., status = "active").'],
                                ].map(([name, desc]) => (
                                    <tr key={name} className="hover:bg-muted/20 transition-colors">
                                        <td className="p-3 font-semibold text-foreground/80 whitespace-nowrap">{name}</td>
                                        <td className="p-3 text-muted-foreground">{desc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Cleanup */}
                <div className="space-y-3 mt-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-2">Cleanup — 3 Templates</p>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-muted/30 border-b border-border/50">
                                    <th className="p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Template</th>
                                    <th className="p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5 text-xs">
                                {[
                                    ['🧹 Clear Empty String Fields', 'Null out fields that contain only whitespace or empty strings.'],
                                    ['✂️ Trim Whitespace', 'Remove leading and trailing whitespace from a text field.'],
                                    ['🔠 Convert to Uppercase', 'Uppercase all values in a text field across all entries.'],
                                ].map(([name, desc]) => (
                                    <tr key={name} className="hover:bg-muted/20 transition-colors">
                                        <td className="p-3 font-semibold text-foreground/80 whitespace-nowrap">{name}</td>
                                        <td className="p-3 text-muted-foreground">{desc}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Section>

            {/* Saving Templates */}
            <Section title="Saving Custom Templates" icon={<Save className="h-4 w-4" />}>
                <p className="text-xs text-muted-foreground leading-relaxed mb-4">
                    After building a migration in the Visual Builder, you can save it as a reusable template
                    so you or your teammates can apply it again later.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {[
                        { step: '01', title: 'Build Your Steps', desc: 'Use "Acquire Operation" to add one or more steps to the Visual Builder. Configure each step\'s parameters.' },
                        { step: '02', title: 'Click "Save Template"', desc: 'At the bottom of the Visual Builder panel, click the "Save Template" button. A dialog will appear.' },
                        { step: '03', title: 'Name & Save', desc: 'Enter a template name and an optional description. Click "Commit Template" to save. Your template will appear in the Template Library under "My Custom" category.' },
                    ].map(s => (
                        <div key={s.step} className="p-4 rounded-xl bg-accent/20 border border-border/50 space-y-2">
                            <span className="text-[10px] font-black text-amber-500/40">STEP {s.step}</span>
                            <h4 className="text-sm font-bold">{s.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{s.desc}</p>
                        </div>
                    ))}
                </div>
                <div className="flex gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg items-start mt-4">
                    <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[11px] text-primary/80">
                            Custom templates are saved to the database and shared across your team. You can delete custom templates
                            from the Template Library by hovering over one and clicking the trash icon. Built-in templates cannot be deleted.
                        </p>
                    </div>
                </div>
            </Section>

            {/* Migration Operations Reference */}
            <Section title="Migration Operations Reference" icon={<Database className="h-4 w-4" />} defaultOpen={false}>
                <p className="text-xs text-muted-foreground">All operations are called through the <code className="text-amber-500">migration</code> object passed into the function:</p>

                <div className="space-y-6">
                    {/* Schema ops */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">Schema (Content Types)</p>
                        <div className="space-y-3">
                            <CodeBlock lang="javascript" code={`// Create a new Content Type
const post = migration.createContentType('blogPost')
    .name('Blog Post')
    .description('A blog article')
    .displayField('title');

// Edit an existing Content Type
const ct = migration.editContentType('blogPost')
    .name('Blog Article');

// Delete a Content Type (only if it has no entries!)
migration.deleteContentType('obsoleteType');`} />

                            <CodeBlock lang="javascript" code={`// Create a field
post.createField('title')
    .name('Title')
    .type('Symbol')          // field type
    .required(true)
    .localized(false);

// Edit a field
post.editField('slug')
    .required(true)
    .validations([{ unique: true }]);

// Rename a field ID
post.changeFieldId('oldFieldId', 'newFieldId');

// Delete a field (2 steps: omit then delete)
post.editField('deprecated').omitted(true).deleted(true);`} />
                        </div>
                    </div>

                    {/* Transform */}
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-3">Data Transformation</p>
                        <CodeBlock lang="javascript" code={`// transformEntries — bulk update field values
migration.transformEntries({
    contentType: 'blogPost',
    from: ['title'],          // source field(s)
    to: ['slug'],             // target field(s)
    transformEntryForLocale: async (fromFields, locale) => {
        const title = fromFields.title?.[locale] ?? '';
        return {
            slug: title.toLowerCase().replace(/\\s+/g, '-')
        };
    }
});`} />

                        <div className="mt-3">
                            <CodeBlock lang="javascript" code={`// deriveLinkedEntries — create new entries from existing ones
migration.deriveLinkedEntries({
    contentType: 'blogPost',
    derivedContentType: 'seoMetadata',    // new type to create
    from: ['title', 'description'],
    toReferenceField: 'seo',              // reference field in blogPost
    derivedFields: ['metaTitle', 'metaDesc'],
    identityKey: async (fromFields) =>
        fromFields.title?.['en-US'],
    deriveEntryForLocale: async (fromFields, locale) => ({
        metaTitle: fromFields.title?.[locale] ?? '',
        metaDesc: fromFields.description?.[locale] ?? ''
    })
});`} />
                        </div>
                    </div>
                </div>
            </Section>

            {/* Field types */}
            <Section title="Contentful Field Types" icon={<Layers className="h-4 w-4" />} defaultOpen={false}>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border/50">
                                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Type</th>
                                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">API Name</th>
                                <th className="p-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground">Description</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5 text-xs">
                            {[
                                ['Short Text', 'Symbol', 'String up to 256 characters, slug, email'],
                                ['Long Text', 'Text', 'Markdown, unlimited text content'],
                                ['Rich Text', 'RichText', 'Formatted text with embedded entries'],
                                ['Integer', 'Integer', 'Whole number'],
                                ['Decimal', 'Number', 'Floating-point number'],
                                ['Boolean', 'Boolean', 'true / false'],
                                ['Date & Time', 'Date', 'ISO 8601 date and time'],
                                ['Location', 'Location', 'GPS coordinates {lat, lon}'],
                                ['JSON Object', 'Object', 'Arbitrary JSON object'],
                                ['Media (Asset)', 'Link (Asset)', 'Reference to an uploaded file'],
                                ['Reference', 'Link (Entry)', 'Reference to another Entry'],
                                ['Array', 'Array', 'List of Symbols, numbers, or references'],
                            ].map(([name, api, desc]) => (
                                <tr key={api} className="hover:bg-muted/20 transition-colors">
                                    <td className="p-3 font-semibold text-foreground/80">{name}</td>
                                    <td className="p-3 font-mono text-amber-500 text-[11px]">{api}</td>
                                    <td className="p-3 text-muted-foreground">{desc}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Section>

            {/* Validations */}
            <Section title="Field Validations" icon={<CheckCircle className="h-4 w-4" />} defaultOpen={false}>
                <CodeBlock lang="javascript" code={`field.validations([
    { size: { min: 1, max: 100 } },       // string length or character count
    { regexp: { pattern: '^[a-z0-9-]+$', flags: 'i' } },  // regular expression
    { unique: true },                      // uniqueness within the Content Type
    { in: ['draft', 'published', 'archived'] },  // list of allowed values
    { linkContentType: ['blogPost', 'page'] },   // for Reference fields only
    { enabledNodeTypes: ['heading-1', 'paragraph', 'embedded-entry-block'] }, // Rich Text
    { enabledMarks: ['bold', 'italic', 'code'] }  // Rich Text marks
]);`} />
            </Section>

            {/* Nuances */}
            <Section title="Tips & Limitations" icon={<AlertTriangle className="h-4 w-4" />} defaultOpen={false}>
                <div className="space-y-3">
                    {[
                        {
                            icon: <ArrowRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />,
                            text: 'Order of operations matters: create Content Types first, then fields, then transformations. You can only delete a CT after all its entries have been removed.'
                        },
                        {
                            icon: <ArrowRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />,
                            text: 'deleteContentType() is irreversible. Make sure no other Content Type references it via a Reference field.'
                        },
                        {
                            icon: <ArrowRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />,
                            text: 'Deleting a field requires two steps: first set omitted(true) in one migration, then deleted(true) in the next. This is a Contentful CMA requirement.'
                        },
                        {
                            icon: <ArrowRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />,
                            text: 'transformEntries works on published and draft entries. For archived entries, you need separate logic.'
                        },
                        {
                            icon: <ArrowRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />,
                            text: 'All templates from the Template Library are loaded as visual steps in the Visual Builder. Click "Apply" to load the steps, then edit the parameters as needed.'
                        },
                        {
                            icon: <ArrowRight className="h-3.5 w-3.5 text-amber-500 shrink-0 mt-0.5" />,
                            text: 'Migrations run with the --yes flag, so all steps are applied without confirmation. Always create a backup before running.'
                        },
                    ].map((item, i) => (
                        <div key={i} className="flex gap-3 p-3 rounded-lg bg-accent/20">
                            {item.icon}
                            <p className="text-xs text-muted-foreground leading-relaxed">{item.text}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Developer Note */}
            <Section title="For Developers — Custom Migrations" icon={<Wrench className="h-4 w-4" />} defaultOpen={false}>
                <div className="flex gap-3 p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-lg items-start">
                    <Code2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-1">Developer Workflow</p>
                        <p className="text-[11px] text-emerald-500/80 leading-relaxed">
                            The Visual Builder generates a ready-to-use migration script scaffold. If you need custom transformation logic
                            (e.g., complex data mapping, conditional updates, or API calls), you can <strong>copy the generated code</strong> from the
                            Code Editor panel and modify it in your local environment.
                        </p>
                    </div>
                </div>

                <div className="mt-4 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                        <strong>How to use the scaffold:</strong>
                    </p>
                    <div className="space-y-2">
                        {[
                            'Build your migration visually using the builder or templates.',
                            'Click "Generate Code" to produce the migration script.',
                            'Copy the code from the Code Editor panel on the right.',
                            'Save it as a .js file locally and modify as needed.',
                            'Run it with: npx contentful-migration --space-id YOUR_SPACE --environment-id YOUR_ENV --yes script.js',
                        ].map((text, i) => (
                            <div key={i} className="flex gap-3 p-2 rounded-lg bg-accent/10">
                                <span className="text-[10px] font-black text-emerald-500/40 shrink-0 mt-0.5">{i + 1}.</span>
                                <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <CodeBlock lang="bash" code={`# Run a migration script locally
npx contentful-migration \\
  --space-id YOUR_SPACE_ID \\
  --environment-id YOUR_ENVIRONMENT \\
  --yes \\
  my-migration.js`} />

                <p className="text-xs text-muted-foreground leading-relaxed mt-4">
                    Refer to the official Contentful documentation for advanced features like environment aliasing,
                    complex validations, editor interface customization, and more:
                </p>
            </Section>

            {/* Template categories */}
            <Section title="Template Categories Overview" icon={<GitBranch className="h-4 w-4" />} defaultOpen={false}>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {[
                        { cat: 'Schema Ops', desc: 'Create Content Types, fields, and validations' },
                        { cat: 'Field Ops', desc: 'Slugify, merge, and split fields' },
                        { cat: 'Data Transform', desc: 'Bulk transformEntries templates' },
                        { cat: 'Derive Ops', desc: 'deriveLinkedEntries templates' },
                        { cat: 'Cleanup', desc: 'Clear outdated or empty data' },
                        { cat: 'Custom', desc: 'Your saved custom templates' },
                    ].map(({ cat, desc }) => (
                        <div key={cat} className="p-3 rounded-xl bg-accent/20 border border-amber-500/10">
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">{cat}</p>
                            <p className="text-xs text-muted-foreground mt-1">{desc}</p>
                        </div>
                    ))}
                </div>
            </Section>

            {/* Useful links */}
            <Section title="Useful Links" icon={<BookOpen className="h-4 w-4" />} defaultOpen={false}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                        { label: 'contentful-migration — GitHub', href: 'https://github.com/contentful/contentful-migration' },
                        { label: 'Contentful CMA Reference', href: 'https://www.contentful.com/developers/docs/references/content-management-api/' },
                        { label: 'Content Types API Reference', href: 'https://www.contentful.com/developers/docs/references/content-management-api/#/reference/content-types/content-type/upsert-a-content-type' },
                        { label: 'transformEntries Docs', href: 'https://www.contentful.com/developers/docs/concepts/migration/#transform-entries' },
                        { label: 'deriveLinkedEntries Docs', href: 'https://github.com/contentful/contentful-migration#derive-linked-entries' },
                        { label: 'Validation Rules Reference', href: 'https://www.contentful.com/developers/docs/references/content-management-api/#/reference/content-types' },
                        { label: 'Migration CLI — Getting Started', href: 'https://github.com/contentful/contentful-migration#readme' },
                        { label: 'Contentful Migration Concepts', href: 'https://www.contentful.com/developers/docs/concepts/migration/' },
                    ].map(({ label, href }) => (
                        <a
                            key={label}
                            href={href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 p-3 rounded-lg bg-accent/20 border border-border/50 hover:border-amber-500/30 hover:bg-amber-500/5 transition-all group text-sm font-medium text-foreground/70 hover:text-amber-500"
                        >
                            <ExternalLink className="h-3.5 w-3.5 shrink-0" />
                            {label}
                        </a>
                    ))}
                </div>
            </Section>

            {/* Footer note */}
            <div className="flex gap-3 p-3 bg-muted/20 border border-border/50 rounded-lg items-start">
                <FileCode className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-1">Under the Hood</p>
                    <p className="text-[11px] text-muted-foreground/80 leading-relaxed">
                        The generated script is saved as a temporary <code className="text-amber-500">.js</code> file and executed via
                        <code className="text-amber-500 ml-1">contentful-migration --space-id ... --environment-id ... --yes script.js</code>.
                        Execution logs are streamed in real-time and displayed in the <strong>Migration Logs</strong> section.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default VisualBuilderDoc;
