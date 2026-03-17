import { getEntryTitle, getEntryStatus, mapEntries, extractLocales, Entry } from '../entry-helpers';

describe('Entry Helpers', () => {
    describe('getEntryTitle', () => {
        it('should extract title from title field', () => {
            const entry: Entry = {
                sys: {
                    id: 'entry1',
                    version: 1,
                    contentType: { sys: { id: 'blogPost' } }
                },
                fields: {
                    title: { 'en-US': 'My Blog Post' }
                }
            };

            expect(getEntryTitle(entry)).toBe('My Blog Post');
        });

        it('should extract title from name field', () => {
            const entry: Entry = {
                sys: {
                    id: 'entry2',
                    version: 1,
                    contentType: { sys: { id: 'author' } }
                },
                fields: {
                    name: { 'en-US': 'John Doe' }
                }
            };

            expect(getEntryTitle(entry)).toBe('John Doe');
        });

        it('should handle non-localized fields', () => {
            const entry: Entry = {
                sys: {
                    id: 'entry3',
                    version: 1,
                    contentType: { sys: { id: 'product' } }
                },
                fields: {
                    title: 'Product Name'
                }
            };

            expect(getEntryTitle(entry)).toBe('Product Name');
        });

        it('should fallback to first string field', () => {
            const entry: Entry = {
                sys: {
                    id: 'entry4',
                    version: 1,
                    contentType: { sys: { id: 'custom' } }
                },
                fields: {
                    description: { 'en-US': 'Some description' }
                }
            };

            expect(getEntryTitle(entry)).toBe('Some description');
        });

        it('should return entry ID if no suitable field found', () => {
            const entry: Entry = {
                sys: {
                    id: 'entry5',
                    version: 1,
                    contentType: { sys: { id: 'empty' } }
                },
                fields: {
                    count: { 'en-US': 42 }
                }
            };

            expect(getEntryTitle(entry)).toBe('entry5');
        });

        it('should handle null entry gracefully', () => {
            expect(getEntryTitle(null)).toBe('Unknown');
        });

        it('should handle undefined entry gracefully', () => {
            expect(getEntryTitle(undefined)).toBe('Unknown');
        });

        it('should handle entry without fields', () => {
            const entry = {
                sys: {
                    id: 'entry6',
                    version: 1,
                    contentType: { sys: { id: 'test' } }
                },
                fields: {}
            } as Entry;

            expect(getEntryTitle(entry)).toBe('entry6');
        });
    });

    describe('getEntryStatus', () => {
        it('should return Draft for unpublished entry', () => {
            const entry: Entry = {
                sys: {
                    id: 'draft1',
                    version: 3,
                    contentType: { sys: { id: 'blogPost' } }
                },
                fields: {}
            };

            expect(getEntryStatus(entry)).toBe('Draft');
        });

        it('should return Published for published entry with no changes', () => {
            const entry: Entry = {
                sys: {
                    id: 'published1',
                    version: 5,
                    publishedVersion: 4,
                    contentType: { sys: { id: 'blogPost' } }
                },
                fields: {}
            };

            expect(getEntryStatus(entry)).toBe('Published');
        });

        it('should return Changed for entry with unpublished changes', () => {
            const entry: Entry = {
                sys: {
                    id: 'changed1',
                    version: 8,
                    publishedVersion: 4,
                    contentType: { sys: { id: 'blogPost' } }
                },
                fields: {}
            };

            expect(getEntryStatus(entry)).toBe('Changed');
        });
    });

    describe('mapEntries', () => {
        it('should create a Map of entries by ID', () => {
            const entries: Entry[] = [
                {
                    sys: { id: 'entry1', version: 1, contentType: { sys: { id: 'blogPost' } } },
                    fields: {}
                },
                {
                    sys: { id: 'entry2', version: 1, contentType: { sys: { id: 'author' } } },
                    fields: {}
                }
            ];

            const map = mapEntries(entries);

            expect(map.size).toBe(2);
            expect(map.get('entry1')).toBe(entries[0]);
            expect(map.get('entry2')).toBe(entries[1]);
        });

        it('should handle empty array', () => {
            const map = mapEntries([]);
            expect(map.size).toBe(0);
        });
    });

    describe('extractLocales', () => {
        it('should extract locales from environment settings', () => {
            const backupData = {
                locales: [
                    { code: 'en-US' },
                    { code: 'uk-UA' }
                ]
            };

            const locales = extractLocales(backupData);

            expect(locales).toContain('en-US');
            expect(locales).toContain('uk-UA');
        });

        it('should extract locales from entry fields', () => {
            const backupData = {
                entries: [
                    {
                        sys: { id: 'entry1', version: 1, contentType: { sys: { id: 'blogPost' } } },
                        fields: {
                            title: { 'en-US': 'Title', 'fr-FR': 'Titre' }
                        }
                    }
                ]
            };

            const locales = extractLocales(backupData);

            expect(locales).toContain('en-US');
            expect(locales).toContain('fr-FR');
        });

        it('should extract locales from asset fields', () => {
            const backupData = {
                assets: [
                    {
                        fields: {
                            title: { 'en-US': 'Image', 'de-DE': 'Bild' }
                        }
                    }
                ]
            };

            const locales = extractLocales(backupData);

            expect(locales).toContain('en-US');
            expect(locales).toContain('de-DE');
        });

        it('should combine and deduplicate locales from all sources', () => {
            const backupData = {
                locales: [{ code: 'en-US' }],
                entries: [
                    {
                        sys: { id: 'entry1', version: 1, contentType: { sys: { id: 'blogPost' } } },
                        fields: {
                            title: { 'en-US': 'Title', 'uk-UA': 'Заголовок' }
                        }
                    }
                ],
                assets: [
                    {
                        fields: {
                            title: { 'uk-UA': 'Зображення', 'fr-FR': 'Image' }
                        }
                    }
                ]
            };

            const locales = extractLocales(backupData);

            expect(locales).toHaveLength(3);
            expect(locales).toContain('en-US');
            expect(locales).toContain('uk-UA');
            expect(locales).toContain('fr-FR');
        });

        it('should handle empty backup data', () => {
            const locales = extractLocales({});
            expect(locales).toHaveLength(0);
        });
    });
});
