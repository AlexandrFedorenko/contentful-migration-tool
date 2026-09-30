import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddStepDialog } from '../AddStepDialog';

describe('AddStepDialog', () => {
    const onAdd = jest.fn();
    const onClose = jest.fn();
    const props = { open: true, onClose, onAdd, contentType: 'article' };

    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    });

    const inject = () => fireEvent.click(screen.getByRole('button', { name: /inject step/i }));
    const openTab = (name: RegExp) => {
        const tab = screen.getByRole('tab', { name });
        fireEvent.mouseDown(tab);
        fireEvent.click(tab);
    };

    it('renders nothing when closed', () => {
        render(<AddStepDialog {...props} open={false} />);
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('requires a field id before adding', () => {
        render(<AddStepDialog {...props} />);
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /inject step/i })).toBeDisabled();
    });

    it('adds a Create Field step for the current content type', () => {
        render(<AddStepDialog {...props} />);
        fireEvent.change(screen.getByLabelText('Field ID'), { target: { value: 'slug' } });
        inject();
        expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
            type: 'field',
            operation: 'createField',
            params: expect.objectContaining({ contentType: 'article', fieldId: 'slug', fieldType: 'Symbol' }),
        }));
        expect(onClose).toHaveBeenCalled();
    });

    it('adds a Delete Field step', () => {
        render(<AddStepDialog {...props} />);
        openTab(/delete field/i);
        fireEvent.change(screen.getByLabelText('Field ID to Delete'), { target: { value: 'legacy' } });
        inject();
        expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
            operation: 'deleteField',
            params: { contentType: 'article', fieldId: 'legacy' },
        }));
    });

    it('adds a Rename Field step', () => {
        render(<AddStepDialog {...props} />);
        openTab(/rename field/i);
        fireEvent.change(screen.getByLabelText('Current Field ID'), { target: { value: 'old' } });
        fireEvent.change(screen.getByLabelText('New Field ID'), { target: { value: 'fresh' } });
        inject();
        expect(onAdd).toHaveBeenCalledWith(expect.objectContaining({
            operation: 'renameField',
            params: { contentType: 'article', oldFieldId: 'old', newFieldId: 'fresh' },
        }));
    });
});
