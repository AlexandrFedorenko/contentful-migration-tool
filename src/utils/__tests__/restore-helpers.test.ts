// @ts-nocheck
import { filterBackupContent, cleanupBackupLocales, transformBackupLocales } from '../restore-helpers';
import { BackupData, BackupEntry, BackupAsset, BackupLocale, BackupContentType } from '@/types/backup';

describe('restore-helpers', () => {
    const mockBaseBackup = {
        sys: { type: 'Array', id: 'mock-id' },
        locales: [
            { code: 'en-US', name: 'English (US)', default: true, fallbackCode: null },
            { code: 'ru-RU', name: 'Russian', default: false, fallbackCode: 'en-US' }
        ],
        contentTypes: [
            {
                sys: { id: 'hero', type: 'ContentType' },
                name: 'Hero',
                fields: [
                    { id: 'title', name: 'Title', type: 'Symbol', localized: true },
                    // Mock default value config
                    { id: 'settings', name: 'Settings', type: 'Object', defaultValue: { 'en-US': { dark: true }, 'ru-RU': { dark: false } } }
                ]
            },
            { sys: { id: 'article', type: 'ContentType' }, name: 'Article', fields: [] }
        ] as unknown as BackupContentType[],
        editorInterfaces: [
            { sys: { contentType: { sys: { id: 'hero' } } }, controls: [] }
        ] as unknown[],
        assets: [
            {
                sys: { id: 'asset1', type: 'Asset' },
                fields: {
                    title: { 'en-US': 'Background', 'ru-RU': 'Фон' },
                    file: {
                        'en-US': { url: '//images.test/bg.jpg', details: { size: 100 } },
                        'ru-RU': { url: '//images.test/bg.jpg', details: { size: 100 } }
                    }
                }
            } as BackupAsset
        ],
        entries: [
            {
                sys: { id: 'heroEntry', type: 'Entry', contentType: { sys: { id: 'hero' } } },
                fields: {
                    title: { 'en-US': 'Hello World', 'ru-RU': 'Привет Мир' },
                    image: {
                        'en-US': { sys: { type: 'Link', linkType: 'Asset', id: 'asset1' } },
                        'ru-RU': { sys: { type: 'Link', linkType: 'Asset', id: 'asset1' } }
                    },
                    linkedArticle: {
                        'en-US': { sys: { type: 'Link', linkType: 'Entry', id: 'articleEntry' } }
                    }
                }
            } as unknown as BackupEntry,
            {
                sys: { id: 'articleEntry', type: 'Entry', contentType: { sys: { id: 'article' } } },
                fields: {
                    body: { 'en-US': 'Article Body' }
                }
            } as unknown as BackupEntry
        ]
    } as unknown as BackupData;

    describe('filterBackupContent', () => {
        it('returns original content if options are empty', () => {
            const result = filterBackupContent(mockBaseBackup, {});
            expect(result.entries?.length).toBe(2);
            expect(result.assets?.length).toBe(1);
        });

        it('filters completely by specific locale only', () => {
            const result = filterBackupContent(mockBaseBackup, { locales: ['en-US'] });

            expect(result.locales?.length).toBe(1);
            expect(result.locales?.[0].code).toBe('en-US');

            const heroEntry = result.entries!.find(e => e.sys.id === 'heroEntry');
            // Should completely remove ru-RU from the output
            expect(heroEntry?.fields.title).not.toHaveProperty('ru-RU');
            expect(heroEntry?.fields.title).toHaveProperty('en-US');
        });

        it('filters by content type and resolves dependencies', () => {
            // If we only select 'hero', it should automatically include 'articleEntry' because 'hero' links to it
            // and 'asset1' because 'hero' links to it
            const result = filterBackupContent(mockBaseBackup, { contentTypes: ['hero'], locales: ['en-US', 'ru-RU'] });

            expect(result.entries?.length).toBe(2); // heroEntry + articleEntry (dependency)
            expect(result.assets?.length).toBe(1); // asset1 (dependency)

            const contentTypes = result.contentTypes!.map((c) => c.sys.id);
            expect(contentTypes).toContain('hero');
            expect(contentTypes).toContain('article');
            expect(result.editorInterfaces?.length).toBe(1);
        });

        it('filters by content type WITHOUT including irrelevant entries', () => {
            // Create a backup with an unlinked entry
            const backupMod = {
                ...mockBaseBackup,
                entries: [
                    ...mockBaseBackup.entries!,
                    { sys: { id: 'unlinkedArticle', type: 'Entry', contentType: { sys: { id: 'article' } } }, fields: {} } as BackupEntry
                ]
            };

            const result = filterBackupContent(backupMod, { contentTypes: ['hero'] });
            // Should only contain heroEntry and articleEntry (dependency). unlinkedArticle should be stripped out.
            expect(result.entries?.length).toBe(2);
            expect(result.entries?.map(e => e.sys.id)).not.toContain('unlinkedArticle');
        });

        it('strips locales while filtering content types', () => {
            const result = filterBackupContent(mockBaseBackup, { contentTypes: ['hero'], locales: ['en-US'] });

            const heroEntry = result.entries!.find(e => e.sys.id === 'heroEntry');
            expect(heroEntry?.fields.title).toHaveProperty('en-US');
            expect(heroEntry?.fields.title).not.toHaveProperty('ru-RU');

            const asset = result.assets!.find(a => a.sys.id === 'asset1');
            expect(asset?.fields.title).toHaveProperty('en-US');
            expect(asset?.fields.title).not.toHaveProperty('ru-RU');
        });
    });

    describe('cleanupBackupLocales', () => {
        it('aggressively deletes locales not in the allowed set from entries and assets', () => {
            const clonedBackup = JSON.parse(JSON.stringify(mockBaseBackup));
            const allowed = new Set(['en-US']);
            const result = cleanupBackupLocales(clonedBackup, allowed);

            const heroEntry = result.entries!.find((e: BackupEntry) => e.sys.id === 'heroEntry');
            expect(heroEntry?.fields.title).not.toHaveProperty('ru-RU');
            expect(heroEntry?.fields.title).toHaveProperty('en-US');

            const ct = result.contentTypes!.find((c: BackupContentType) => c.sys.id === 'hero');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(((ct?.fields as any[])[1]).defaultValue).not.toHaveProperty('ru-RU');
        });
    });

    describe('transformBackupLocales', () => {
        it('renames locale keys based on the mapping and preserves content structure', () => {
            const mapping = { 'en-US': 'en-GB' };
            const result = transformBackupLocales(mockBaseBackup, mapping);

            expect(result.locales?.[0].code).toBe('en-GB');

            const heroEntry = result.entries!.find((e: BackupEntry) => e.sys.id === 'heroEntry');
            expect(heroEntry?.fields.title).toHaveProperty('en-GB');
            expect(heroEntry?.fields.title['en-GB']).toBe('Hello World');
            expect(heroEntry?.fields.title).not.toHaveProperty('en-US');

            const ct = result.contentTypes!.find((c: BackupContentType) => c.sys.id === 'hero');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const defValue = ((ct?.fields as any[])[1]).defaultValue;
            expect(defValue).toHaveProperty('en-GB');
            expect(defValue['en-GB'].dark).toBe(true);
            expect(defValue).not.toHaveProperty('en-US');
        });

        it('handles multiple mappings correctly', () => {
            const mapping = { 'en-US': 'es-ES', 'ru-RU': 'uk-UA' };
            const result = transformBackupLocales(mockBaseBackup, mapping);

            expect(result.locales?.map((l: BackupLocale) => l.code)).toEqual(['es-ES', 'uk-UA']);

            const asset = result.assets!.find((a: BackupAsset) => a.sys.id === 'asset1');
            expect(asset?.fields.title).toHaveProperty('es-ES');
            expect(asset?.fields.title['es-ES']).toBe('Background');
            expect(asset?.fields.title).toHaveProperty('uk-UA');
            expect(asset?.fields.title['uk-UA']).toBe('Фон');
        });
    });
});
