import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VisualBuilder } from '../VisualBuilder';
import { MigrationStep } from '@/templates/migration-templates';

jest.mock('../OperationSelector', () => ({
    OperationSelector: ({ onSelectOperation }: { onSelectOperation: (op: Partial<MigrationStep>) => void }) => (
        <button onClick={() => onSelectOperation({ id: 'new', type: 'field', operation: 'createField', label: 'New Field', params: { fieldId: 'extra' } })}>
            Add Mock Operation
        </button>
    ),
}));

jest.mock('../StepEditor', () => ({
    StepEditor: ({ open, step, onSave }: { open: boolean; step: MigrationStep | null; onSave: (s: MigrationStep) => void }) =>
        open && step ? <button onClick={() => onSave({ ...step, label: 'Edited' })}>Save Edited Step</button> : null,
}));

const mockSaveTemplate = jest.fn();
jest.mock('@/hooks/useVisualBuilderTemplates', () => ({
    useVisualBuilderTemplates: () => ({ saveTemplate: mockSaveTemplate, loading: false }),
}));

describe('VisualBuilder', () => {
    const onStepsChange = jest.fn();
    const onGenerateCode = jest.fn();
    const steps: MigrationStep[] = [
        { id: '1', type: 'contentType', operation: 'createContentType', label: 'Create Blog', icon: '📝', params: { contentTypeId: 'blog' } },
        { id: '2', type: 'field', operation: 'createField', label: 'Create Title', icon: '➕', params: { fieldId: 'title', contentType: 'blog' } },
    ];

    const renderBuilder = (s: MigrationStep[] = steps) =>
        render(<VisualBuilder steps={s} onStepsChange={onStepsChange} onGenerateCode={onGenerateCode} contentType="" />);

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        mockSaveTemplate.mockResolvedValue(true);
    });

    it('shows the empty state', () => {
        renderBuilder([]);
        expect(screen.getByText('No steps yet')).toBeInTheDocument();
    });

    it('lists steps in order', () => {
        renderBuilder();
        expect(screen.getByText('Create Blog')).toBeInTheDocument();
        expect(screen.getByText('Create Title')).toBeInTheDocument();
        fireEvent.click(screen.getByRole('button', { name: /generate code/i }));
        expect(onGenerateCode).toHaveBeenCalled();
    });

    it('adds a field step bound to the content type being created', () => {
        renderBuilder();
        fireEvent.click(screen.getByText('Add Mock Operation'));
        const next = onStepsChange.mock.calls[0][0] as MigrationStep[];
        expect(next).toHaveLength(3);
        expect(next[2]).toMatchObject({ id: 'new', label: 'New Field', params: { fieldId: 'extra', contentType: 'blog' } });
    });

    it('deletes a step', () => {
        renderBuilder();
        fireEvent.click(screen.getAllByRole('button', { name: 'Delete step' })[0]);
        expect(onStepsChange).toHaveBeenCalledWith([steps[1]]);
    });

    it('edits a step', () => {
        renderBuilder();
        fireEvent.click(screen.getAllByRole('button', { name: 'Edit step' })[0]);
        fireEvent.click(screen.getByText('Save Edited Step'));
        expect(onStepsChange).toHaveBeenCalledWith([{ ...steps[0], label: 'Edited' }, steps[1]]);
    });

    it('saves the sequence as a template', async () => {
        renderBuilder();
        fireEvent.click(screen.getByRole('button', { name: /save template/i }));
        fireEvent.change(screen.getByPlaceholderText('e.g., Blog Schema Base'), { target: { value: 'Blog base' } });
        fireEvent.click(screen.getByRole('button', { name: /commit template/i }));
        await waitFor(() => expect(mockSaveTemplate).toHaveBeenCalledWith('Blog base', '', steps));
    });
});
