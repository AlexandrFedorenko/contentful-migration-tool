import React, { useMemo, useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Home, ChevronRight } from 'lucide-react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

const routeNameMap: Record<string, string> = {
    'backup': 'Backups',
    'restore': 'Restore',
    'smart-migration': 'Smart Migration',
    'visual-migration': 'Visual Migration',
    'views-migration': 'Views Migration',
    'scan-content-types': 'Scan Content Types',
    'backup-preview': 'Preview',
    'dashboard': 'Dashboard',
    'settings': 'Settings',
    'profile': 'Profile',
    'backups': 'Backups'
};

const AppBreadcrumbs = () => {
    const router = useRouter();
    const { pathname, query, asPath } = router;
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const breadcrumbs = useMemo(() => {
        if (!mounted) return [];
        const hiddenPaths = ['/', '/sign-in', '/sign-up', '/start'];
        if (hiddenPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) return [];

        const asPathWithoutQuery = asPath.split('?')[0];
        const asPathSegments = asPathWithoutQuery.split('/').filter(v => v.length > 0);

        const crumbs: { href: string; label: string; icon?: React.ReactNode }[] = [
            { href: '/dashboard', label: 'Home', icon: <Home className="h-3.5 w-3.5 mr-1" /> }
        ];

        let currentHref = '';

        asPathSegments.forEach((segment, index) => {
            currentHref += `/${segment}`;
            if (segment === 'dashboard') return;

            let label = routeNameMap[segment];

            if (!label) {
                label = segment.charAt(0).toUpperCase() + segment.slice(1).replace(/-/g, ' ');
                if (segment.endsWith('.json')) {
                    label = segment.replace('temp-preview-', 'Preview: ').replace('.json', '');
                    if (label.length > 30) label = label.substring(0, 27) + '...';
                }
            }

            if (asPathSegments[index - 1] === 'backup-preview') {
                label = query.filename ? String(query.filename).replace('temp-preview-', '').replace('.json', '') : label;
                if (label.length > 30) label = label.substring(0, 27) + '...';
            }

            crumbs.push({
                href: currentHref,
                label: label,
                icon: undefined
            });
        });

        return crumbs;
    }, [asPath, pathname, query, mounted]);

    if (breadcrumbs.length <= 1) return null;

    return (
        <div className="bg-background border-b py-3 mb-4">
            <div className="mx-auto transition-all duration-300 max-w-7xl px-6">
                <Breadcrumb>
                    <BreadcrumbList>
                        {breadcrumbs.map((crumb, index) => {
                            const isLast = index === breadcrumbs.length - 1;

                            return (
                                <React.Fragment key={crumb.href}>
                                    <BreadcrumbItem>
                                        {isLast ? (
                                            <BreadcrumbPage className="flex items-center text-foreground font-medium">
                                                {crumb.icon}
                                                {crumb.label}
                                            </BreadcrumbPage>
                                        ) : (
                                            <BreadcrumbLink asChild className="flex items-center hover:text-primary transition-colors">
                                                <Link href={crumb.href}>
                                                    {crumb.icon}
                                                    {crumb.label}
                                                </Link>
                                            </BreadcrumbLink>
                                        )}
                                    </BreadcrumbItem>
                                    {!isLast && (
                                        <BreadcrumbSeparator>
                                            <ChevronRight className="h-4 w-4" />
                                        </BreadcrumbSeparator>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </BreadcrumbList>
                </Breadcrumb>
            </div>
        </div>
    );
};

export default AppBreadcrumbs;
