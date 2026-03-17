import { z } from 'zod';

const idSchema = z.string()
    .min(1, 'Required field')
    .regex(/^[a-zA-Z][a-zA-Z0-9_]*$/, 'Must start with a letter and contain only letters, numbers, and underscores');

export const createContentTypeSchema = z.object({
    contentTypeId: idSchema,
    name: z.string().min(1, 'Required field'),
    description: z.string().optional()
});

export const deleteContentTypeSchema = z.object({
    contentTypeId: idSchema
});

export const createFieldSchema = z.object({
    contentType: z.string().optional(),
    fieldId: idSchema,
    fieldType: z.string().min(1, 'Required field'),
    linkType: z.string().optional(),
    arrayItemType: z.string().optional(),
    arrayLinkType: z.string().optional(),
    required: z.boolean().optional(),
    isDisplayField: z.boolean().optional()
}).refine((data) => {
    if (data.fieldType === 'Link' && !data.linkType) return false;
    if (data.fieldType === 'Array' && !data.arrayItemType) return false;
    return true;
}, {
    message: 'Link fields require Link Type, Array fields require Array Item Type'
});

export const renameFieldSchema = z.object({
    oldFieldId: idSchema,
    newFieldId: idSchema
});

export const deleteFieldSchema = z.object({
    fieldId: idSchema
});

export const transformEntriesSchema = z.object({
    contentType: z.string().min(1, 'Required field'),
    sourceField: z.string().optional(),
    targetField: z.string().min(1, 'Required field'),
    transform: z.string().optional(),
    customCode: z.string().optional(),
    staticValue: z.string().optional()
}).refine((data) => {
    if (data.transform === 'replace') return !!data.staticValue;
    return !!data.sourceField;
}, {
    message: "Source Field is required (or Static Value for 'Replace')"
});

export const deriveLinkedEntriesSchema = z.object({
    contentType: z.string().min(1, 'Required field'),
    derivedContentType: z.string().min(1, 'Required field'),
    sourceFields: z.string().min(1, 'Required field'),
    targetField: z.string().min(1, 'Required field'),
    setAsDisplayField: z.boolean().optional()
});
