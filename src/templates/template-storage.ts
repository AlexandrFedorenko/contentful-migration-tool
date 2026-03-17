import { MigrationTemplate } from './migration-templates';

export const saveTemplate = (template: Omit<MigrationTemplate, 'id'>): void => {
    const saved = loadCustomTemplates();
    const newTemplate = {
        ...template,
        id: `custom-${Date.now()}`
    };
    saved.push(newTemplate);
    localStorage.setItem('customMigrationTemplates', JSON.stringify(saved));
};

export const loadCustomTemplates = (): MigrationTemplate[] => {
    try {
        const saved = localStorage.getItem('customMigrationTemplates');
        return saved ? JSON.parse(saved) : [];
    } catch (error) {
        console.error('Failed to load custom templates:', error);
        return [];
    }
};

export const deleteTemplate = (id: string): void => {
    const saved = loadCustomTemplates();
    const filtered = saved.filter(t => t.id !== id);
    localStorage.setItem('customMigrationTemplates', JSON.stringify(filtered));
};

export const getAllTemplates = (builtinTemplates: MigrationTemplate[]): MigrationTemplate[] => {
    const custom = loadCustomTemplates();
    return [...builtinTemplates, ...custom];
};
