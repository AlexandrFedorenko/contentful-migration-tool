import { MigrationStep } from '@/templates/migration-templates';

interface TransformParams {
    transform?: string;
    sourceField?: string;
    targetField?: string;
    staticValue?: string;
    contentType?: string;
    derivedContentType?: string;
    sourceFields?: string | string[];
    derivedFields?: string[];
    identityKey?: string;
    shouldPublish?: boolean;
    entryId?: string;
    fieldId?: string;
    newValue?: string;
    findText?: string;
    replaceText?: string;
    [key: string]: unknown;
}

/**
 * Main entry point for generating Contentful migration code
 */
export function generateMigrationCode(steps: MigrationStep[], contentType: string): string {
    if (steps.length === 0) {
        return 'module.exports = function (migration) {\n  // No steps defined\n};';
    }

    let code = 'module.exports = function (migration) {\n';

    // 1. Content Type Creation/Deletion
    const contentTypeSteps = steps.filter(s => s.type === 'contentType');
    contentTypeSteps.forEach(step => {
        code += generateContentTypeCode(step);
    });

    // 2. Field Operations (grouped by Content Type)
    const fieldSteps = steps.filter(s => s.type === 'field');
    if (fieldSteps.length > 0) {
        const fieldsByContentType: Record<string, MigrationStep[]> = {};

        fieldSteps.forEach(step => {
            const ct = (step.params.contentType || contentType || 'YOUR_CONTENT_TYPE') as string;
            if (!fieldsByContentType[ct]) fieldsByContentType[ct] = [];
            fieldsByContentType[ct].push(step);
        });

        Object.entries(fieldsByContentType).forEach(([ct, steps]) => {
            code += `\n  // Field operations for: ${ct}\n`;
            code += `  const ct_${ct.replace(/[^a-zA-Z0-9]/g, '_')} = migration.editContentType('${ct}');\n`;
            steps.forEach(step => {
                code += generateFieldCode(step, `ct_${ct.replace(/[^a-zA-Z0-9]/g, '_')}`);
            });
        });
    }

    // 3. Transformation Operations
    const transformSteps = steps.filter(s => s.type === 'transformation');
    transformSteps.forEach(step => {
        code += generateTransformCode(step);
    });

    code += '};\n';
    return code;
}

/**
 * Formats a value for inclusion in the generated Javascript code
 */
function formatValue(value: unknown): string {
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            // If it's a valid JSON string but not a primitive, keep as JSON
            if (parsed && typeof parsed === 'object') return JSON.stringify(parsed);
            return `String(${JSON.stringify(value)})`;
        } catch {
            return `String('${String(value).replace(/'/g, "\\'")}')`;
        }
    }
    return JSON.stringify(value);
}

