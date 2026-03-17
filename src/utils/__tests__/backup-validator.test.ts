import {
    validateBackupStructure,
    hasContentTypes,
    getBackupStats,
    filterByContentTypes,
    filterByLocales
} from '../backup-validator';
import { BackupData } from '@/types/backup';

describe('Backup Validator', () => {
    describe('validateBackupStructure', () => {
        it('should validate a correct backup structure', () => {
            const validBackup = {
                contentTypes: [
                    { sys: { id: 'blogPost' }, name: 'Blog Post', fields: [] }
                ],
                entries: [
                    {
                        sys: { id: 'entry1', contentType: { sys: { id: 'blogPost' } } },
                        fields: {}
                    }
                ],
                assets: [
                    { sys: { id: 'asset1' }, fields: {} }
                ],
                locales: [
                    { code: 'en-US', name: 'English', default: true }
                ]
            };

            const result = validateBackupStructure(validBackup);
            expect(result.valid).toBe(true);
            expect(result.errors).toHaveLength(0);
        });

        it('should reject non-object data', () => {
            const result = validateBackupStructure(null);
            expect(result.valid).toBe(false);
            expect(result.errors).toContain('Backup data must be an object');
        });

        it('should detect missing sys.id in content types', () => {
            const invalidBackup = {
                contentTypes: [
                    { fields: [] } // Missing sys.id
                ]
            };

            const result = validateBackupStructure(invalidBackup);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('missing sys.id'))).toBe(true);
        });

        it('should detect invalid fields array in content types', () => {
            const invalidBackup = {
                contentTypes: [
                    { sys: { id: 'test' }, fields: 'not-an-array' }
                ]
            };

            const result = validateBackupStructure(invalidBackup);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('invalid fields array'))).toBe(true);
        });

        it('should detect missing contentType reference in entries', () => {
            const invalidBackup = {
                entries: [
                    { sys: { id: 'entry1' }, fields: {} } // Missing contentType
                ]
            };

            const result = validateBackupStructure(invalidBackup);
            expect(result.valid).toBe(false);
            expect(result.errors.some(e => e.includes('missing contentType reference'))).toBe(true);
        });

        it('should warn about missing default locale', () => {
            const backupWithoutDefault = {
                locales: [
                    { code: 'en-US', name: 'English' },
                    { code: 'uk-UA', name: 'Ukrainian' }
                ]
            };

            const result = validateBackupStructure(backupWithoutDefault);
            expect(result.warnings).toContain('No default locale specified');
        });

        it('should warn about empty backup', () => {
            const emptyBackup = {};

            const result = validateBackupStructure(emptyBackup);
            expect(result.warnings.some(w => w.includes('no content types, entries, or assets'))).toBe(true);
        });
    });

    describe('hasContentTypes', () => {
        const backup: BackupData = {
            contentTypes: [
                { sys: { id: 'blogPost' }, name: 'Blog Post', fields: [] },
                { sys: { id: 'author' }, name: 'Author', fields: [] }
            ]
        };

        it('should return true if all content types exist', () => {
            expect(hasContentTypes(backup, ['blogPost', 'author'])).toBe(true);
        });

        it('should return false if some content types are missing', () => {
            expect(hasContentTypes(backup, ['blogPost', 'missing'])).toBe(false);
        });

        it('should return false if backup has no content types', () => {
            expect(hasContentTypes({}, ['blogPost'])).toBe(false);
        });
    });

    describe('getBackupStats', () => {
        it('should count all items correctly', () => {
            const backup: BackupData = {
                contentTypes: [{ sys: { id: 'ct1' }, name: 'CT1', fields: [] }],
                entries: [
                    { sys: { id: 'e1', contentType: { sys: { id: 'ct1' } } }, fields: {} },
                    { sys: { id: 'e2', contentType: { sys: { id: 'ct1' } } }, fields: {} }
                ],
                assets: [{ sys: { id: 'a1' }, fields: {} }],
                locales: [{ code: 'en-US', name: 'English' }]
            };

            const stats = getBackupStats(backup);
            expect(stats.contentTypes).toBe(1);
            expect(stats.entries).toBe(2);
            expect(stats.assets).toBe(1);
            expect(stats.locales).toBe(1);
        });

        it('should return zeros for empty backup', () => {
            const stats = getBackupStats({});
            expect(stats.contentTypes).toBe(0);
            expect(stats.entries).toBe(0);
            expect(stats.assets).toBe(0);
            expect(stats.locales).toBe(0);
        });
    });

    describe('filterByContentTypes', () => {
        const backup: BackupData = {
            contentTypes: [
                { sys: { id: 'blogPost' }, name: 'Blog Post', fields: [] },
                { sys: { id: 'author' }, name: 'Author', fields: [] }
            ],
            entries: [
                { sys: { id: 'e1', contentType: { sys: { id: 'blogPost' } } }, fields: {} },
                { sys: { id: 'e2', contentType: { sys: { id: 'author' } } }, fields: {} }
            ]
        };

        it('should filter content types and related entries', () => {
            const filtered = filterByContentTypes(backup, ['blogPost']);

            expect(filtered.contentTypes).toHaveLength(1);
            expect(filtered.contentTypes![0].sys.id).toBe('blogPost');
            expect(filtered.entries).toHaveLength(1);
            expect(filtered.entries![0].sys.id).toBe('e1');
        });

        it('should return empty arrays when no matches', () => {
            const filtered = filterByContentTypes(backup, ['nonexistent']);

            expect(filtered.contentTypes).toHaveLength(0);
            expect(filtered.entries).toHaveLength(0);
        });
    });

    describe('filterByLocales', () => {
        const backup: BackupData = {
            locales: [
                { code: 'en-US', name: 'English' },
                { code: 'uk-UA', name: 'Ukrainian' }
            ],
            entries: [
                {
                    sys: { id: 'e1', contentType: { sys: { id: 'blogPost' } } },
                    fields: {
                        title: {
                            'en-US': 'Hello',
                            'uk-UA': 'Привіт'
                        },
                        body: {
                            'en-US': 'Content',
                            'uk-UA': 'Контент'
                        }
                    }
                }
            ]
        };

        it('should filter locales and field values', () => {
            const filtered = filterByLocales(backup, ['en-US']);

            expect(filtered.locales).toHaveLength(1);
            expect(filtered.locales![0].code).toBe('en-US');

            const entry = filtered.entries![0];
            expect(entry.fields!.title).toEqual({ 'en-US': 'Hello' });
            expect(entry.fields!.body).toEqual({ 'en-US': 'Content' });
        });

        it('should preserve non-localized fields', () => {
            const backupWithMixed: BackupData = {
                entries: [
                    {
                        sys: { id: 'e1', contentType: { sys: { id: 'test' } } },
                        fields: {
                            localizedField: { 'en-US': 'value' },
                            nonLocalizedField: 'simple-value'
                        }
                    }
                ]
            };

            const filtered = filterByLocales(backupWithMixed, ['en-US']);
            const entry = filtered.entries![0];

            expect(entry.fields!.localizedField).toEqual({ 'en-US': 'value' });
            expect(entry.fields!.nonLocalizedField).toBe('simple-value');
        });
    });
});
