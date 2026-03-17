import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddStepDialog } from '../AddStepDialog';
import '@testing-library/jest-dom';

describe('AddStepDialog', () => {
    const mockOnAdd = jest.fn();
    const mockOnClose = jest.fn();
    const defaultProps = {
        open: true,
        onClose: mockOnClose,
        onAdd: mockOnAdd,
        contentType: 'testType',
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('does not render when open is false', () => {
        render(<AddStepDialog {...defaultProps} open={false} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('renders correctly when open', () => {
        render(<AddStepDialog {...defaultProps} />);
        expect(screen.getByRole('dialog')).toBeVisible();
        expect(screen.getByText('Add Migration Step')).toBeInTheDocument();
    });

    it('adds a Create Field step', () => {
        render(<AddStepDialog {...defaultProps} />);


        const idInput = screen.getByLabelText('Field ID');
        fireEvent.change(idInput, { target: { value: 'newField' } });


        fireEvent.click(screen.getByText('Add Step'));

        expect(mockOnAdd).toHaveBeenCalledWith(expect.objectContaining({
            operation: 'createField',
            params: expect.objectContaining({
                fieldId: 'newField',
                fieldType: 'Symbol',
            }),
        }));
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('adds a Delete Field step', () => {
        render(<AddStepDialog {...defaultProps} />);

        // Switch Tab
        fireEvent.click(screen.getByText('Delete Field'));

        // Fill Field ID
        // The label is specifically "Field ID to Delete"
        const input = screen.getByLabelText('Field ID to Delete');
        fireEvent.change(input, { target: { value: 'delField' } });

        fireEvent.click(screen.getByText('Add Step'));

        expect(mockOnAdd).toHaveBeenCalledWith(expect.objectContaining({
            operation: 'deleteField',
            params: expect.objectContaining({
                fieldId: 'delField',
            }),
        }));
    });

    it('adds a Rename Field step', () => {
        render(<AddStepDialog {...defaultProps} />);

        fireEvent.click(screen.getByText('Rename Field'));
    });
});
