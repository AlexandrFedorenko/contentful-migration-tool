export type MigrationCategory = 'field' | 'transformation' | 'derive' | 'cleanup' | 'schema' | 'custom';

export interface MigrationStep {
  id: string;
  type: 'contentType' | 'field' | 'transformation';
  operation: string;
  label: string;
  icon: string;
  params: Record<string, unknown>;
}

export interface MigrationTemplate {
  id: string;
  name: string;
  description: string;
  category: MigrationCategory;
  icon: string;
  steps: MigrationStep[];
}

export const MIGRATION_TEMPLATES: MigrationTemplate[] = [

  // ═══════════════════════════════════════════════════════════════════════════════
  // SCHEMA OPERATIONS (10 templates)
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: 'add-reference-field',
    name: 'Add Reference Field',
    icon: '🔗',
    description: 'Create a reference field linking to another Content Type (e.g. author → person)',
    category: 'schema',
    steps: [
      {
        id: 'ref-1',
        type: 'field',
        operation: 'createField',
        label: 'Create Reference Field',
        icon: '🔗',
        params: {
          contentType: 'article',
          fieldId: 'author',
          name: 'Author',
          fieldType: 'Link',
          linkType: 'Entry',
          required: false
        }
      }
    ]
  },

  {
    id: 'add-tags-field',
    name: 'Add Tags Field (Array of Symbols)',
    icon: '🏷️',
    description: 'Create a tags field with an array of short text values',
    category: 'schema',
    steps: [
      {
        id: 'tags-1',
        type: 'field',
        operation: 'createField',
        label: 'Create Tags Field',
        icon: '🏷️',
        params: {
          contentType: 'article',
          fieldId: 'tags',
          name: 'Tags',
          fieldType: 'Array',
          arrayItemType: 'Symbol',
          required: false
        }
      }
    ]
  },

  {
    id: 'clone-content-type',
    name: 'Clone Content Type Schema',
    icon: '📋',
    description: 'Create a new Content Type with title, slug, and body fields as a starter template',
    category: 'schema',
    steps: [
      {
        id: 'clone-1', type: 'contentType', operation: 'createContentType',
        label: 'Create New Content Type', icon: '📋',
        params: { contentTypeId: 'articleCopy', name: 'Article Copy', description: 'Cloned from article', displayField: 'title' }
      },
      {
        id: 'clone-2', type: 'field', operation: 'createField',
        label: 'Create Title Field', icon: '➕',
        params: { contentType: 'articleCopy', fieldId: 'title', name: 'Title', fieldType: 'Symbol', required: true, isDisplayField: true }
      },
      {
        id: 'clone-3', type: 'field', operation: 'createField',
        label: 'Create Slug Field', icon: '➕',
        params: { contentType: 'articleCopy', fieldId: 'slug', name: 'Slug', fieldType: 'Symbol', required: true }
      },
      {
        id: 'clone-4', type: 'field', operation: 'createField',
        label: 'Create Body Field', icon: '➕',
        params: { contentType: 'articleCopy', fieldId: 'body', name: 'Body', fieldType: 'RichText', required: false }
      }
    ]
  },

  {
    id: 'move-field-position',
    name: 'Reorder Fields in UI',
    icon: '↕️',
    description: 'Move a field to a new position in the Contentful editor interface',
    category: 'schema',
    steps: [
      {
        id: 'move-1', type: 'field', operation: 'moveField',
        label: 'Move Slug After Title', icon: '↕️',
        params: { contentType: 'article', fieldId: 'slug', direction: 'afterField', referenceField: 'title' }
      }
    ]
  },

  {
    id: 'set-display-field',
    name: 'Set Entry Title Field',
    icon: '⭐',
    description: 'Change which field is displayed as the entry title in Contentful',
    category: 'schema',
    steps: [
      {
        id: 'display-1', type: 'field', operation: 'setDisplayField',
        label: 'Set Display Field', icon: '⭐',
        params: { contentType: 'article', fieldId: 'title' }
      }
    ]
  },

  {
    id: 'change-widget-dropdown',
    name: 'Switch Field to Dropdown',
    icon: '🎨',
    description: 'Change the editor appearance of a field from text input to dropdown',
    category: 'schema',
    steps: [
      {
        id: 'widget-1', type: 'field', operation: 'changeFieldControl',
        label: 'Change to Dropdown', icon: '🎨',
        params: { contentType: 'article', fieldId: 'status', widgetId: 'dropdown' }
      }
    ]
  },

  {
    id: 'make-field-required',
    name: 'Make Existing Field Required',
    icon: '🔒',
    description: 'Set an existing field as required without changing anything else',
    category: 'schema',
    steps: [
      {
        id: 'req-1', type: 'field', operation: 'editField',
        label: 'Set Field as Required', icon: '📝',
        params: { contentType: 'article', fieldId: 'title', required: true }
      }
    ]
  },

  {
    id: 'add-media-field',
    name: 'Add Media (Image/Asset) Field',
    icon: '🖼️',
    description: 'Create a field for attaching a single image or asset to an entry',
    category: 'schema',
    steps: [
      {
        id: 'media-1', type: 'field', operation: 'createField',
        label: 'Create Media Field', icon: '🖼️',
        params: { contentType: 'article', fieldId: 'heroImage', fieldType: 'Media', linkType: 'Asset', required: false }
      }
    ]
  },

  {
    id: 'add-multi-reference',
    name: 'Add Multiple References Field',
    icon: '📎',
    description: 'Create an array of entry references (e.g., Related Articles)',
    category: 'schema',
    steps: [
      {
        id: 'multiref-1', type: 'field', operation: 'createField',
        label: 'Create Multi-Reference Field', icon: '📎',
        params: { contentType: 'article', fieldId: 'relatedArticles', fieldType: 'Array', arrayItemType: 'Link', arrayLinkType: 'Entry', required: false }
      }
    ]
  },

  {
    id: 'delete-field',
    name: 'Delete Field from Content Type',
    icon: '🗑️',
    description: 'Remove a field from a Content Type. Ensure data is backed up before running.',
    category: 'schema',
    steps: [
      {
        id: 'del-1', type: 'field', operation: 'deleteField',
        label: 'Delete Field', icon: '🗑️',
        params: { contentType: 'article', fieldId: 'oldField' }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // DATA TRANSFORMATION (6 templates)
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: 'auto-generate-slugs',
    name: 'Auto-Generate Slugs',
    icon: '🔗',
    description: 'Generate URL-friendly slugs from the title field for all entries',
    category: 'transformation',
    steps: [
      {
        id: 'slug-1', type: 'transformation', operation: 'transformEntries',
        label: 'Generate Slugs from Title', icon: '🔗',
        params: { contentType: 'article', sourceField: 'title', targetField: 'slug', transform: 'slug' }
      }
    ]
  },

  {
    id: 'replace-text-in-entries',
    name: 'Find & Replace Text',
    icon: '📝',
    description: 'Find and replace text across all entries (e.g., domain change)',
    category: 'transformation',
    steps: [
      {
        id: 'findreplace-1', type: 'transformation', operation: 'transformEntries',
        label: 'Find & Replace in field', icon: '📝',
        params: { contentType: 'article', targetField: 'body', transform: 'findReplace', findText: 'old-domain.com', replaceText: 'new-domain.com' }
      }
    ]
  },

  {
    id: 'set-default-locale-value',
    name: 'Set Default Locale Fallback',
    icon: '🌐',
    description: 'Fill empty locale fields with values from the default locale (en-US)',
    category: 'transformation',
    steps: [
      {
        id: 'locale-1', type: 'transformation', operation: 'transformEntries',
        label: 'Fallback to Default Locale', icon: '🌐',
        params: { contentType: 'article', targetField: 'title', transform: 'defaultLocale' }
      }
    ]
  },

  {
    id: 'batch-lowercase',
    name: 'Convert Field to Lowercase',
    icon: '🔡',
    description: 'Lowercase all values in a text field across all entries',
    category: 'transformation',
    steps: [
      {
        id: 'lower-1', type: 'transformation', operation: 'transformEntries',
        label: 'Lowercase All Values', icon: '🔡',
        params: { contentType: 'article', targetField: 'email', transform: 'lowercase' }
      }
    ]
  },

  {
    id: 'copy-field-value',
    name: 'Copy Field Value to Another',
    icon: '📋',
    description: 'Clone a field value into a different field on the same Content Type',
    category: 'transformation',
    steps: [
      {
        id: 'copy-1', type: 'transformation', operation: 'transformEntries',
        label: 'Copy Field Value', icon: '📋',
        params: { contentType: 'article', sourceField: 'title', targetField: 'metaTitle', transform: 'copy' }
      }
    ]
  },

  {
    id: 'set-static-value',
    name: 'Set Static Value for All Entries',
    icon: '✏️',
    description: 'Replace a field with a fixed static value (e.g., status = "active")',
    category: 'transformation',
    steps: [
      {
        id: 'static-1', type: 'transformation', operation: 'transformEntries',
        label: 'Set Static Value', icon: '✏️',
        params: { contentType: 'article', targetField: 'status', transform: 'replace', staticValue: 'active' }
      }
    ]
  },

  // ═══════════════════════════════════════════════════════════════════════════════
  // CLEANUP (3 templates)
  // ═══════════════════════════════════════════════════════════════════════════════

  {
    id: 'clear-empty-fields',
    name: 'Clear Empty String Fields',
    icon: '🧹',
    description: 'Null out fields that contain only whitespace or empty strings',
    category: 'cleanup',
    steps: [
      {
        id: 'clear-1', type: 'transformation', operation: 'transformEntries',
        label: 'Clear Empty Strings', icon: '🧹',
        params: { contentType: 'article', targetField: 'subtitle', transform: 'clearEmpty' }
      }
    ]
  },

  {
    id: 'batch-trim',
    name: 'Trim Whitespace from Field',
    icon: '✂️',
    description: 'Remove leading and trailing whitespace from a text field',
    category: 'cleanup',
    steps: [
      {
        id: 'trim-1', type: 'transformation', operation: 'transformEntries',
        label: 'Trim Whitespace', icon: '✂️',
        params: { contentType: 'article', targetField: 'title', transform: 'trim' }
      }
    ]
  },

  {
    id: 'batch-uppercase',
    name: 'Convert Field to Uppercase',
    icon: '🔠',
    description: 'Uppercase all values in a text field across all entries',
    category: 'cleanup',
    steps: [
      {
        id: 'upper-1', type: 'transformation', operation: 'transformEntries',
        label: 'Uppercase All Values', icon: '🔠',
        params: { contentType: 'article', targetField: 'code', transform: 'uppercase' }
      }
    ]
  },
];
