import { z } from 'zod';
import type { MigrationStep } from '@/templates/migration-templates';
import { FIELD_ID_RE, RESOURCE_ID_RE } from '@/server/validation';

/**
 * Server-side allow-list for Visual Builder steps. Only steps that pass this
 * schema are turned into migration code and executed; anything unexpected
 * (unknown operations, custom JavaScript, malformed ids) is rejected.
 */

const ctId = z.string().regex(RESOURCE_ID_RE, 'Invalid content type id');
const fId = z.string().regex(FIELD_ID_RE, 'Invalid field id');
const text = z.string().max(500);
const widget = z.string().regex(/^[a-zA-Z0-9_-]{1,64}$/, 'Invalid widget id');

const fieldType = z.enum(['Symbol', 'Text', 'RichText', 'Integer', 'Number', 'Date', 'Boolean', 'Object', 'Location', 'Link', 'Array', 'Media']);
const linkType = z.enum(['Entry', 'Asset', 'ManyEntry', 'ManyAsset']);
const transformKind = z.enum(['replace', 'copy', 'slug', 'lowercase', 'uppercase', 'trim', 'defaultLocale', 'clearEmpty', 'findReplace']);

const base = { id: z.string().max(100), label: z.string().max(200).optional(), icon: z.string().max(50).optional() };

const contentTypeStep = z.object({
    ...base,
    type: z.literal('contentType'),
    operation: z.enum(['createContentType', 'deleteContentType']),
    params: z.object({ contentTypeId: ctId, name: text.optional(), description: text.optional() }).passthrough(),
});

const fieldStep = z.object({
    ...base,
    type: z.literal('field'),
    operation: z.enum(['createField', 'deleteField', 'renameField', 'addValidation', 'editField', 'setDisplayField', 'moveField', 'changeFieldControl']),
    params: z.object({
        contentType: ctId,
        fieldId: fId.optional(),
        name: text.optional(),
        fieldType: fieldType.optional(),
        linkType: linkType.optional(),
        arrayItemType: z.enum(['Symbol', 'Link']).optional(),
        arrayLinkType: z.enum(['Entry', 'Asset']).optional(),
        required: z.boolean().optional(),
        disabled: z.boolean().optional(),
        omitted: z.boolean().optional(),
        isDisplayField: z.boolean().optional(),
        widgetId: widget.optional(),
        widgetNamespace: z.enum(['builtin', 'extension', 'app', 'sidebar-builtin', 'editor-builtin']).optional(),
        oldFieldId: fId.optional(),
        newFieldId: fId.optional(),
        newFieldName: text.optional(),
        direction: z.enum(['toTheTop', 'toTheBottom', 'afterField', 'beforeField']).optional(),
        referenceField: fId.optional(),
    }).passthrough(),
});

const transformStep = z.object({
    ...base,
    type: z.literal('transformation'),
    operation: z.enum(['transformEntries', 'updateEntry', 'deriveLinkedEntries']),
    params: z.object({
        contentType: ctId,
        transform: transformKind.optional(),
        sourceField: fId.optional(),
        targetField: fId.optional(),
        staticValue: z.union([z.string().max(10_000), z.number(), z.boolean(), z.null()]).optional(),
        findText: text.optional(),
        replaceText: text.optional(),
        entryId: z.string().regex(RESOURCE_ID_RE).optional(),
        fieldId: fId.optional(),
        newValue: z.union([z.string().max(10_000), z.number(), z.boolean(), z.null()]).optional(),
        derivedContentType: ctId.optional(),
        sourceFields: z.union([z.string().max(1000), z.array(fId).max(50)]).optional(),
    }).passthrough(),
}).superRefine((step, ctx) => {
    if ('customCode' in step.params) {
        ctx.addIssue({ code: 'custom', message: 'Custom code transformations cannot run on the server. Download the script and run it locally.' });
    }
    if (typeof step.params.sourceFields === 'string') {
        for (const f of step.params.sourceFields.split(',').map((s) => s.trim()).filter(Boolean)) {
            if (!FIELD_ID_RE.test(f)) ctx.addIssue({ code: 'custom', message: `Invalid field id "${f.slice(0, 40)}"` });
        }
    }
});

export const MigrationStepsSchema = z.array(z.union([contentTypeStep, fieldStep, transformStep])).min(1).max(200);

/** Validate untrusted steps. Throws ZodError with readable issues. */
export function validateMigrationSteps(steps: unknown): MigrationStep[] {
    return MigrationStepsSchema.parse(steps) as unknown as MigrationStep[];
}
