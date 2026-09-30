import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { TemplateLibrary } from '../TemplateLibrary';
import { useVisualBuilderTemplates } from '@/hooks/useVisualBuilderTemplates';
import { MIGRATION_TEMPLATES } from '@/templates/migration-templates';

jest.mock('@/hooks/useVisualBuilderTemplates', () => ({ useVisualBuilderTemplates: jest.fn() }));

describe('TemplateLibrary', () => {
    const onUseTemplate = jest.fn();
    const onPreviewCode = jest.fn();
    const fetchTemplates = jest.fn();
    const deleteTemplate = jest.fn();
    const builtIn = MIGRATION_TEMPLATES[0];

    beforeEach(() => {
        jest.clearAllMocks();
        (useVisualBuilderTemplates as jest.Mock).mockReturnValue({
            templates: [{ id: 'custom-1', name: 'My Custom Blueprint', description: 'Saved by me', content: [], category: 'custom', updatedAt: '' }],
            fetchTemplates,
            deleteTemplate,
            loading: false,
        });
    });

    const cardOf = (name: string) => screen.getByText(name).closest('.group') as HTMLElement;

    it('loads and shows built-in and custom templates', () => {
        render(<TemplateLibrary onUseTemplate={onUseTemplate} onPreviewCode={onPreviewCode} />);
        expect(fetchTemplates).toHaveBeenCalled();
        expect(screen.getByText(builtIn.name)).toBeInTheDocument();
        expect(screen.getByText('My Custom Blueprint')).toBeInTheDocument();
        expect(screen.getByText('My Custom')).toBeInTheDocument();
    });

    it('filters by search text', () => {
        render(<TemplateLibrary onUseTemplate={onUseTemplate} onPreviewCode={onPreviewCode} />);
        fireEvent.change(screen.getByPlaceholderText('Filter blueprints...'), { target: { value: 'my custom' } });
        expect(screen.getByText('My Custom Blueprint')).toBeInTheDocument();
        expect(screen.queryByText(builtIn.name)).not.toBeInTheDocument();

        fireEvent.change(screen.getByPlaceholderText('Filter blueprints...'), { target: { value: 'nothing-matches-this' } });
        expect(screen.getByText('No matching blueprints')).toBeInTheDocument();
    });

    it('applies and previews a template', () => {
        render(<TemplateLibrary onUseTemplate={onUseTemplate} onPreviewCode={onPreviewCode} />);
        const card = cardOf(builtIn.name);
        fireEvent.click(within(card).getByRole('button', { name: /apply/i }));
        expect(onUseTemplate).toHaveBeenCalledWith(expect.objectContaining({ id: builtIn.id }));
        fireEvent.click(within(card).getByRole('button', { name: /code/i }));
        expect(onPreviewCode).toHaveBeenCalledWith(expect.objectContaining({ id: builtIn.id }));
    });

    it('deletes only custom templates, after confirmation', () => {
        jest.spyOn(window, 'confirm').mockReturnValue(true);
        render(<TemplateLibrary onUseTemplate={onUseTemplate} onPreviewCode={onPreviewCode} />);
        expect(screen.queryByRole('button', { name: `Delete template ${builtIn.name}` })).not.toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: 'Delete template My Custom Blueprint' }));
        expect(deleteTemplate).toHaveBeenCalledWith('custom-1');
    });
});
