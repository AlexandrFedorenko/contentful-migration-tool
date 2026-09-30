import { MigrationStep } from '@/templates/migration-templates';

/**
 * Generates a contentful-migration script from Visual Builder steps.
 *
 * The same code runs in the browser (live preview / download) and on the server
 * (execution in the worker). It must therefore be injection-proof on its own:
 * every user value is emitted through q() (a fully escaped JS string literal),
 * key() / prop() (identifier or bracket notation) or comment() (single line).
 * On the server, steps are additionally validated by validateMigrationSteps()
 * before this function is called.
 */

interface TransformParams {
    transform?: string;
    sourceField?: string;
    targetField?: string;
    staticValue?: unknown;
    contentType?: string;
    derivedContentType?: string;
    sourceFields?: string | string[];
    entryId?: string;
    fieldId?: string;
    newValue?: unknown;
    findText?: string;
    replaceText?: string;
    customCode?: string;
    [key: string]: unknown;
}

const IDENTIFIER = /^[A-Za-z_$][\w$]*$/;

/** Single-quoted JS string literal with every dangerous character escaped. */
export function q(value: unknown): string {
    const s = String(value ?? '');
    return `'${s.replace(/[\\'\n\r\t\u2028\u2029]/g, (c) => ({
        '\\': '\\\\', "'": "\\'", '\n': '\\n', '\r': '\\r', '\t': '\\t', '\u2028': '\\u2028', '\u2029': '\\u2029',
    }[c] as string))}'`;
}

/** Object literal key: bare identifier when safe, computed string otherwise. */
function key(name: unknown): string {
    const s = String(name ?? '');
    return IDENTIFIER.test(s) ? s : `[${q(s)}]`;
}

/** Property access: obj.name when safe, obj['name'] otherwise. */
function prop(obj: string, name: unknown, optional = false): string {
    const s = String(name ?? '');
    if (IDENTIFIER.test(s)) return `${obj}${optional ? '?.' : '.'}${s}`;
    return `${obj}${optional ? '?.' : ''}[${q(s)}]`;
}

/** Text safe inside a // comment (no line breaks). */
function comment(text: unknown): string {
    return String(text ?? '').replace(/[\r\n\u2028\u2029]+/g, ' ').slice(0, 200);
}

function varName(ct: string): string {
    return `ct_${ct.replace(/[^a-zA-Z0-9]/g, '_')}`;
}

/** Main entry point for generating Contentful migration code */
export function generateMigrationCode(steps: MigrationStep[], contentType: string): string {
    if (steps.length === 0) {
        return 'module.exports = function (migration) {\n  // No steps defined\n};';
    }

    let code = 'module.exports = function (migration) {\n';

    steps.filter((s) => s.type === 'contentType').forEach((step) => {
        code += generateContentTypeCode(step);
    });

    const fieldSteps = steps.filter((s) => s.type === 'field');
    if (fieldSteps.length > 0) {
        const byContentType = new Map<string, MigrationStep[]>();
        fieldSteps.forEach((step) => {
            const ct = String(step.params.contentType || contentType || 'YOUR_CONTENT_TYPE');
            byContentType.set(ct, [...(byContentType.get(ct) ?? []), step]);
        });
        byContentType.forEach((ctSteps, ct) => {
            const v = varName(ct);
            code += `\n  // Field operations for: ${comment(ct)}\n`;
            code += `  const ${v} = migration.editContentType(${q(ct)});\n`;
            ctSteps.forEach((step) => {
                code += generateFieldCode(step, v);
            });
        });
    }

    steps.filter((s) => s.type === 'transformation').forEach((step) => {
        code += generateTransformCode(step);
    });

    code += '};\n';
    return code;
}

/** Formats a user-provided value as a JS expression (JSON objects stay objects). */
function formatValue(value: unknown): string {
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (parsed && typeof parsed === 'object') return JSON.stringify(parsed);
        } catch {
            /* plain string */
        }
        return q(value);
    }
    return JSON.stringify(value ?? null);
}

function generateContentTypeCode(step: MigrationStep): string {
    const { operation, params } = step;
    const ctId = params.contentTypeId;

    if (operation === 'createContentType') {
        return `\n  // Create Content Type: ${comment(ctId)}
  migration.createContentType(${q(ctId)}, {
    name: ${q(params.name || ctId)}${params.description ? `,\n    description: ${q(params.description)}` : ''}
  });\n`;
    }
    if (operation === 'deleteContentType') {
        return `\n  // Delete Content Type: ${comment(ctId)}
  migration.deleteContentType(${q(ctId)});\n`;
    }
    return '';
}

