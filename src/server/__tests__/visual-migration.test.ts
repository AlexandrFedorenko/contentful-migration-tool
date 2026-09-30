/**
 * @jest-environment node
 */
import { validateMigrationSteps } from '@/server/visual-migration';
import { generateMigrationCode, q } from '@/utils/code-generator';
import type { MigrationStep } from '@/templates/migration-templates';

const step = (s: Partial<MigrationStep> & Pick<MigrationStep, 'type' | 'operation' | 'params'>): MigrationStep =>
    ({ id: '1', label: 'x', icon: 'x', ...s }) as MigrationStep;

describe('validateMigrationSteps', () => {
    it('accepts well-formed steps', () => {
        expect(() => validateMigrationSteps([
            step({ type: 'contentType', operation: 'createContentType', params: { contentTypeId: 'blogPost', name: "Blog 'Post'" } }),
            step({ type: 'field', operation: 'createField', params: { contentType: 'blogPost', fieldId: 'title', fieldType: 'Symbol' } }),
            step({ type: 'transformation', operation: 'transformEntries', params: { contentType: 'blogPost', sourceField: 'title', targetField: 'slug', transform: 'slug' } }),
        ])).not.toThrow();
    });

    it.each([
        ['custom code', step({ type: 'transformation', operation: 'transformEntries', params: { contentType: 'a', targetField: 't', transform: 'custom', customCode: '() => process.exit()' } })],
        ['customCode on another transform', step({ type: 'transformation', operation: 'transformEntries', params: { contentType: 'a', targetField: 't', transform: 'copy', sourceField: 's', customCode: 'x' } })],
        ['injected id', step({ type: 'contentType', operation: 'createContentType', params: { contentTypeId: "x'); require('child_process'); ('" } })],
        ['injected field', step({ type: 'field', operation: 'deleteField', params: { contentType: 'a', fieldId: 'a;b' } })],
        ['unknown operation', step({ type: 'field', operation: 'dropDatabase', params: { contentType: 'a' } })],
        ['bad derived fields', step({ type: 'transformation', operation: 'deriveLinkedEntries', params: { contentType: 'a', sourceFields: 'ok, bad-field' } })],
    ])('rejects %s', (_name, s) => {
        expect(() => validateMigrationSteps([s])).toThrow();
    });
});

describe('generateMigrationCode escaping', () => {
    it('escapes quotes, backslashes and line terminators', () => {
        const nasty = "a'b\\c\nd e";
        const literal = q(nasty);
        // eslint-disable-next-line no-new-func
        expect(new Function(`return ${literal};`)()).toBe(nasty);
    });

    it('keeps hostile values inert even without server validation', () => {
        const payload = "x'); globalThis.pwned = true; ('";
        const code = generateMigrationCode([
            step({ type: 'contentType', operation: 'createContentType', params: { contentTypeId: payload, name: payload, description: payload } }),
            step({ type: 'field', operation: 'createField', params: { contentType: `ct\n}); globalThis.pwned = true; ({`, fieldId: payload, name: payload } }),
            step({ type: 'transformation', operation: 'transformEntries', params: { contentType: payload, targetField: 'a-b', sourceField: '__proto__', transform: 'findReplace', findText: payload, replaceText: payload } }),
        ], '');

        const calls: unknown[][] = [];
        const chain: unknown = new Proxy(function () {}, {
            get: () => chain,
            apply: (_t, _this, args) => {
                calls.push(args);
                return chain;
            },
        });
        const mod: { exports?: (m: unknown) => void } = {};
        // eslint-disable-next-line no-new-func
        new Function('module', code)(mod);
        mod.exports!(chain);

        expect((globalThis as { pwned?: boolean }).pwned).toBeUndefined();
        expect(calls.some((args) => args[0] === payload)).toBe(true);
    });

    it('produces readable code for normal steps', () => {
        const code = generateMigrationCode([
            step({ type: 'field', operation: 'createField', params: { contentType: 'blogPost', fieldId: 'title', fieldType: 'Symbol', required: true } }),
            step({ type: 'transformation', operation: 'transformEntries', params: { contentType: 'article', sourceField: 'oldTitle', targetField: 'newTitle', transform: 'copy' } }),
        ], '');
        expect(code).toContain("const ct_blogPost = migration.editContentType('blogPost');");
        expect(code).toContain("ct_blogPost.createField('title')");
        expect(code).toContain(".required(true)");
        expect(code).toContain("return { newTitle: fromFields.oldTitle[locale] };");
    });
});
