/**
 * Utility functions for Smart Migrate entry comparison
 */

export interface Entry {
    sys: {
        id: string;
        version: number;
        publishedVersion?: number;
        contentType: {
            sys: {
                id: string;
            };
        };
    };
    fields: Record<string, unknown>;
}

export type EntryStatus = 'Draft' | 'Changed' | 'Published';

export function getEntryTitle(entry: Entry | null | undefined): string {
    if (!entry?.fields) return entry?.sys?.id || 'Unknown';

    const fields = entry.fields;
    const titleKeys = ['title', 'name', 'label', 'headline'];

    // 1. Try common title fields
    const titleField = Object.keys(fields).find(key =>
        titleKeys.some(tk => key.toLowerCase().includes(tk))
    );

    if (titleField) {
        const val = fields[titleField];
        if (val && typeof val === 'object') {
            return String(Object.values(val)[0]);
        }
        return String(val);
    }

    // 2. Fallback to first string field
    for (const val of Object.values(fields)) {
        if (val && typeof val === 'object') {
            const firstVal = Object.values(val)[0];
            if (typeof firstVal === 'string') return firstVal;
        }
    }

    return entry.sys.id;
}

export function getEntryStatus(entry: Entry): EntryStatus {
    const { version, publishedVersion } = entry.sys;

    if (!publishedVersion) return 'Draft';
    if (version > publishedVersion + 1) return 'Changed';
    return 'Published';
}

export function mapEntries(entries: Entry[]): Map<string, Entry> {
    return new Map(entries.map(e => [e.sys.id, e]));
}

export function extractLocales(backupData: {
    locales?: Array<{ code: string }>;
    entries?: Entry[];
    assets?: Array<{ fields: Record<string, unknown> }>;
}): string[] {
    const usedLocales = new Set<string>();

    const scanFields = (fields: Record<string, unknown>) => {
        Object.values(fields).forEach(field => {
            if (field && typeof field === 'object' && !Array.isArray(field)) {
                Object.keys(field).forEach(locale => usedLocales.add(locale));
            }
        });
    };

    // 1. Environment settings
    backupData.locales?.forEach(loc => usedLocales.add(loc.code));

    // 2. Entries
    backupData.entries?.forEach(entry => entry.fields && scanFields(entry.fields));

    // 3. Assets
    backupData.assets?.forEach(asset => asset.fields && scanFields(asset.fields));

    return Array.from(usedLocales);
}
