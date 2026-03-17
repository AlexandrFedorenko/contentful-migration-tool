import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VisualBuilder } from '../VisualBuilder';
import { MigrationStep } from '@/templates/migration-templates';
import '@testing-library/jest-dom';

// Mocks
jest.mock('../OperationSelector', () => ({
    OperationSelector: ({ onAddOperation }: { onAddOperation: (op: string) => void }) => (
        <div data-testid="operation-selector">
            <button onClick={() => onAddOperation('addField')}>Add Field</button>
        </div>
    )
}));

jest.mock('../StepEditor', () => ({
    StepEditor: ({ step, onChange, onDelete }: { step: { id: string; type: string }; onChange: (s: unknown) => void; onDelete: () => void }) => (
        <div data-testid={`step-editor-${step.id}`}>
            {step.type}
            <button onClick={() => onChange({ ...step, name: 'Updated' })}>Change</button>
            <button onClick={onDelete}>Delete</button>
        </div>
    )
}));

const mockSaveTemplate = jest.fn();
jest.mock('@/hooks/useVisualBuilderTemplates', () => ({
    useVisualBuilderTemplates: () => ({
        saveTemplate: mockSaveTemplate,
        loading: false
    })
}));

describe('VisualBuilder', () => {
    const mockOnStepsChange = jest.fn();
    const mockOnGenerateCode = jest.fn();

    const sampleSteps: MigrationStep[] = [
        {
            id: '1',
            type: 'contentType',
            operation: 'createContentType',
            label: 'Create Blog',
            icon: '📝',
            params: { contentTypeId: 'blog' }
        },
        {
            id: '2',
            type: 'field',
            operation: 'createField',
            label: 'Create Title',
            icon: '➕',
            params: { fieldId: 'title', contentType: 'blog' }
        }
    ];

    beforeEach(() => {
        jest.clearAllMocks();
        mockSaveTemplate.mockResolvedValue(true);
    });

    it('renders empty state correctly', () => {
        render(
            <VisualBuilder
                steps={[]}
                onStepsChange={mockOnStepsChange}
                onGenerateCode={mockOnGenerateCode}
                contentType=""
            />
        );

        expect(screen.getByText('No steps yet')).toBeInTheDocument();
        expect(screen.getByText('Add Mock Operation')).toBeInTheDocument();
    });

    it('renders list of steps', () => {
        render(
            <VisualBuilder
                steps={sampleSteps}
                onStepsChange={mockOnStepsChange}
                onGenerateCode={mockOnGenerateCode}
                contentType=""
            />
        );

        expect(screen.getByText(/1. Create Blog/)).toBeInTheDocument();
        expect(screen.getByText(/2. Create Title/)).toBeInTheDocument();
        expect(screen.getByText('Save Template')).toBeInTheDocument();
        expect(screen.getByText('Generate Code')).toBeInTheDocument();
    });

    it('adds a new step', () => {
        render(
            <VisualBuilder
                steps={sampleSteps}
                onStepsChange={mockOnStepsChange}
                onGenerateCode={mockOnGenerateCode}
                contentType=""
            />
        );

        fireEvent.click(screen.getByText('Add Mock Operation'));

        expect(mockOnStepsChange).toHaveBeenCalledWith(expect.arrayContaining([
            ...sampleSteps,
            expect.objectContaining({ label: 'New Field' })
        ]));
    });

    it('deletes a step', () => {
        render(
            <VisualBuilder
                steps={sampleSteps}
                onStepsChange={mockOnStepsChange}
                onGenerateCode={mockOnGenerateCode}
                contentType=""
            />
        );

        // Click delete on the first item
        const deleteButtons = screen.getAllByLabelText('Delete step');
        fireEvent.click(deleteButtons[0]);

        // Should return array without first item
        expect(mockOnStepsChange).toHaveBeenCalledWith([sampleSteps[1]]);
    });

    it('edits a step', () => {
        render(
            <VisualBuilder
                steps={sampleSteps}
                onStepsChange={mockOnStepsChange}
                onGenerateCode={mockOnGenerateCode}
                contentType=""
            />
        );

        // Click edit on first item
        const editButtons = screen.getAllByLabelText('Edit step');
        fireEvent.click(editButtons[0]);

        // Check if editor opened
        expect(screen.getByText('Mock Editor for Create Blog')).toBeInTheDocument();

        // Save edit
        fireEvent.click(screen.getByText('Save Edit'));

        expect(mockOnStepsChange).toHaveBeenCalledWith([
            expect.objectContaining({ label: 'Updated Label' }),
            sampleSteps[1]
        ]);
    });

    it('reorders steps via drag and drop', () => {
        render(
            <VisualBuilder
                steps={sampleSteps}
                onStepsChange={mockOnStepsChange}
                onGenerateCode={mockOnGenerateCode}
                contentType=""
            />
        );

        const items = screen.getAllByRole('listitem');
        const firstItem = items[0];
        const secondItem = items[1];

        // Drag start first item
        fireEvent.dragStart(firstItem);
        // Drag over second item
        fireEvent.dragOver(secondItem);
        // Note: component implementation calls onStepsChange inside dragOver
        // logic: removes from index 0, inserts at index 1

        expect(mockOnStepsChange).toHaveBeenCalledWith([
            sampleSteps[1],
            sampleSteps[0]
        ]);
    });

    it('opens save dialog and saves template', async () => {
        render(
            <VisualBuilder
                steps={sampleSteps}
                onStepsChange={mockOnStepsChange}
                onGenerateCode={mockOnGenerateCode}
                contentType=""
            />
        );

        fireEvent.click(screen.getByText('Save Template'));

        // Dialog opens
        expect(screen.getByText('Save as Template')).toBeInTheDocument();

        // Fill form
        const nameInput = screen.getByLabelText(/Template Name/i); // Using regex per previous lesson
        fireEvent.change(nameInput, { target: { value: 'My Template' } });

        // Click Save
        const saveButton = screen.getAllByText('Save').pop()!; // Last one likely in dialog
        fireEvent.click(saveButton);

        await waitFor(() => {
            expect(mockSaveTemplate).toHaveBeenCalledWith('My Template', '', sampleSteps);
        });
    });

    it('calls onGenerateCode', () => {
        render(
            <VisualBuilder
                steps={sampleSteps}
                onStepsChange={mockOnStepsChange}
                onGenerateCode={mockOnGenerateCode}
                contentType=""
            />
        );

        fireEvent.click(screen.getByText('Generate Code'));
        expect(mockOnGenerateCode).toHaveBeenCalled();
    });
});
