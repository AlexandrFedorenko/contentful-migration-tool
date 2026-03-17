import React from 'react';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { TemplateLibrary } from '../TemplateLibrary';
import '@testing-library/jest-dom';

// Mock dependencies
const mockDeleteTemplate = jest.fn();
const mockFetchTemplates = jest.fn();

jest.mock('@/hooks/useVisualBuilderTemplates', () => ({
    useVisualBuilderTemplates: () => ({
        templates: [
            { id: 'custom-1', name: 'My Custom Template', description: 'Custom Desc', content: [] }
        ],
        fetchTemplates: mockFetchTemplates,
        deleteTemplate: mockDeleteTemplate,
        loading: false
    })
}));

jest.mock('@/templates/migration-templates', () => ({
    MIGRATION_TEMPLATES: [
        {
            id: 'builtin-1',
            name: 'Built-in Template',
            description: 'Built-in Desc',
            category: 'field',
            icon: '📦',
            steps: []
        },
        {
            id: 'builtin-2',
            name: 'Another Template',
            description: 'Another Desc',
            category: 'cleanup',
            icon: '🧹',
            steps: []
        }
    ]
}));

describe('TemplateLibrary', () => {
    const mockOnUseTemplate = jest.fn();
    const mockOnPreviewCode = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders built-in and custom templates', () => {
        render(
            <TemplateLibrary
                onUseTemplate={mockOnUseTemplate}
                onPreviewCode={mockOnPreviewCode}
            />
        );

        // Check for built-in
        expect(screen.getByText('Built-in Template')).toBeInTheDocument();
        // Check for custom
        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
        // Check filtering/grouping headers
        expect(screen.getByText(/Field Operations/)).toBeInTheDocument();
        expect(screen.getByText(/My Custom Templates/)).toBeInTheDocument();
    });

    it('filters templates by search query', () => {
        render(
            <TemplateLibrary
                onUseTemplate={mockOnUseTemplate}
                onPreviewCode={mockOnPreviewCode}
            />
        );

        const searchInput = screen.getByPlaceholderText('Search templates...');
        fireEvent.change(searchInput, { target: { value: 'Custom' } });

        expect(screen.getByText('My Custom Template')).toBeInTheDocument();
        expect(screen.queryByText('Built-in Template')).not.toBeInTheDocument();
    });

    it('filters templates by category', () => {
        render(
            <TemplateLibrary
                onUseTemplate={mockOnUseTemplate}
                onPreviewCode={mockOnPreviewCode}
            />
        );

        // Open Category Select
        // MUI Select renders as a combobox. We can find it by its current text value or role + text
        // "All Templates" is the default value visible in the combobox
        const categorySelectTrigger = screen.getByText('All Templates');
        fireEvent.mouseDown(categorySelectTrigger);

        // Click option
        const option = screen.getByRole('option', { name: 'Field Operations' });
        fireEvent.click(option);

        expect(screen.getByText('Built-in Template')).toBeInTheDocument();
        expect(screen.queryByText('My Custom Template')).not.toBeInTheDocument();
    });

    it('calls onUseTemplate when clicked', () => {
        render(
            <TemplateLibrary
                onUseTemplate={mockOnUseTemplate}
                onPreviewCode={mockOnPreviewCode}
            />
        );

        // Find the "Use Template" button specifically for the built-in template
        // We can find the card first
        const card = screen.getByText('Built-in Template').closest('.MuiCard-root');
        const useBtn = within(card as HTMLElement).getByText('Use Template');

        fireEvent.click(useBtn);

        expect(mockOnUseTemplate).toHaveBeenCalledWith(expect.objectContaining({
            id: 'builtin-1',
            name: 'Built-in Template'
        }));
    });

    it('calls deleteTemplate with confirmation for custom templates', async () => {
        // Mock confirm
        window.confirm = jest.fn(() => true);

        render(
            <TemplateLibrary
                onUseTemplate={mockOnUseTemplate}
                onPreviewCode={mockOnPreviewCode}
            />
        );

        // Find delete button on custom template
        const customCard = screen.getByText('My Custom Template').closest('.MuiCard-root');
        const deleteBtn = within(customCard as HTMLElement).getByTitle('Delete Template');

        fireEvent.click(deleteBtn);

        expect(window.confirm).toHaveBeenCalled();
        expect(mockDeleteTemplate).toHaveBeenCalledWith('custom-1');
    });
});
