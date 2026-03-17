/**
 * dependency-resolver.ts
 *
 * Two-level recursive dependency resolution for Contentful content:
 *
 * Level 1 — Content Type schema dependencies:
 *   If CT "landing-page" has a field linking to CT "hero-component",
 *   then "hero-component" is automatically added to the transfer set.
 *
 * Level 2 — Entry/Asset data dependencies:
 *   For each resolved entry, scan its field values for Link/RichText references
 *   and pull in the referenced entries and assets recursively.
 */

import type { BackupEntry, BackupAsset, BackupContentType } from '@/types/backup';
import type { ContentType } from '@/utils/contentful-management';

// ─── Level 1: Content Type Schema Dependencies ───────────────────────────────

/**
 * Given a set of initially selected CT ids and all available CTs,
 * return an expanded Set that includes all transitively referenced CTs.
 *
 * Also returns a map of which CTs were auto-added (dep reasons).
 */
export function resolveContentTypeDependencies(
    selectedCTIds: Set<string>,
    allCTs: ContentType[] | BackupContentType[]
): { resolved: Set<string>; autoDeps: Set<string> } {
    const resolved = new Set<string>(selectedCTIds);
    const autoDeps = new Set<string>();

    const ctMap = new Map<string, ContentType | BackupContentType>(
        allCTs.map(ct => [ct.sys.id, ct])
    );

    let changed = true;
    while (changed) {
        changed = false;
        for (const ctId of Array.from(resolved)) {
            const ct = ctMap.get(ctId);
            if (!ct) continue;

            for (const field of (ct.fields ?? [])) {
                const linkedCTIds = extractLinkedCTIds(field as Record<string, unknown>);
                for (const linkedId of linkedCTIds) {
                    if (!resolved.has(linkedId)) {
                        resolved.add(linkedId);
                        autoDeps.add(linkedId);
                        changed = true;
                    }
                }
            }
        }
    }

    return { resolved, autoDeps };
}

/** Extract all Content Type ids that a field definition can link to. */
function extractLinkedCTIds(field: Record<string, unknown>): string[] {
    const ids: string[] = [];

    // Direct Link field: field.type === 'Link' && field.linkType === 'Entry'
    if (field.type === 'Link' && field.linkType === 'Entry') {
        const validations = (field.validations as Record<string, unknown>[] | undefined) ?? [];
        for (const v of validations) {
            const linkContentType = v.linkContentType as string[] | undefined;
            if (Array.isArray(linkContentType)) ids.push(...linkContentType);
        }
    }

    // Array of Links: field.type === 'Array' && field.items.type === 'Link'
    if (field.type === 'Array') {
        const items = field.items as Record<string, unknown> | undefined;
        if (items?.type === 'Link' && items?.linkType === 'Entry') {
            const itemValidations = (items.validations as Record<string, unknown>[] | undefined) ?? [];
            for (const v of itemValidations) {
                const linkContentType = v.linkContentType as string[] | undefined;
                if (Array.isArray(linkContentType)) ids.push(...linkContentType);
            }
        }
    }

    return ids;
}

// ─── Level 2: Entry / Asset Data Dependencies ─────────────────────────────────

export interface ResolvedDeps {
    entryIds: Set<string>;
    assetIds: Set<string>;
}

/**
 * Given seed entries, recursively scan their field values for
 * Entry and Asset links (including Rich Text embedded nodes).
 *
 * Returns all resolved entry ids and asset ids.
 */
export function resolveEntryDependencies(
    seedEntries: BackupEntry[],
    entryMap: Map<string, BackupEntry>
): ResolvedDeps {
    const entryIds = new Set<string>();
    const assetIds = new Set<string>();

    // Seed the queue
    const queue: BackupEntry[] = [];
    for (const entry of seedEntries) {
        if (!entryIds.has(entry.sys.id)) {
            entryIds.add(entry.sys.id);
            queue.push(entry);
        }
    }

    let i = 0;
    while (i < queue.length) {
        const entry = queue[i++];
        if (entry.fields) {
            scanForLinks(entry.fields, entryIds, assetIds, entryMap, queue);
        }
    }

    return { entryIds, assetIds };
}

/** Recursively scans a value tree for Contentful Link objects and RichText nodes. */
function scanForLinks(
    obj: unknown,
    entryIds: Set<string>,
    assetIds: Set<string>,
    entryMap: Map<string, BackupEntry>,
    queue: BackupEntry[]
): void {
    if (!obj || typeof obj !== 'object') return;

    if (Array.isArray(obj)) {
        for (const item of obj) scanForLinks(item, entryIds, assetIds, entryMap, queue);
        return;
    }

    const node = obj as Record<string, unknown>;

    // Direct Link object
    if (node.sys && typeof node.sys === 'object') {
        const sys = node.sys as Record<string, unknown>;
        if (sys.type === 'Link') {
            if (sys.linkType === 'Entry' && typeof sys.id === 'string') {
                const id = sys.id;
                if (!entryIds.has(id) && entryMap.has(id)) {
                    entryIds.add(id);
                    queue.push(entryMap.get(id)!);
                }
                return;
            }
            if (sys.linkType === 'Asset' && typeof sys.id === 'string') {
                assetIds.add(sys.id);
                return;
            }
        }
    }

    // Rich Text node types that embed entries / assets
    const nodeType = node.nodeType as string | undefined;
    if (nodeType) {
        const target = (node.data as Record<string, unknown> | undefined)?.target as Record<string, unknown> | undefined;
        const targetId = (target?.sys as Record<string, unknown> | undefined)?.id as string | undefined;

        if (targetId) {
            if (['embedded-entry-block', 'embedded-entry-inline', 'entry-hyperlink'].includes(nodeType)) {
                if (!entryIds.has(targetId) && entryMap.has(targetId)) {
                    entryIds.add(targetId);
                    queue.push(entryMap.get(targetId)!);
                }
            }
            if (['embedded-asset-block', 'asset-hyperlink'].includes(nodeType)) {
                assetIds.add(targetId);
            }
        }
    }

    // Recurse into all child values
    for (const value of Object.values(node)) {
        scanForLinks(value, entryIds, assetIds, entryMap, queue);
    }
}

/** Convenience: build entry map from array. */
export function buildEntryMap(entries: BackupEntry[]): Map<string, BackupEntry> {
    return new Map(entries.map(e => [e.sys.id, e]));
}

/** Convenience: build asset map from array. */
export function buildAssetMap(assets: BackupAsset[]): Map<string, BackupAsset> {
    return new Map(assets.map(a => [a.sys.id, a]));
}
