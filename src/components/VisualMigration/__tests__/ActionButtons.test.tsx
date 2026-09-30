import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActionButtons } from '../ActionButtons';
import type { MigrationStep } from '@/templates/migration-templates';

const mockSaveTemplate = jest.fn();
jest.mock('@/hooks/useVisualBuilderTemplates', () => ({
    useVisualBuilderTemplates: () => ({ saveTemplate: mockSaveTemplate, loading: false }),
}));
jest.mock('sonner', () => ({ toast: { success: jest.fn(), error: jest.fn() } }));

global.fetch = jest.fn();

describe('ActionButtons', () => {
    const steps: MigrationStep[] = [
        { id: '1', type: 'field', operation: 'deleteField', label: 'Delete legacy', icon: '🗑️', params: { contentType: 'article', fieldId: 'legacy' } },
    ];
    const props = {
        code: 'module.exports = function (migration) {};',
        steps,
        contentType: 'article',
        spaceId: 'space1',
        targetEnv: 'staging',
        onRun: jest.fn(),
        isRunning: false,
        disabled: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
        mockSaveTemplate.mockResolvedValue(true);
    });

    it('runs the migration', () => {
        render(<ActionButtons {...props} />);
        fireEvent.click(screen.getByRole('button', { name: /run migration/i }));
        expect(props.onRun).toHaveBeenCalled();
    });

    it('does not run while a migration is in progress', () => {
        render(<ActionButtons {...props} isRunning />);
        expect(screen.getByRole('button', { name: /running/i })).toBeDisabled();
    });

    it('saves the current steps as a server template', async () => {
        render(<ActionButtons {...props} />);
        fireEvent.click(screen.getByRole('button', { name: /save template/i }));
        fireEvent.change(screen.getByPlaceholderText('e.g., My Custom Transformation'), { target: { value: 'Cleanup' } });
        const buttons = screen.getAllByRole('button', { name: /save/i });
        fireEvent.click(buttons[buttons.length - 1]);
        await waitFor(() => expect(mockSaveTemplate).toHaveBeenCalledWith('Cleanup', 'Created from Visual Builder', steps));
    });

    it('shows the dry-run result from the server', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            json: async () => ({ success: true, data: { valid: true, affectedEntries: 42, estimatedTime: '9 seconds', warnings: ['This migration deletes content model elements. Data in them will be lost.'] } }),
        });
        render(<ActionButtons {...props} />);
        fireEvent.click(screen.getByRole('button', { name: /preview|dry/i }));

        expect(await screen.findByText('42')).toBeInTheDocument();
        expect(screen.getByText('9 seconds')).toBeInTheDocument();
        expect(screen.getByText(/deletes content model elements/)).toBeInTheDocument();
        expect(global.fetch).toHaveBeenCalledWith('/api/visual-migrate-preview', expect.objectContaining({ method: 'POST' }));
    });

    it('shows validation errors from the dry run', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({ json: async () => ({ success: false, error: 'Invalid request' }) });
        render(<ActionButtons {...props} />);
        fireEvent.click(screen.getByRole('button', { name: /preview|dry/i }));
        expect(await screen.findByText('Invalid request')).toBeInTheDocument();
    });
});