function generateFieldCode(step: MigrationStep, ctVar = 'ct'): string {
    const { operation, params } = step;
    const fieldId = params.fieldId;
    let code = '';

    switch (operation) {
        case 'createField': {
            code += `  ${ctVar}.createField(${q(fieldId)})\n`;
            const isMany = params.linkType === 'ManyEntry' || params.linkType === 'ManyAsset';
            const type = isMany ? 'Array' : (params.fieldType === 'Media' ? 'Link' : params.fieldType || 'Symbol');
            code += `    .type(${q(type)})\n`;

            if (isMany) {
                code += `    .items({ type: 'Link', linkType: ${q(params.linkType === 'ManyEntry' ? 'Entry' : 'Asset')} })\n`;
            } else if (type === 'Link') {
                code += `    .linkType(${q(params.linkType || (params.fieldType === 'Media' ? 'Asset' : 'Entry'))})\n`;
            } else if (type === 'Array') {
                const itemType = params.arrayItemType || 'Symbol';
                code += itemType === 'Link'
                    ? `    .items({ type: 'Link', linkType: ${q(params.arrayLinkType || 'Entry')} })\n`
                    : `    .items({ type: ${q(itemType)} })\n`;
            }

            if (params.required) code += `    .required(true)\n`;
            code += `    .name(${q(params.name || fieldId)});\n`;

            if (params.isDisplayField) code += `  ${ctVar}.displayField(${q(fieldId)});\n`;
            if (params.widgetId) {
                code += `  ${ctVar}.changeFieldControl(${q(fieldId)}, ${q(params.widgetNamespace || 'builtin')}, ${q(params.widgetId)});\n`;
            }
            return code + '\n';
        }

        case 'deleteField':
            return `  ${ctVar}.deleteField(${q(fieldId)});\n`;

        case 'renameField':
            code = `  ${ctVar}.changeFieldId(${q(params.oldFieldId)}, ${q(params.newFieldId)});\n`;
            if (params.newFieldName) {
                code += `  ${ctVar}.editField(${q(params.newFieldId)}).name(${q(params.newFieldName)});\n`;
            }
            return code;

        case 'addValidation':
            return `  ${ctVar}.editField(${q(fieldId)}).required(true);\n`;

        case 'editField': {
            if (params.name) code += `  ${ctVar}.editField(${q(fieldId)}).name(${q(params.name)});\n`;
            // Contentful rejects a field that is both hidden/read-only and required.
            if (params.disabled || params.omitted) {
                code += `  ${ctVar}.editField(${q(fieldId)}).required(false);\n`;
            } else if (params.required !== undefined) {
                code += `  ${ctVar}.editField(${q(fieldId)}).required(${!!params.required});\n`;
            }
            if (params.disabled !== undefined) code += `  ${ctVar}.editField(${q(fieldId)}).disabled(${!!params.disabled});\n`;
            if (params.omitted !== undefined) code += `  ${ctVar}.editField(${q(fieldId)}).omitted(${!!params.omitted});\n`;
            if (params.widgetId) {
                code += `  ${ctVar}.changeFieldControl(${q(fieldId)}, ${q(params.widgetNamespace || 'builtin')}, ${q(params.widgetId)});\n`;
            }
            return code || `  // editField: no changes specified for ${comment(fieldId)}\n`;
        }

        case 'setDisplayField':
            return `  ${ctVar}.displayField(${q(fieldId)});\n`;

        case 'moveField': {
            const direction = String(params.direction || 'afterField');
            if (direction === 'toTheTop') return `  ${ctVar}.moveField(${q(fieldId)}).toTheTop();\n`;
            if (direction === 'toTheBottom') return `  ${ctVar}.moveField(${q(fieldId)}).toTheBottom();\n`;
            const method = direction === 'beforeField' ? 'beforeField' : 'afterField';
            return `  ${ctVar}.moveField(${q(fieldId)}).${method}(${q(params.referenceField || '')});\n`;
        }

        case 'changeFieldControl':
            return `  ${ctVar}.changeFieldControl(${q(fieldId)}, ${q(params.widgetNamespace || 'builtin')}, ${q(params.widgetId)});\n`;

        default:
            return '';
    }
}

