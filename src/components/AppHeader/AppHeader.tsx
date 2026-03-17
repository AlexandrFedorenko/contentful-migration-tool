import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import {
    Sun,
    Moon,
    Menu,
    LayoutDashboard,
    CloudUpload as BackupIcon,
    RefreshCcw as RestoreIcon,
    Sparkles as AutoFixHighIcon,
    Layers as ViewQuiltIcon,
    History,
    Hammer as BuildIcon,
    FileText as DescriptionIcon,
    UserCircle as AccountCircleIcon,
    Activity as ListAltIcon,
    Github,
    Linkedin,
    Mail,
    LogOut
} from 'lucide-react';
import { useTheme } from "@/context/ThemeContext";
import { useGlobalContext } from "@/context/GlobalContext";
import { useClerk, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { ScrollArea } from "@/components/ui/scroll-area";
import { useUserProfile } from "@/hooks/useUserProfile";
import { cn } from "@/lib/utils";

const AppHeader = React.memo(function AppHeader() {
    const { mode, toggleTheme } = useTheme();
    const { dispatch } = useGlobalContext();
    const { isSignedIn, user } = useUser();
    const { signOut } = useClerk();
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [localDisplayName, setLocalDisplayName] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('cm_display_name') || '';
        }
        return '';
    });
    const router = useRouter();
    const { userProfile } = useUserProfile();


    useEffect(() => {
        if (userProfile) {
            if (userProfile.role === 'ADMIN') setIsAdmin(true);
            if (userProfile.displayName) {
                setLocalDisplayName(userProfile.displayName);
                localStorage.setItem('cm_display_name', userProfile.displayName);
            } else {
                localStorage.removeItem('cm_display_name');
                setLocalDisplayName('');
            }
        }
    }, [userProfile]);

    const menuItems = [
        { text: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, path: '/' },
        { text: 'Profile', icon: <AccountCircleIcon className="h-4 w-4" />, path: '/dashboard/profile' },
        { text: 'Create Backup', icon: <BackupIcon className="h-4 w-4" />, path: '/backup' },
        { text: 'Restore Backup', icon: <RestoreIcon className="h-4 w-4" />, path: '/restore' },
        { text: 'Smart Migrate', icon: <AutoFixHighIcon className="h-4 w-4" />, path: '/smart-migration' },
        { text: 'Visual Builder', icon: <BuildIcon className="h-4 w-4" />, path: '/visual-migration' },
        { text: 'Views Migrate', icon: <ViewQuiltIcon className="h-4 w-4" />, path: '/views-migration' },
        { text: 'Backups', icon: <History className="h-4 w-4" />, path: '/backups' },
        { text: 'My Logs', icon: <ListAltIcon className="h-4 w-4" />, path: '/dashboard/my-logs' },
        ...(isAdmin ? [{ text: 'System Logs', icon: <ListAltIcon className="h-4 w-4" />, path: '/dashboard/logs' }] : []),
        { text: 'Documentation', icon: <DescriptionIcon className="h-4 w-4" />, path: '/doc' },
    ];

    const handleEmailClick = () => {
        navigator.clipboard.writeText('alexandrfedorenkoooo@gmail.com');
        dispatch({
            type: 'SET_STATUS',
            payload: 'Email copied to clipboard!'
        });
    };

    const drawerContent = (
        <div className="flex flex-col h-full bg-background">
            <SheetHeader className="p-6 border-b">
                <SheetTitle className="flex items-center gap-2">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={100}
                        height={40}
                        className="object-contain"
                    />
                </SheetTitle>
            </SheetHeader>

            <ScrollArea className="flex-grow p-2">
                <div className="space-y-0">
                    {menuItems.map((item, index) => (
                        <Button
                            key={item.text}
                            variant={router.pathname === item.path ? "secondary" : "ghost"}
                            className={cn(
                                "w-full justify-start gap-3 px-6 py-6 text-sm font-medium transition-all rounded-none",
                                index !== menuItems.length - 1 && "border-b border-border/30",
                                router.pathname === item.path && "bg-secondary/50 text-secondary-foreground"
                            )}
                            asChild
                            onClick={() => setDrawerOpen(false)}
                        >
                            <Link href={item.path}>
                                {item.icon}
                                {item.text}
                            </Link>
                        </Button>
                    ))}
                </div>
            </ScrollArea>

            <div className="p-4 border-t space-y-4">
                <div>
                    <span className="text-xs font-semibold text-muted-foreground block mb-2">
                        Connect with me
                    </span>
                    <div className="flex justify-around items-center">
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" asChild>
                                        <a href="https://github.com/AlexandrFedorenko/contentful-migration-tool" target="_blank" rel="noopener noreferrer">
                                            <Github className="h-5 w-5" />
                                        </a>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>GitHub Repository</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" asChild>
                                        <a href="https://www.linkedin.com/in/alexandr-fedorenko-939847112/" target="_blank" rel="noopener noreferrer">
                                            <Linkedin className="h-5 w-5 text-primary" />
                                        </a>
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>LinkedIn Profile</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button variant="ghost" size="icon" onClick={handleEmailClick}>
                                        <Mail className="h-5 w-5" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>Copy Email</TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>

                <Button
                    variant="destructive"
                    className="w-full gap-2"
                    onClick={() => signOut({ redirectUrl: '/sign-in' })}
                >
                    <LogOut className="h-4 w-4" />
                    Logout
                </Button>
            </div>
        </div>
    );

    return (
        <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6">
                <Link href="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity py-2" aria-label="Go to home page">
                    <Image
                        src="/logo.png"
                        alt="Logo"
                        width={120}
                        height={48}
                        priority
                        className="object-contain w-auto h-10"
                    />
                </Link>

                <div className="flex items-center gap-2">
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" onClick={toggleTheme} className="text-foreground">
                                    {mode === 'dark' ? <Sun className="h-5 w-5 text-yellow-500" /> : <Moon className="h-5 w-5 text-primary" />}
                                </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                                Switch to {mode === 'dark' ? 'light' : 'dark'} mode
                            </TooltipContent>
                        </Tooltip>
                    </TooltipProvider>

                    {isSignedIn && (
                        <>
                            <div
                                className="relative px-4 py-2 backdrop-blur-xl border-border/50 hover:bg-muted/90 transition-all cursor-default flex items-center gap-2"
                                onClick={() => router.push('/dashboard/profile')}
                            >
                                <span className="hidden md:block text-sm font-semibold">
                                    {localDisplayName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.fullName}
                                </span>
                                <Avatar className="h-8 w-8 border border-primary/20">
                                    <AvatarImage src={user?.imageUrl} alt={user?.fullName || 'User'} />
                                    <AvatarFallback>{user?.firstName?.charAt(0) || 'U'}</AvatarFallback>
                                </Avatar>
                            </div>

                            <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="md:ml-2">
                                        <Menu className="h-5 w-5" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="p-0 border-l">
                                    {drawerContent}
                                </SheetContent>
                            </Sheet>
                        </>
                    )}
                </div>
            </div>
        </header>
    );
});

export default AppHeader;