function generateContentTypeCode(step: MigrationStep): string {
    const { operation, params } = step;
    const ctId = params.contentTypeId;

    if (operation === 'createContentType') {
        return `\n  // Create Content Type: ${ctId}
  migration.createContentType('${ctId}', {
    name: '${params.name || ctId}'${params.description ? `,\n    description: '${String(params.description).replace(/'/g, "\\'")}'` : ''}
  });\n`;
    }

    if (operation === 'deleteContentType') {
        return `\n  // Delete Content Type: ${ctId}
  migration.deleteContentType('${ctId}');\n`;
    }

    return '';
}

function generateFieldCode(step: MigrationStep, ctVar: string = 'ct'): string {
    const { operation, params } = step;
    const fieldId = params.fieldId;
    let code = '';

    switch (operation) {
        case 'createField':
            code += `  ${ctVar}.createField('${fieldId}')\n`;

            // Handle Type mapping
            const isMany = params.linkType === 'ManyEntry' || params.linkType === 'ManyAsset';
            const type = isMany ? 'Array' : (params.fieldType === 'Media' ? 'Link' : params.fieldType || 'Symbol');

            code += `    .type('${type}')\n`;

            if (isMany) {
                const linkType = params.linkType === 'ManyEntry' ? 'Entry' : 'Asset';
                code += `    .items({ type: 'Link', linkType: '${linkType}' })\n`;
            } else if (type === 'Link') {
                code += `    .linkType('${params.linkType || (params.fieldType === 'Media' ? 'Asset' : 'Entry')}')\n`;
            } else if (type === 'Array') {
                const itemType = params.arrayItemType || 'Symbol';
                if (itemType === 'Link') {
                    code += `    .items({ type: 'Link', linkType: '${params.arrayLinkType || 'Entry'}' })\n`;
                } else {
                    code += `    .items({ type: '${itemType}' })\n`;
                }
            }

            if (params.required) code += `    .required(true)\n`;
            code += `    .name('${params.name || fieldId}');\n`;

            if (params.isDisplayField) code += `  ${ctVar}.displayField('${fieldId}');\n`;
            if (params.widgetId) {
                const widgetNamespace = params.widgetNamespace || 'builtin';
                code += `  ${ctVar}.changeFieldControl('${fieldId}', '${widgetNamespace}', '${params.widgetId}');\n`;
            }
            return code + '\n';

        case 'deleteField':
            return `  ${ctVar}.deleteField('${fieldId}');\n`;

        case 'renameField':
            code = `  ${ctVar}.changeFieldId('${params.oldFieldId}', '${params.newFieldId}');\n`;
            if (params.newFieldName) {
                code += `  ${ctVar}.editField('${params.newFieldId}').name('${params.newFieldName}');\n`;
            }
            return code;

        case 'addValidation':
            return `  ${ctVar}.editField('${fieldId}').required(true);\n`;

        case 'editField': {
            code = '';
            if (params.name) {
                code += `  ${ctVar}.editField('${fieldId}').name('${params.name}');\n`;
            }

            // Safety measure: Contentful API fails if a field is both Hidden/Read-Only and Required.
            const isReadonlyOrHidden = params.disabled || params.omitted;
            if (isReadonlyOrHidden) {
                code += `  ${ctVar}.editField('${fieldId}').required(false);\n`;
            } else if (params.required !== undefined) {
                code += `  ${ctVar}.editField('${fieldId}').required(${!!params.required});\n`;
            }

            if (params.disabled !== undefined) {
                code += `  ${ctVar}.editField('${fieldId}').disabled(${!!params.disabled});\n`;
            }
            if (params.omitted !== undefined) {
                code += `  ${ctVar}.editField('${fieldId}').omitted(${!!params.omitted});\n`;
            }
            if (params.widgetId) {
                const widgetNamespace = params.widgetNamespace || 'builtin';
                code += `  ${ctVar}.changeFieldControl('${fieldId}', '${widgetNamespace}', '${params.widgetId}');\n`;
            }
            return code || `  // editField: no changes specified for '${fieldId}'\n`;
        }

        case 'setDisplayField':
            return `  ${ctVar}.displayField('${fieldId}');\n`;

        case 'moveField': {
            const direction = params.direction || 'afterField';
            const refField = params.referenceField || '';
            if (direction === 'toTheTop') {
                return `  ${ctVar}.moveField('${fieldId}').toTheTop();\n`;
            } else if (direction === 'toTheBottom') {
                return `  ${ctVar}.moveField('${fieldId}').toTheBottom();\n`;
            } else {
                return `  ${ctVar}.moveField('${fieldId}').${direction}('${refField}');\n`;
            }
        }

        case 'changeFieldControl': {
            const wns = params.widgetNamespace || 'builtin';
            return `  ${ctVar}.changeFieldControl('${fieldId}', '${wns}', '${params.widgetId}');\n`;
        }

        default:
            return '';
    }
}

function generateTransformCode(step: MigrationStep): string {
    const { operation, params } = step;
    const p = params as TransformParams;

    if (operation === 'updateEntry') {
        const valCode = formatValue(p.newValue);
        return `\n  // Update specific entry: ${p.entryId}
  migration.transformEntries({
    contentType: '${p.contentType}',
    from: ['${p.fieldId}'],
    to: ['${p.fieldId}'],
    transformEntryForLocale: (fromFields, locale, { id }) => {
      if (id === '${p.entryId}') return { '${p.fieldId}': ${valCode} };
      return undefined;
    }
  });\n`;
    }

    if (operation === 'transformEntries') {
        const isReplace = p.transform === 'replace';
        // For in-place transforms (findReplace, lowercase, trim, etc.), source = target
        const effectiveSource = p.sourceField || p.targetField || '';
        const fromArr = isReplace ? [] : [`'${effectiveSource}'`];
        return `\n  // Transformation: ${p.transform} on ${p.contentType}
  migration.transformEntries({
    contentType: '${p.contentType}',
    from: [${fromArr.join(', ')}],
    to: ['${p.targetField}'],
    transformEntryForLocale: (fromFields, locale) => {
      ${generateTransformLogic({ ...p, sourceField: effectiveSource })}
    }
  });\n`;
    }

    if (operation === 'deriveLinkedEntries') {
        return generateDeriveLinkedEntriesCode(p);
    }

    return '';
}