function generateTransformCode(step: MigrationStep): string {
    const { operation, params } = step;
    const p = params as TransformParams;

    if (operation === 'updateEntry') {
        return `\n  // Update specific entry: ${comment(p.entryId)}
  migration.transformEntries({
    contentType: ${q(p.contentType)},
    from: [${q(p.fieldId)}],
    to: [${q(p.fieldId)}],
    transformEntryForLocale: (fromFields, locale, { id }) => {
      if (id === ${q(p.entryId)}) return { ${key(p.fieldId)}: ${formatValue(p.newValue)} };
      return undefined;
    }
  });\n`;
    }

    if (operation === 'transformEntries') {
        const isReplace = p.transform === 'replace';
        // In-place transforms (findReplace, lowercase, trim, ...) read and write the same field
        const source = p.sourceField || p.targetField || '';
        return `\n  // Transformation: ${comment(p.transform)} on ${comment(p.contentType)}
  migration.transformEntries({
    contentType: ${q(p.contentType)},
    from: [${isReplace ? '' : q(source)}],
    to: [${q(p.targetField)}],
    transformEntryForLocale: (fromFields, locale) => {
      ${generateTransformLogic({ ...p, sourceField: source })}
    }
  });\n`;
    }

    if (operation === 'deriveLinkedEntries') return generateDeriveLinkedEntriesCode(p);
    return '';
}

function generateDeriveLinkedEntriesCode(p: TransformParams): string {
    const sourceFields = (typeof p.sourceFields === 'string'
        ? p.sourceFields.split(',').map((s) => s.trim())
        : (p.sourceFields as string[]) || []).filter(Boolean);

    let code = `\n  // Derive ${comment(p.derivedContentType)} from ${comment(p.contentType)}\n`;
    code += `  const dCt = migration.createContentType(${q(p.derivedContentType)}, { name: ${q(p.derivedContentType)} });\n`;
    sourceFields.forEach((f) => {
        code += `  dCt.createField(${q(f)}).name(${q(f)}).type('Symbol');\n`;
    });

    code += `\n  migration.editContentType(${q(p.contentType)})
    .createField(${q(p.targetField)})
    .name(${q(p.targetField)})
    .type('Link')
    .linkType('Entry')
    .validations([{ linkContentType: [${q(p.derivedContentType)}] }]);\n\n`;

    code += `  migration.deriveLinkedEntries({
    contentType: ${q(p.contentType)},
    derivedContentType: ${q(p.derivedContentType)},
    from: ${JSON.stringify(sourceFields)},
    toReferenceField: ${q(p.targetField)},
    derivedFields: ${JSON.stringify(sourceFields)},
    identityKey: async (fromFields) => {
      return ${sourceFields.length ? sourceFields.map((f) => `(${prop('fromFields', f)}?.['en-US'] || 'default')`).join(' + "_" + ') : "'default'"};
    },
    deriveEntryForLocale: (inputFields, locale) => ({
${sourceFields.map((f) => `      ${key(f)}: ${prop('inputFields', f)}[locale]`).join(',\n')}
    })
  });\n`;

    return code;
}

function generateTransformLogic(params: TransformParams): string {
    const { transform, sourceField, targetField, staticValue } = params;
    const t = key(targetField);
    const src = prop('fromFields', sourceField, true);

    switch (transform) {
        case 'replace':
            return `return { ${t}: ${formatValue(staticValue)} };`;
        case 'copy':
            return `return { ${t}: ${prop('fromFields', sourceField)}[locale] };`;
        case 'slug':
            return `const val = ${src}?.[locale];
      if (!val) return undefined;
      return { ${t}: val.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') };`;
        case 'lowercase':
            return `return { ${t}: ${src}?.[locale]?.toLowerCase() };`;
        case 'uppercase':
            return `return { ${t}: ${src}?.[locale]?.toUpperCase() };`;
        case 'trim':
            return `return { ${t}: ${src}?.[locale]?.trim() };`;
        case 'defaultLocale':
            return `return { ${t}: ${src}?.[locale] || ${src}?.['en-US'] };`;
        case 'clearEmpty':
            return `const val = ${src}?.[locale];
      return { ${t}: (typeof val === 'string' && val.trim() === '') ? undefined : val };`;
        case 'findReplace':
            return `const val = ${src}?.[locale];
      if (typeof val !== 'string') return undefined;
      return { ${t}: val.split(${q(params.findText || '')}).join(${q(params.replaceText || '')}) };`;
        case 'custom':
            // Custom code is only ever emitted for download; the server refuses to execute it.
            if (params.customCode && typeof params.customCode === 'string') {
                return `const customTransform = ${params.customCode};
      return customTransform(fromFields, locale);`;
            }
            return `return { ${t}: ${src}?.[locale] };`;
        default:
            return `return { ${t}: ${src}?.[locale] };`;
    }
}
