import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import DiffViewer from '../DiffViewer';
import '@testing-library/jest-dom';

// Mock FieldRenderer since it might be complex
jest.mock('@/components/ContentRenderer/ContentRenderer', () => ({
    FieldRenderer: ({ value }: { value: unknown }) => <div data-testid="field-renderer">{JSON.stringify(value)}</div>
}));

describe('DiffViewer', () => {


    it('renders field differences correctly', () => {
        render(
            <DiffViewer
                oldValue={{ title: 'Old' }}
                newValue={{ title: 'New' }}
            />
        );

        expect(screen.getByText('• title')).toBeInTheDocument();
        expect(screen.getByText('MODIFIED')).toBeInTheDocument();
        expect(screen.getByText('"Old"')).toBeInTheDocument(); // Mocked renderer output
        expect(screen.getByText('"New"')).toBeInTheDocument();
    });

    it('renders added fields', () => {
        render(
            <DiffViewer
                oldValue={{}}
                newValue={{ newField: 'Added' }}
            />
        );

        expect(screen.getByText('• newField')).toBeInTheDocument();
        expect(screen.getByText('ADDED')).toBeInTheDocument();
        expect(screen.getByText('"Added"')).toBeInTheDocument();
        expect(screen.queryByText('OLD VALUE (TARGET)')).not.toBeInTheDocument();
    });

    it('renders deleted fields', () => {
        render(
            <DiffViewer
                oldValue={{ deletedField: 'Deleted' }}
                newValue={{}}
            />
        );

        expect(screen.getByText('• deletedField')).toBeInTheDocument();
        expect(screen.getByText('DELETED')).toBeInTheDocument();
        expect(screen.getByText('"Deleted"')).toBeInTheDocument();
        expect(screen.queryByText('NEW VALUE (SOURCE)')).not.toBeInTheDocument();
    });

    it('handles tab switching', () => {
        render(
            <DiffViewer
                oldValue={{ key: 'val' }}
                newValue={{ key: 'val' }}
            />
        );

        // Default tab is Field Differences
        // Since values are same, it should show empty message or nothing if filtered
        // interacting with tabs
        const jsonTab = screen.getByText('Raw JSON');
        fireEvent.click(jsonTab);

        expect(screen.getByText('Source Entry (New)')).toBeInTheDocument();
        expect(screen.getByText('Target Entry (Old)')).toBeInTheDocument();
    });

    it('displays message when no fields to compare', () => {
        render(<DiffViewer oldValue={undefined} newValue={undefined} />);
        expect(screen.getByText('No fields to compare')).toBeInTheDocument();
    });
});
