import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
    CloudUpload as BackupIcon,
    RefreshCcw as RestoreIcon,
    Settings as SettingsSuggestIcon,
    Sparkles as AutoFixHighIcon,
    Sparkles,
    Layers as ViewQuiltIcon,
    History as HistoryIcon,
    Hammer as BuildIcon,
    Loader2,
    ChevronRight,
    Shield
} from 'lucide-react';
import { useUser } from "@clerk/nextjs";
import { useUserProfile } from "@/hooks/useUserProfile";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
    title: string;
    icon: React.ReactNode;
    path: string;
    description: string;
    color: string;
    adminOnly?: boolean;
}

const DashboardCard = ({ title, icon, path, description, color }: DashboardCardProps) => {
    const router = useRouter();

    return (
        <Card
            className={cn(
                "group cursor-pointer border border-border/60",
                "bg-card hover:bg-accent/30",
                "hover:shadow-xl hover:shadow-primary/5 hover:border-primary/30",
                "transition-all duration-300 ease-out"
            )}
            onClick={() => router.push(path)}
        >
            <CardHeader className="flex flex-row items-center space-y-0 gap-3 pb-3">
                <div className={cn(
                    "flex items-center justify-center rounded-xl p-2.5 shadow-sm",
                    color
                )}>
                    <div className="h-5 w-5 text-white [&>svg]:h-full [&>svg]:w-full">
                        {icon}
                    </div>
                </div>
                <CardTitle className="text-base font-semibold tracking-tight group-hover:text-primary transition-colors">
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
                <CardDescription className="text-sm leading-relaxed text-muted-foreground">
                    {description}
                </CardDescription>
                <div className="mt-4 flex items-center text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    Get Started <ChevronRight className="ml-1 h-3 w-3" />
                </div>
            </CardContent>
        </Card>
    );
};

export default function Dashboard() {
    const { isLoaded, isSignedIn, user } = useUser();
    const router = useRouter();
    const { userProfile, isLoading: isProfileLoading, profileError } = useUserProfile();
    const [isAdmin, setIsAdmin] = useState(false);
    const [isChecking, setIsChecking] = useState(true);
    const [displayName, setDisplayName] = useState('');

    useEffect(() => {
        // Load from cache instantly to prevent flicker
        const cachedName = localStorage.getItem('cm_display_name');
        if (cachedName) {
            setDisplayName(cachedName);
        } else if (user?.firstName) {
            setDisplayName(user.firstName);
        }
    }, [user?.firstName]);

    useEffect(() => {
        if (userProfile) {
            if (userProfile.role === 'ADMIN') {
                setIsAdmin(true);
            }
            if (userProfile.displayName) {
                setDisplayName(userProfile.displayName);
                localStorage.setItem('cm_display_name', userProfile.displayName);
            }
            if (!userProfile.isContentfulTokenSet) {
                router.push({
                    pathname: '/dashboard/profile',
                    query: { setup: 'required' }
                });
                return;
            }
            setIsChecking(false);
        } else if (isLoaded && isSignedIn) {
            // Fail-safe: do not block dashboard forever if profile fetch fails.
            if (!isProfileLoading && profileError) {
                setIsChecking(false);
            } else {
                setIsChecking(isProfileLoading ?? false);
            }
        }
    }, [userProfile, isLoaded, isSignedIn, router, isProfileLoading, profileError]);

    if (!isLoaded || isChecking) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Loading Dashboard...</p>
            </div>
        );
    }

    const toolCards = [
        {
            title: 'Create Backup',
            icon: <BackupIcon />,
            path: '/backup',
            description: 'Select an environment and create a full backup of content types and entries.',
            color: 'bg-blue-600'
        },
        {
            title: 'Restore Backup',
            icon: <RestoreIcon />,
            path: '/restore',
            description: 'Restore a previous backup to a target environment with safety checks.',
            color: 'bg-amber-600'
        },
        {
            title: 'Smart Restore',
            icon: <Sparkles />,
            path: '/smart-restore',
            description: 'Selectively transfer content types, entries and locales between environments or spaces via live CMA data.',
            color: 'bg-violet-600'
        },
        {
            title: 'Smart Migrate',
            icon: <AutoFixHighIcon />,
            path: '/smart-migration',
            description: 'Compare environments and migrate only changed entries intelligently.',
            color: 'bg-emerald-600'
        },
        {
            title: 'Visual Builder',
            icon: <BuildIcon />,
            path: '/visual-migration',
            description: 'Visually create migration scripts without writing code (POC).',
            color: 'bg-cyan-600'
        },
        {
            title: 'Views Migrate',
            icon: <ViewQuiltIcon />,
            path: '/views-migration',
            description: 'Migrate saved views between environments.',
            color: 'bg-indigo-600'
        },
    ];

    const managementCards = [
        {
            title: 'Backups History',
            icon: <HistoryIcon />,
            path: '/backups',
            description: 'View and manage your history of created backups.',
            color: 'bg-slate-600'
        },
        {
            title: 'Profile & Settings',
            icon: <SettingsSuggestIcon />,
            path: '/dashboard/profile',
            description: 'Manage integrations and tokens.',
            color: 'bg-zinc-600'
        },
        {
            title: 'My Logs',
            icon: <HistoryIcon />,
            path: '/dashboard/my-logs',
            description: 'View your personal system activity and debugging logs.',
            color: 'bg-blue-600'
        },
        ...(isAdmin ? [{
            title: 'Admin Logs',
            icon: <Shield />,
            path: '/dashboard/logs',
            description: 'View system activity and errors (Admin only).',
            color: 'bg-red-700',
            adminOnly: true
        }] : [])
    ];

    return (
        <div className="max-w-7xl mx-auto py-10 px-6">
            <div className="text-center mb-12 space-y-3">
                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-indigo-400">
                    Welcome, {displayName || 'User'}
                </h1>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    Select an action to manage your Contentful environments with precision.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {toolCards.map((card) => (
                    <DashboardCard key={card.title} {...card} />
                ))}
            </div>

            <div className="my-8 flex items-center gap-4">
                <div className="h-px flex-1 bg-border" />
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Management</span>
                <div className="h-px flex-1 bg-border" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {managementCards.map((card) => (
                    <DashboardCard key={card.title} {...card} />
                ))}
            </div>
        </div>
    );
}
