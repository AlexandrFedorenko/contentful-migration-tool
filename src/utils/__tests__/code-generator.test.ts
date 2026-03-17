import { generateMigrationCode } from '../code-generator';
import { MigrationStep } from '@/templates/migration-templates';

// Mock MigrationStep factory
const createStep = (overrides: Partial<MigrationStep>): MigrationStep => ({
    id: 'test-id',
    type: 'contentType',
    operation: 'createContentType',
    params: {},
    label: 'Test Label',
    icon: 'TestIcon',
    ...overrides
});

describe('generateMigrationCode', () => {
    it('should generate empty migration skeleton when no steps provided', () => {
        const code = generateMigrationCode([], 'test-ct');
        expect(code).toContain('module.exports = function (migration) {');
        expect(code).toContain('// No steps defined');
    });

    it('should generate code for creating a content type', () => {
        const step = createStep({
            type: 'contentType',
            operation: 'createContentType',
            params: {
                contentTypeId: 'blogPost',
                name: 'Blog Post',
                description: 'A blog post entry'
            }
        });

        const code = generateMigrationCode([step], '');

        expect(code).toContain("migration.createContentType('blogPost', {");
        expect(code).toContain("name: 'Blog Post'");
        expect(code).toContain("description: 'A blog post entry'");
    });

    it('should generate code for creating a field', () => {
        const step = createStep({
            type: 'field',
            operation: 'createField',
            params: {
                contentType: 'blogPost',
                fieldId: 'title',
                fieldType: 'Symbol',
                required: true
            }
        });

        const code = generateMigrationCode([step], '');

        expect(code).toContain("const ct = migration.editContentType('blogPost');");
        expect(code).toContain("ct.createField('title')");
        expect(code).toContain(".type('Symbol')");
        expect(code).toContain(".required(true)");
    });

    it('should generate code for data transformation (bulk update)', () => {
        const step = createStep({
            type: 'transformation',
            operation: 'transformEntries',
            params: {
                contentType: 'article',
                sourceField: 'oldTitle',
                targetField: 'newTitle',
                transform: 'copy'
            }
        });

        const code = generateMigrationCode([step], '');

        expect(code).toContain("migration.transformEntries({");
        expect(code).toContain("contentType: 'article'");
        expect(code).toContain("from: ['oldTitle']");
        expect(code).toContain("to: ['newTitle']");
        // Check for the transformation logic (copy)
        expect(code).toContain("return { newTitle: fromFields.oldTitle[locale] };");
    });

    it('should generate code for in-place transformation (e.g., lowercase)', () => {
        const step = createStep({
            type: 'transformation',
            operation: 'transformEntries',
            params: {
                contentType: 'article',
                targetField: 'email',
                transform: 'lowercase'
            }
        });

        const code = generateMigrationCode([step], '');

        expect(code).toContain("from: ['email']");
        expect(code).toContain("to: ['email']");
        expect(code).toContain("return { email: fromFields.email?.[locale]?.toLowerCase() };");
    });

    it('should generate code for static value replacement (replace)', () => {
        const step = createStep({
            type: 'transformation',
            operation: 'transformEntries',
            params: {
                contentType: 'article',
                targetField: 'status',
                transform: 'replace',
                staticValue: 'active'
            }
        });

        const code = generateMigrationCode([step], '');

        expect(code).toContain("from: []");
        expect(code).toContain("to: ['status']");
        expect(code).toContain("return { status: 'active' };");
    });

    it('should generate code for changing field control (widget)', () => {
        const step = createStep({
            type: 'field',
            operation: 'changeFieldControl',
            params: {
                contentType: 'article',
                fieldId: 'status',
                widgetId: 'dropdown',
                widgetNamespace: 'builtin'
            }
        });

        const code = generateMigrationCode([step], '');

        expect(code).toContain("const ct = migration.editContentType('article');");
        expect(code).toContain("ct.changeFieldControl('status', 'builtin', 'dropdown');");
    });
});
