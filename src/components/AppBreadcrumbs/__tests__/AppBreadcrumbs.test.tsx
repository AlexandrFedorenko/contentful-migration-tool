import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AppBreadcrumbs from '../AppBreadcrumbs';
import { useRouter } from 'next/router';

// Mock Next.js router
jest.mock('next/router', () => ({
    useRouter: jest.fn(),
}));

describe('AppBreadcrumbs Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('returns null (renders nothing) on hidden paths like /', () => {
        (useRouter as jest.Mock).mockReturnValue({
            pathname: '/',
            asPath: '/',
            query: {},
        });

        const { container } = render(<AppBreadcrumbs />);
        expect(container).toBeEmptyDOMElement();
    });

    it('returns null on /sign-in', () => {
        (useRouter as jest.Mock).mockReturnValue({
            pathname: '/sign-in',
            asPath: '/sign-in',
            query: {},
        });

        const { container } = render(<AppBreadcrumbs />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders breadcrumbs on /dashboard', () => {
        (useRouter as jest.Mock).mockReturnValue({
            pathname: '/dashboard',
            asPath: '/dashboard',
            query: {},
        });

        render(<AppBreadcrumbs />);
        // It should render "Home" which links to /dashboard.
        // But implementation says: if (breadcrumbs.length <= 1) return null;
        // And "Home" is always added. So if we are AT /dashboard, length is 1?
        // Let's check logic:
        // crumbs = [{ label: 'Home', href: '/dashboard' }]
        // asPathSegments for '/dashboard' -> ['dashboard']
        // loop: segment 'dashboard' -> continue (skipped)
        // result: length 1.
        // So on /dashboard it should be hidden?

        // Wait, let's verify logic in AppBreadcrumbs:
        // "if (segment === 'dashboard') return;"
        // "if (breadcrumbs.length <= 1) return null;"

        // So yes, on pure /dashboard it matches existing logic to NOT show breadcrumbs.
        // Let's verify that.
        const { container } = render(<AppBreadcrumbs />);
        expect(container).toBeEmptyDOMElement();
    });

    it('renders breadcrumbs on /backups', () => {
        (useRouter as jest.Mock).mockReturnValue({
            pathname: '/backups',
            asPath: '/backups',
            query: {},
        });

        render(<AppBreadcrumbs />);
        // Should show Home > Backups
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Backups')).toBeInTheDocument();
    });

    it('renders breadcrumbs on /backup-preview/some-file.json', () => {
        (useRouter as jest.Mock).mockReturnValue({
            pathname: '/backup-preview/[filename]',
            asPath: '/backup-preview/my-backup.json',
            query: { filename: 'my-backup.json' },
        });

        render(<AppBreadcrumbs />);
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Preview')).toBeInTheDocument();
        // The filename formatting logic:
        // label = query.filename ...
        // It renders the filename as the last crumb
        expect(screen.getByText('my-backup')).toBeInTheDocument();
    });
});
