import type { BackupLocale } from '@/types/backup';

export type DiffStatus = 'NEW' | 'MODIFIED' | 'DELETED' | 'EQUAL';

export interface EntryDiffItem {
    id: string;
    diffStatus: DiffStatus;
    title: string;
    fields: Record<string, unknown>;
    targetFields?: Record<string, unknown>;
    changedFieldKeys?: string[];
    sys: {
        version: number;
        publishedVersion?: number;
        updatedAt?: string;
        contentTypeId: string;
    };
}

export interface CTDiffItem {
    id: string;
    name: string;
    description: string;
    displayField: string | null;
    fields: unknown[];
    diffStatus: DiffStatus;
    changedFields?: string[];
    totalSourceEntries: number;
    totalTargetEntries: number;
    changedEntryCount: number;
    equalEntryCount: number;
    deletedEntryCount: number;
    entryDiffs: EntryDiffItem[];
    resolvedAssets?: Record<string, { url: string; title: string; isImage: boolean }>;
    resolvedEntries?: Record<string, { title: string; contentType?: string }>;
}

export interface LocaleDiffItem {
    code: string;
    name: string;
    default: boolean;
    fallbackCode: string | null;
    diffStatus: DiffStatus;
}

export interface MigrateDiffResult {
    contentTypes: CTDiffItem[];
    locales: LocaleDiffItem[];
    sourceLocales: BackupLocale[];
    targetLocales: BackupLocale[];
    ctDependencyMap: Record<string, string[]>;
    summary: {
        newCTs: number;
        modifiedCTs: number;
        deletedCTs: number;
        equalCTs: number;
        newLocales: number;
        modifiedLocales: number;
        deletedLocales: number;
        newEntries: number;
        modifiedEntries: number;
        deletedEntries: number;
        equalEntries: number;
    };
}
