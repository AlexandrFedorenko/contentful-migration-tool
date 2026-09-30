import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DiffViewer from '../DiffViewer';

jest.mock('@/components/ContentRenderer/ContentRenderer', () => ({
    FieldRenderer: ({ value }: { value: unknown }) => <div data-testid="field-renderer">{JSON.stringify(value)}</div>,
}));

describe('DiffViewer', () => {
    it('shows modified fields with old and new values', () => {
        render(<DiffViewer oldValue={{ title: 'Old' }} newValue={{ title: 'New' }} />);
        expect(screen.getByText('title')).toBeInTheDocument();
        expect(screen.getByText('Modified')).toBeInTheDocument();
        expect(screen.getByText('"Old"')).toBeInTheDocument();
        expect(screen.getByText('"New"')).toBeInTheDocument();
    });

    it('shows added fields without an old value', () => {
        render(<DiffViewer oldValue={{}} newValue={{ newField: 'Added' }} />);
        expect(screen.getByText('newField')).toBeInTheDocument();
        expect(screen.getByText('Added')).toBeInTheDocument();
        expect(screen.getByText('"Added"')).toBeInTheDocument();
        expect(screen.queryByText('Original Manifest (Target)')).not.toBeInTheDocument();
    });

    it('shows deleted fields without a new value', () => {
        render(<DiffViewer oldValue={{ deletedField: 'Deleted' }} newValue={{}} />);
        expect(screen.getByText('deletedField')).toBeInTheDocument();
        expect(screen.getAllByText('Deleted').length).toBeGreaterThan(0);
        expect(screen.queryByText('Updated Payload (Source)')).not.toBeInTheDocument();
    });

    it('hides unchanged fields and says so', () => {
        render(<DiffViewer oldValue={{ same: 1 }} newValue={{ same: 1 }} />);
        expect(screen.queryByText('same')).not.toBeInTheDocument();
    });

    it('switches to the raw JSON view', () => {
        render(<DiffViewer oldValue={{ key: 'a' }} newValue={{ key: 'b' }} />);
        const tab = screen.getByRole('tab', { name: /raw manifest/i });
        fireEvent.mouseDown(tab);
        fireEvent.click(tab);
        expect(screen.getByText('Source Entry (Proposed)')).toBeInTheDocument();
        expect(screen.getByText('Target Entry (Current)')).toBeInTheDocument();
    });

    it('handles missing values', () => {
        render(<DiffViewer oldValue={undefined} newValue={undefined} />);
        expect(screen.getByText('No structural variances detected')).toBeInTheDocument();
    });
});
