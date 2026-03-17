import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ActionButtons } from '../ActionButtons';
import { saveTemplate } from '@/templates/template-storage';
import '@testing-library/jest-dom';

// Mocks
jest.mock('@/templates/template-storage', () => ({
    saveTemplate: jest.fn(),
}));

global.fetch = jest.fn();
window.alert = jest.fn();

describe('ActionButtons', () => {
    const mockOnRun = jest.fn();
    const defaultProps = {
        code: 'const migration = ...',
        contentType: 'testType',
        spaceId: 'space1',
        targetEnv: 'master',
        onRun: mockOnRun,
        isRunning: false,
        disabled: false,
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders all buttons', () => {
        render(<ActionButtons {...defaultProps} />);
        expect(screen.getByText('Preview (Dry-Run)')).toBeInTheDocument();
        expect(screen.getByText('Save Template')).toBeInTheDocument();
        expect(screen.getByText('Run Migration')).toBeInTheDocument();
    });

    it('calls onRun when Run button is clicked', () => {
        render(<ActionButtons {...defaultProps} />);
        fireEvent.click(screen.getByText('Run Migration'));
        expect(mockOnRun).toHaveBeenCalledTimes(1);
    });

    it('opens Save Template dialog and saves', () => {
        render(<ActionButtons {...defaultProps} />);

        // Open Dialog
        fireEvent.click(screen.getByText('Save Template'));
        expect(screen.getByText('Template will be saved locally. After database setup, it will sync to cloud.')).toBeInTheDocument();

        // Fill Form
        fireEvent.change(screen.getByLabelText('Template Name'), { target: { value: 'My Template' } });
        fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Test Desc' } });

        // Click Save inside Dialog
        // Save button in dialog shares text "Save" or similar? 
        // DialogActions: <Button onClick={handleSaveTemplate} variant="contained">Save</Button>
        const saveButtons = screen.getAllByText('Save');
        fireEvent.click(saveButtons[saveButtons.length - 1]); // The one in dialog

        expect(saveTemplate).toHaveBeenCalledWith(expect.objectContaining({
            name: 'My Template',
            description: 'Test Desc',
        }));
        expect(window.alert).toHaveBeenCalledWith(expect.stringContaining('Template saved locally'));
    });

    it('handles Preview (Dry-Run) success', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ affectedEntries: 5, estimatedTime: '2s' }),
        });

        render(<ActionButtons {...defaultProps} />);

        fireEvent.click(screen.getByText('Preview (Dry-Run)'));

        expect(screen.getByText('Migration Preview (Dry-Run)')).toBeInTheDocument();
        // Loading appears briefly, we wait for result
        await waitFor(() => {
            expect(screen.getByText('Migration is valid and ready to run!')).toBeInTheDocument();
        });

        expect(screen.getByText(/5/)).toBeInTheDocument(); // Affected entries
    });

    it('handles Preview error', async () => {
        (global.fetch as jest.Mock).mockResolvedValueOnce({
            ok: true,
            json: async () => ({ error: 'Syntax Error in script' }),
        });

        render(<ActionButtons {...defaultProps} />);
        fireEvent.click(screen.getByText('Preview (Dry-Run)'));

        await waitFor(() => {
            expect(screen.getByText('Syntax Error in script')).toBeInTheDocument();
        });
    });
});
