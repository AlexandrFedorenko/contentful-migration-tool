import { saveTemplate, loadCustomTemplates, deleteTemplate } from '@/templates/template-storage';
import { MigrationTemplate } from '@/templates/migration-templates';
import './test-helpers'; // Integrated shared mocks

describe('template-storage', () => {
    beforeEach(() => {
        window.localStorage.clear();
    });

    it('should save and load a template', () => {

        const templateData: Omit<MigrationTemplate, 'id'> = {
            name: 'Test Template',
            description: 'Test Description',
            category: 'custom',
            icon: '📝',
            steps: [],
            config: undefined
        };

        saveTemplate(templateData);

        const loadedTemplates = loadCustomTemplates();
        const savedTemplate = loadedTemplates[0];

        expect(savedTemplate).toBeDefined();
        expect(savedTemplate.name).toBe('Test Template');
        expect(savedTemplate.category).toBe('custom');
        expect(savedTemplate.steps).toEqual([]);

        expect(loadedTemplates).toHaveLength(1);
        expect(loadedTemplates[0].id).toBeDefined();
        expect(loadedTemplates[0].id).toMatch(/^custom-/);
    });

    it('should delete a template', () => {

        const templateData: Omit<MigrationTemplate, 'id'> = {
            name: 'Template 1',
            description: 'Desc 1',
            category: 'custom',
            icon: '📝',
            steps: [],
            config: undefined
        };

        saveTemplate(templateData);
        const templates = loadCustomTemplates();
        expect(templates).toHaveLength(1);

        deleteTemplate(templates[0].id);
        expect(loadCustomTemplates()).toHaveLength(0);
    });
});
