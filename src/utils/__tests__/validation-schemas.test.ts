import { createFieldSchema, transformEntriesSchema } from '../validation-schemas';

describe('validation-schemas', () => {
    describe('createFieldSchema', () => {
        it('should validate a valid symbol field', () => {
            const validData = {
                fieldId: 'title',
                fieldType: 'Symbol',
                required: true
            };
            const result = createFieldSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });

        it('should fail if fieldId starts with a number', () => {
            const invalidData = {
                fieldId: '1title',
                fieldType: 'Symbol'
            };
            const result = createFieldSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
            if (!result.success) {
                expect(result.error.issues[0].message).toContain('Must start with a letter');
            }
        });

        it('should fail if Link field is missing linkType', () => {
            const invalidData = {
                fieldId: 'related',
                fieldType: 'Link'
            };
            const result = createFieldSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should validate a valid Link field', () => {
            const validData = {
                fieldId: 'related',
                fieldType: 'Link',
                linkType: 'Entry'
            };
            const result = createFieldSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });

    describe('transformEntriesSchema', () => {
        it('should fail if neither sourceField nor staticValue (for replace) is provided', () => {
            const invalidData = {
                contentType: 'post',
                targetField: 'newField',
                transform: 'copy' // requires sourceField
            };
            const result = transformEntriesSchema.safeParse(invalidData);
            expect(result.success).toBe(false);
        });

        it('should validate valid copy transformation', () => {
            const validData = {
                contentType: 'post',
                targetField: 'newField',
                transform: 'copy',
                sourceField: 'oldField'
            };
            const result = transformEntriesSchema.safeParse(validData);
            expect(result.success).toBe(true);
        });
    });
});
