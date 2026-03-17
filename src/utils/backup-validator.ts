/* eslint-disable @typescript-eslint/no-explicit-any */
import { BackupData } from '@/types/backup';

/**
 * Utility functions for validating backup data structure
 */

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

/**
 * Validates the structure of a Contentful backup
 */
export function validateBackupStructure(data: unknown): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data || typeof data !== 'object') {
        return { valid: false, errors: ['Backup data must be an object'], warnings };
    }

    const backup = data as BackupData;

    if (!backup.contentTypes && !backup.entries && !backup.assets) {
        warnings.push('Backup contains no content types, entries, or assets');
    }

    validateContentTypes(backup.contentTypes, errors);
    validateEntries(backup.entries, errors);
    validateAssets(backup.assets, errors);
    validateLocales(backup.locales, errors, warnings);

    return {
        valid: errors.length === 0,
        errors,
        warnings
    };
}

function validateContentTypes(contentTypes: any[] | undefined, errors: string[]) {
    if (contentTypes === undefined) return;
    if (!Array.isArray(contentTypes)) {
        errors.push('contentTypes must be an array');
        return;
    }

    contentTypes.forEach((ct, index) => {
        if (!ct.sys?.id) errors.push(`Content type at index ${index} missing sys.id`);
        if (!Array.isArray(ct.fields)) errors.push(`Content type at index ${index} missing or invalid fields array`);
    });
}

function validateEntries(entries: any[] | undefined, errors: string[]) {
    if (entries === undefined) return;
    if (!Array.isArray(entries)) {
        errors.push('entries must be an array');
        return;
    }

    entries.forEach((entry, index) => {
        if (!entry.sys?.id) errors.push(`Entry at index ${index} missing sys.id`);
        if (!entry.sys?.contentType?.sys?.id) errors.push(`Entry at index ${index} missing contentType reference`);
    });
}

function validateAssets(assets: any[] | undefined, errors: string[]) {
    if (assets === undefined) return;
    if (!Array.isArray(assets)) {
        errors.push('assets must be an array');
        return;
    }

    assets.forEach((asset, index) => {
        if (!asset.sys?.id) errors.push(`Asset at index ${index} missing sys.id`);
    });
}

function validateLocales(locales: any[] | undefined, errors: string[], warnings: string[]) {
    if (locales === undefined) return;
    if (!Array.isArray(locales)) {
        errors.push('locales must be an array');
        return;
    }

    if (locales.length > 0 && !locales.some(loc => loc.default === true)) {
        warnings.push('No default locale specified');
    }

    locales.forEach((locale, index) => {
        if (!locale.code) errors.push(`Locale at index ${index} missing code`);
    });
}

/**
 * Checks if backup contains specific content types
 */
export function hasContentTypes(data: BackupData, contentTypeIds: string[]): boolean {
    if (!data.contentTypes) return false;
    const existingIds = new Set(data.contentTypes.map(ct => ct.sys.id));
    return contentTypeIds.every(id => existingIds.has(id));
}

/**
 * Counts items in backup by type
 */
export function getBackupStats(data: BackupData) {
    return {
        contentTypes: data.contentTypes?.length || 0,
        entries: data.entries?.length || 0,
        assets: data.assets?.length || 0,
        locales: data.locales?.length || 0
    };
}

/**
 * Filters backup data by content types
 */
export function filterByContentTypes(data: BackupData, contentTypeIds: string[]): BackupData {
    const contentTypeSet = new Set(contentTypeIds);
    return {
        ...data,
        contentTypes: data.contentTypes?.filter(ct => contentTypeSet.has(ct.sys.id)),
        entries: data.entries?.filter(entry => contentTypeSet.has(entry.sys.contentType.sys.id))
    };
}

/**
 * Helper to filter localized fields
 */
function filterFields(fields: Record<string, any>, localeSet: Set<string>): Record<string, any> {
    const filtered: Record<string, any> = {};

    for (const [fieldName, fieldValue] of Object.entries(fields)) {
        if (fieldValue && typeof fieldValue === 'object' && !Array.isArray(fieldValue)) {
            // Check if this looks like a localized field (keys are locale codes)
            const filteredLocales: Record<string, any> = {};
            let hasLocales = false;

            for (const [locale, value] of Object.entries(fieldValue)) {
                if (localeSet.has(locale)) {
                    filteredLocales[locale] = value;
                    hasLocales = true;
                }
            }

            if (hasLocales) filtered[fieldName] = filteredLocales;
        } else {
            // Non-localized or simple field
            filtered[fieldName] = fieldValue;
        }
    }

    return filtered;
}

/**
 * Filters backup data by locales
 */
export function filterByLocales(data: BackupData, localeCodes: string[]): BackupData {
    const localeSet = new Set(localeCodes);

    return {
        ...data,
        locales: data.locales?.filter(loc => localeSet.has(loc.code)),
        entries: data.entries?.map(entry => ({
            ...entry,
            fields: filterFields(entry.fields || {}, localeSet)
        })),
        assets: data.assets?.map(asset => ({
            ...asset,
            fields: filterFields(asset.fields || {}, localeSet)
        }))
    };
}