function generateDeriveLinkedEntriesCode(p: TransformParams): string {
    const sourceFields = typeof p.sourceFields === 'string'
        ? p.sourceFields.split(',').map(s => s.trim())
        : (p.sourceFields as string[]) || [];

    let code = `\n  // Derive ${p.derivedContentType} from ${p.contentType}\n`;
    code += `  const dCt = migration.createContentType('${p.derivedContentType}', { name: '${p.derivedContentType}' });\n`;

    sourceFields.forEach(f => {
        code += `  dCt.createField('${f}').name('${f}').type('Symbol');\n`;
    });

    code += `\n  migration.editContentType('${p.contentType}')
    .createField('${p.targetField}')
    .name('${p.targetField}')
    .type('Link')
    .linkType('Entry')
    .validations([{ linkContentType: ['${p.derivedContentType}'] }]);\n\n`;

    code += `  migration.deriveLinkedEntries({
    contentType: '${p.contentType}',
    derivedContentType: '${p.derivedContentType}',
    from: ${JSON.stringify(sourceFields)},
    toReferenceField: '${p.targetField}',
    derivedFields: ${JSON.stringify(sourceFields)},
    identityKey: async (fromFields) => {
       // Identity key handles multiple fields
       return ${sourceFields.map(f => `(fromFields['${f}']?.['en-US'] || 'default')`).join(' + "_" + ')};
    },
    deriveEntryForLocale: (inputFields, locale) => ({
${sourceFields.map(f => `      ${f}: inputFields.${f}[locale]`).join(',\n')}
    })
  });\n`;

    return code;
}

function generateTransformLogic(params: TransformParams): string {
    const { transform, sourceField, targetField, staticValue } = params;

    switch (transform) {
        case 'replace':
            return `return { ${targetField}: ${formatValue(staticValue)} };`;
        case 'copy':
            return `return { ${targetField}: fromFields.${sourceField}[locale] };`;
        case 'slug':
            return `const val = fromFields.${sourceField}?.[locale];
      if (!val) return undefined;
      return { ${targetField}: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') };`;
        case 'lowercase':
            return `return { ${targetField}: fromFields.${sourceField}?.[locale]?.toLowerCase() };`;
        case 'uppercase':
            return `return { ${targetField}: fromFields.${sourceField}?.[locale]?.toUpperCase() };`;
        case 'trim':
            return `return { ${targetField}: fromFields.${sourceField}?.[locale]?.trim() };`;
        case 'defaultLocale':
            return `return { ${targetField}: fromFields.${sourceField}?.[locale] || fromFields.${sourceField}?.['en-US'] };`;
        case 'clearEmpty':
            return `const val = fromFields.${sourceField}?.[locale];
      return { ${targetField}: (typeof val === 'string' && val.trim() === '') ? undefined : val };`;
        case 'findReplace': {
            const findText = params.findText || '';
            const replaceText = params.replaceText || '';
            return `const val = fromFields.${sourceField}?.[locale];
      if (typeof val !== 'string') return undefined;
      return { ${targetField}: val.split('${findText.replace(/'/g, "\\'").replace(/\\/g, '\\\\')}').join('${replaceText.replace(/'/g, "\\'").replace(/\\/g, '\\\\')}') };`;
        }
        case 'custom': {
            if (params.customCode && typeof params.customCode === 'string') {
                return `const customTransform = ${params.customCode};
      return customTransform(fromFields, locale);`;
            }
            return `return { ${targetField}: fromFields.${sourceField}?.[locale] };`;
        }
        default:
            return `return { ${targetField}: fromFields.${sourceField}?.[locale] };`;
    }
}
