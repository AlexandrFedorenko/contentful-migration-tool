/**
 * locale-filter.ts
 * 
 * CRITICAL RULE: A Contentful entry is ALWAYS a single object.
 * Locales are just keys inside field values.
 * 
 * CORRECT:   Keep 1 entry, strip non-selected locale keys from fields.
 * INCORRECT: Create N copies of the entry (one per locale).
 * 
 * Example input  (1 button, 3 locales):
 *   { sys: { id: "btn-1" }, fields: { label: { "en": "Click", "ru": "Жми", "de": "Klick" } } }
 * 
 * After filterEntryLocales(entry, { "en" }, { "en": "en-US" }):
 *   { sys: { id: "btn-1" }, fields: { label: { "en-US": "Click" } } }
 *   → still 1 entry, locale key renamed, others stripped.
 */

import type { BackupEntry, BackupAsset, BackupLocale, BackupContentType } from '@/types/backup';

export type LocaleMapping = Record<string, string>;

/** Strip non-selected locale keys from a single entry's fields, applying optional remap. */
export function filterEntryLocales(
    entry: BackupEntry,
    selectedLocales: Set<string>,
    localeMapping: LocaleMapping = {}
): BackupEntry {
    if (!entry.fields) return { ...entry };
    const newFields: Record<string, Record<string, unknown>> = {};

    for (const [fieldName, fieldByLocale] of Object.entries(entry.fields as Record<string, Record<string, unknown>>)) {
        if (!fieldByLocale || typeof fieldByLocale !== 'object') {
            newFields[fieldName] = fieldByLocale;
            continue;
        }
        newFields[fieldName] = {};
        for (const [locale, value] of Object.entries(fieldByLocale)) {
            if (selectedLocales.size === 0 || selectedLocales.has(locale)) {
                const targetLocale = localeMapping[locale] ?? locale;
                newFields[fieldName][targetLocale] = value;
            }
            // All other locale keys are intentionally dropped — no entry duplication!
        }
    }

    return { ...entry, fields: newFields };
}

/** Same as filterEntryLocales but for assets. */
export function filterAssetLocales(
    asset: BackupAsset,
    selectedLocales: Set<string>,
    localeMapping: LocaleMapping = {}
): BackupAsset {
    if (!asset.fields) return { ...asset };
    const newFields: Record<string, Record<string, unknown>> = {};

    for (const [fieldName, fieldByLocale] of Object.entries(asset.fields as Record<string, Record<string, unknown>>)) {
        if (!fieldByLocale || typeof fieldByLocale !== 'object') {
            newFields[fieldName] = fieldByLocale;
            continue;
        }
        newFields[fieldName] = {};
        for (const [locale, value] of Object.entries(fieldByLocale)) {
            if (selectedLocales.size === 0 || selectedLocales.has(locale)) {
                const targetLocale = localeMapping[locale] ?? locale;
                newFields[fieldName][targetLocale] = value;
            }
        }
    }

    return { ...asset, fields: newFields };
}

/**
 * Remap locale codes in the top-level locales[] array.
 * e.g. { "en": "en-US" } → changes locale objects with code "en" → "en-US"
 */
export function remapLocaleDefinitions(
    locales: BackupLocale[],
    localeMapping: LocaleMapping
): BackupLocale[] {
    return locales.map(loc => {
        const mapped = localeMapping[loc.code];
        if (mapped) return { ...loc, code: mapped };
        return loc;
    });
}

/**
 * Remap locale keys in Content Type defaultValues (if any).
 */
export function remapContentTypeDefaults(
    contentTypes: BackupContentType[],
    localeMapping: LocaleMapping
): BackupContentType[] {
    if (!Object.keys(localeMapping).length) return contentTypes;

    return contentTypes.map(ct => {
        const fields = ct.fields?.map((field) => {
            // Cast to access dynamic defaultValue safely
            const f = field as Record<string, unknown>;
            if (!f.defaultValue || typeof f.defaultValue !== 'object') return field;
            const oldDefaults = f.defaultValue as Record<string, unknown>;
            const newDefaults: Record<string, unknown> = {};
            for (const [locale, value] of Object.entries(oldDefaults)) {
                const targetLocale = localeMapping[locale] ?? locale;
                newDefaults[targetLocale] = value;
            }
            return { ...field, defaultValue: newDefaults };
        });
        return { ...ct, fields: fields ?? ct.fields };
    });
}

/**
 * Auto-suggest locale mapping between source and target locales.
 * Tries exact match first, then case-insensitive, then common patterns (en↔en-US).
 */
export function autoSuggestLocaleMapping(
    sourceLocales: BackupLocale[],
    targetLocales: BackupLocale[]
): LocaleMapping {
    const mapping: LocaleMapping = {};
    const targetCodes = targetLocales.map(l => l.code);

    for (const src of sourceLocales) {
        const srcCode = src.code;

        // 1. Exact match — no mapping needed
        if (targetCodes.includes(srcCode)) {
            continue; // identity mapping, skip
        }

        // 2. Case-insensitive match
        const caseMatch = targetCodes.find(t => t.toLowerCase() === srcCode.toLowerCase());
        if (caseMatch) { mapping[srcCode] = caseMatch; continue; }

        // 3. Common pattern: "en" → "en-US" or "en-US" → "en"
        const withRegion = targetCodes.find(t => t.startsWith(srcCode + '-'));
        if (withRegion) { mapping[srcCode] = withRegion; continue; }

        const withoutRegion = targetCodes.find(t => srcCode.startsWith(t + '-'));
        if (withoutRegion) { mapping[srcCode] = withoutRegion; continue; }

        // 4. Target default locale as fallback
        const targetDefault = targetLocales.find(l => l.default);
        if (targetDefault) { mapping[srcCode] = targetDefault.code; }
    }

    return mapping;
}
