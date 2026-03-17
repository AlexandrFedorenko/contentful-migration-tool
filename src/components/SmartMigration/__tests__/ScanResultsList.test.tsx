import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ScanResultsList from '../ScanResultsList';
import '@testing-library/jest-dom';

describe('ScanResultsList', () => {
    const mockItems = [
        { id: '1', title: 'Item 1', status: 'new' as const, contentTypeId: 'blog' },
        { id: '2', title: 'Item 2', status: 'changed' as const, contentTypeId: 'blog' },
        { id: '3', title: 'Item 3', status: 'equal' as const, contentTypeId: 'blog' }
    ];

    const mockOnToggleSelect = jest.fn();
    const mockOnItemClick = jest.fn();

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders list items correctly', () => {
        render(
            <ScanResultsList
                items={mockItems}
                selectedIds={[]}
                onToggleSelect={mockOnToggleSelect}
                onItemClick={mockOnItemClick}
            />
        );

        expect(screen.getByText('Item 1')).toBeInTheDocument();
        expect(screen.getByText('Item 2')).toBeInTheDocument();
        expect(screen.getByText('NEW')).toBeInTheDocument();
        expect(screen.getByText('CHANGED')).toBeInTheDocument();
    });

    it('handles selection correctly', () => {
        render(
            <ScanResultsList
                items={mockItems}
                selectedIds={['1']}
                onToggleSelect={mockOnToggleSelect}
                onItemClick={mockOnItemClick}
            />
        );

        // Checkbox for Item 1 should be checked
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).not.toBeChecked();

        // Click checkbox 2
        fireEvent.click(checkboxes[1]);
        expect(mockOnToggleSelect).toHaveBeenCalledWith('2');
    });

    it('handles item click', () => {
        render(
            <ScanResultsList
                items={mockItems}
                selectedIds={[]}
                onToggleSelect={mockOnToggleSelect}
                onItemClick={mockOnItemClick}
            />
        );

        fireEvent.click(screen.getByText('Item 1'));
        expect(mockOnItemClick).toHaveBeenCalledWith(mockItems[0]);
    });

    it('stops propagation on checkbox click', () => {
        render(
            <ScanResultsList
                items={mockItems}
                selectedIds={[]}
                onToggleSelect={mockOnToggleSelect}
                onItemClick={mockOnItemClick}
            />
        );

        const checkboxes = screen.getAllByRole('checkbox');
        fireEvent.click(checkboxes[0]);

        expect(mockOnToggleSelect).toHaveBeenCalled();
        expect(mockOnItemClick).not.toHaveBeenCalled();
    });
});
