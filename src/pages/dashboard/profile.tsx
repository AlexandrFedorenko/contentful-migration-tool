/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useUser, useClerk } from "@clerk/nextjs";
import {
    CheckCircle,
    AlertCircle,
    Edit,
    Save,
    Download,
    Info,
    ShieldCheck,
    Cloud,
    User,
    Loader2,
    Trash2,
    History as HistoryIcon,
    TrendingUp,
    Activity,
    Plus,
    Check,
    AlertTriangle,
    MessageSquare,
    Send,
    X,
    Upload
} from 'lucide-react';
import { useStore } from "@/store/useStore";
import { useRouter } from 'next/router';
import { PageHelp } from '@/components/PageHelp/PageHelp';
import { TabIndex } from '@/hooks/useDocumentationTabs';
import { navigateTo } from '@/utils/navigation';
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
    CardFooter
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
    Alert,
    AlertDescription,
} from "@/components/ui/alert";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
    Tabs,
    TabsList,
    TabsTrigger,
} from "@/components/ui/tabs";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import Image from "next/image";
import { parseError, instructionToString } from "@/utils/errorParser";
import { ActivityBarChart, RingChart } from "@/components/Charts/ActivityChart";

export default function ProfilePage() {
    const { user, isLoaded } = useUser();
    const { openUserProfile, signOut } = useClerk();
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const supportFileRef = useRef<HTMLInputElement>(null);
    const store = useStore();

    // Persistent Display Name (Local DB Override)
    const [displayName, setDisplayName] = useState(() => {
        if (typeof window !== 'undefined') {
            return localStorage.getItem('cm_display_name') || '';
        }
        return '';
    });
    const [isEditingName, setIsEditingName] = useState(false);

    // App State
    const [contentfulToken, setContentfulToken] = useState('');
    const [backupCount, setBackupCount] = useState(0);
    const [isTokenSet, setIsTokenSet] = useState(false);
    const [userStats, setUserStats] = useState<{ activity: { date: string; success: number; error: number; total: number }[]; totalActions: number; successRate: number } | null>(null);
    const [recentLogs, setRecentLogs] = useState<{ id: string; level: string; action: string; message: string; status: string; timestamp: string }[]>([]);

    // Tokens State
    const [tokens, setTokens] = useState<{ id: string, alias: string, isActive: boolean, createdAt: string }[]>([]);
    const [newTokenAlias, setNewTokenAlias] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [tokenToDelete, setTokenToDelete] = useState<{ id: string, alias: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    // Support State
    const [supportMessage, setSupportMessage] = useState('');
    const [supportName, setSupportName] = useState('');
    const [supportEmail, setSupportEmail] = useState('');
    const [supportScreenshot, setSupportScreenshot] = useState<string | null>(null);
    const [isSubmittingSupport, setIsSubmittingSupport] = useState(false);

    const [editingTokenId, setEditingTokenId] = useState<string | null>(null);
    const [editAlias, setEditAlias] = useState('');
    const [range, setRange] = useState('7d');

    // UI State
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const fetchProfile = useCallback(async (currentRange: string = range) => {
        try {
            const result = await api.get<any>(`/api/user/profile?range=${currentRange}`);
            if (result.success && result.data) {
                const data = result.data;
                setIsTokenSet(data.isContentfulTokenSet);
                if (typeof data.backupCount === 'number') setBackupCount(data.backupCount);
                if (data.stats) setUserStats(data.stats);
                // Set persistent display name from local DB if it exists, else use Clerk's name
                const finalName = data.displayName || user?.fullName || user?.firstName || '';
                setDisplayName(finalName);
                if (data.displayName) {
                    localStorage.setItem('cm_display_name', data.displayName);
                }
            }
        } catch (error) {
            console.error("Failed to fetch profile", error);
        } finally {
            setLoading(false);
        }
    }, [user?.fullName, user?.firstName, range]);

    useEffect(() => {
        if (!localStorage.getItem('cm_display_name') && (user?.fullName || user?.firstName)) {
            setDisplayName(user?.fullName || user?.firstName || '');
        }

        if (router.query.setup === 'required') {
            toast.warning('Setup Required', {
                description: 'Please configure your Contentful Token to continue.'
            });
        }

        if (user?.primaryEmailAddress?.emailAddress) {
            setSupportEmail(user.primaryEmailAddress.emailAddress);
        }
    }, [router.query, user?.fullName, user?.firstName, user?.primaryEmailAddress?.emailAddress]);

    const fetchTokens = useCallback(async () => {
        try {
            const res = await api.get<any>('/api/user/tokens');
            if (res.success && res.data) setTokens(res.data);
        } catch { /* silent */ }
    }, []);

    useEffect(() => {
        if (isLoaded && user) {
            fetchProfile();
            fetchTokens();
            // Fetch recent logs
            api.get<any>('/api/user/logs?limit=8').then(r => {
                if (r.success && r.data?.logs) setRecentLogs(r.data.logs);
            }).catch(() => {/* silent */ });
        }
    }, [isLoaded, user, fetchProfile, fetchTokens]);

    const handleSaveProfile = async (fieldData: Record<string, string | number | boolean | undefined>) => {
        setSaving(true);
        try {
            const result = await api.post<any>('/api/user/profile', fieldData);

            if (result.success) {
                if (fieldData.contentfulToken !== undefined) {
                    setIsTokenSet(!!fieldData.contentfulToken);
                    setContentfulToken('');
                    store.dispatch({ type: 'SET_SPACE_ID', payload: '' });
                    toast.success(fieldData.contentfulToken ? 'Token saved successfully!' : 'Token disconnected.');
                } else {
                    toast.success('Profile updated successfully!');
                }

                await fetchProfile();

                if (fieldData.displayName !== undefined) {
                    setIsEditingName(false);
                    localStorage.setItem('cm_display_name', fieldData.displayName as string);
                }
                return true;
            } else {
                const instruction = parseError(result.error || 'Server error');
                toast.error('Update Failed', {
                    description: instructionToString(instruction)
                });
                return false;
            }
        } catch (error) {
            const instruction = parseError(error instanceof Error ? error.message : 'Unknown error');
            toast.error('Unexpected Error', {
                description: instructionToString(instruction)
            });
            return false;
        } finally {
            setSaving(false);
        }
    };

    const handleAddToken = async () => {
        if (!newTokenAlias.trim() || !contentfulToken.trim()) return;
        setSaving(true);
        try {
            const res = await api.post<any>('/api/user/tokens', { alias: newTokenAlias, token: contentfulToken });
            if (res.success) {
                toast.success('Token added successfully');
                setNewTokenAlias('');
                setContentfulToken('');
                fetchTokens();
            } else {
                toast.error('Failed to add token', { description: res.error });
            }
        } catch {
            toast.error('Error adding token');
        } finally {
            setSaving(false);
        }
    };

    const handleRenameToken = async (id: string) => {
        if (!editAlias.trim()) return;
        try {
            const res = await api.put<any>('/api/user/tokens', { id, alias: editAlias, action: 'rename' });
            if (res.success) {
                toast.success('Token renamed');
                setEditingTokenId(null);
                fetchTokens();
            } else {
                toast.error('Rename failed', { description: res.error });
            }
        } catch {
            toast.error('Error renaming token');
        }
    };

    const handleActivateToken = async (id: string) => {
        try {
            const res = await api.put<any>('/api/user/tokens', { id, action: 'activate' });
            if (res.success) {
                toast.success('Token activated');
                // Clear stale space state since the new token likely belongs to a different account/org
                store.dispatch({ type: "SET_SPACE_ID", payload: "" });
                fetchTokens();
            }
        } catch {
            toast.error('Error activating token');
        }
    };

    const handleDeleteToken = async (id: string) => {
        try {
            const res = await api.delete<any>(`/api/user/tokens?id=${id}`);
            if (res.success) {
                toast.success('Token deleted');
                fetchTokens();
                if (tokens.length <= 1) setIsTokenSet(false);
            }
        } catch {
            toast.error('Error deleting token');
        } finally {
            setTokenToDelete(null);
        }
    };

    const handleDeleteAccount = async () => {
        if (deleteConfirmText !== 'DELETE') return;
        setIsDeleting(true);
        try {
            const res = await api.delete<any>('/api/user/delete');
            if (res.success) {
                toast.success('Account deleted successfully');
                await openUserProfile(); // Alternatively, signOut({ redirectUrl: '/' }) but openUserProfile forces clerk redirect which handles deep logout
                await signOut({ redirectUrl: '/' });
            } else {
                toast.error('Failed to delete account', { description: res.error });
            }
        } catch {
            toast.error('Error deleting account');
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSupportScreenshot = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate type
        if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
            toast.error('Invalid File', { description: 'Only PNG and JPEG images are allowed.' });
            return;
        }

        // Validate size (e.g., 5MB)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('File Too Large', { description: 'Please upload an image smaller than 5MB.' });
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setSupportScreenshot(reader.result as string);
        };
        reader.readAsDataURL(file);
    };

    const handleSubmitSupport = async () => {
        if (!supportMessage.trim()) return;
        if (!supportEmail.trim() || !supportEmail.includes('@')) {
            toast.error('Invalid Email', { description: 'Please provide a valid email address.' });
            return;
        }

        setIsSubmittingSupport(true);
        try {
            const res = await api.post<any>('/api/user/support', {
                message: supportMessage,
                name: supportName,
                email: supportEmail,
                screenshot: supportScreenshot
            });

            if (res.success) {
                toast.success('Message sent!', { description: "We will get back to you soon." });
                setSupportMessage('');
                setSupportName('');
                setSupportScreenshot(null);
                if (supportFileRef.current) supportFileRef.current.value = '';
            } else {
                toast.error('Failed to send message', { description: res.error });
            }
        } catch {
            toast.error('Error sending message');
        } finally {
            setIsSubmittingSupport(false);
        }
    };

    const handleDownloadZip = async () => {
        try {
            navigateTo('/api/download-backup-zip?spaceId=all');
        } catch {
            toast.error('Download Failed', {
                description: 'Failed to download backups'
            });
        }
    };

    const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user) return;
        try {
            await user.setProfileImage({ file });
            toast.success('Photo Updated', {
                description: 'Profile photo updated successfully!'
            });
        } catch {
            toast.error('Update Failed', {
                description: 'Failed to update photo.'
            });
        }
    };

    if (!isLoaded || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Loading Profile...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Profile & Settings</h1>
                <p className="text-muted-foreground">
                    Manage your personal information and cloud connections.
                </p>
            </div>

            {/* Top Section: Activity Stats (Full Width) */}
            {userStats && (
                <div className="mb-8">
                    <Card className="border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden">
                        <CardHeader className="flex flex-row items-center justify-between pb-6">
                            <div className="flex items-center gap-2">
                                <Activity className="h-5 w-5 text-primary" />
                                <CardTitle className="text-xl">My Activity</CardTitle>
                            </div>
                            <Tabs value={range} onValueChange={(v) => { setRange(v); fetchProfile(v); }} className="w-auto">
                                <TabsList className="bg-accent/20">
                                    <TabsTrigger value="7d" className="text-sm">7 Days</TabsTrigger>
                                    <TabsTrigger value="30d" className="text-sm">30 Days</TabsTrigger>
                                    <TabsTrigger value="all" className="text-sm">All Time</TabsTrigger>
                                </TabsList>
                            </Tabs>
                        </CardHeader>
                        <CardContent className="space-y-8">
                            {/* Summary Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-center p-6 rounded-2xl bg-accent/30 border border-primary/10 transition-all hover:bg-accent/40 gap-6">
                                    <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Activity className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <p className="text-4xl font-extrabold tracking-tight">{userStats.totalActions}</p>
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Total Actions</p>
                                    </div>
                                </div>
                                <div className="flex items-center p-6 rounded-2xl bg-accent/30 border border-primary/10 transition-all hover:bg-accent/40 gap-6">
                                    <div className="h-14 w-14 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500">
                                        <CheckCircle className="h-7 w-7" />
                                    </div>
                                    <div>
                                        <p className="text-4xl font-extrabold tracking-tight text-green-500">
                                            {range === 'all'
                                                ? userStats.totalActions
                                                : userStats.activity.reduce((s, d) => s + d.success, 0)}
                                        </p>
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-1">Successful</p>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Section */}
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div className="md:col-span-1 flex flex-col items-center justify-center py-6 bg-accent/20 rounded-2xl border border-primary/5">
                                    <RingChart
                                        value={userStats.successRate}
                                        size={140}
                                        strokeWidth={14}
                                        color={userStats.successRate >= 80 ? '#22c55e' : userStats.successRate >= 50 ? '#f59e0b' : '#ef4444'}
                                        label="Success"
                                    />
                                    <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mt-4">Average Success</p>
                                </div>
                                <div className="md:col-span-3 flex flex-col justify-between p-6 bg-accent/20 rounded-2xl border border-primary/5">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="flex items-center gap-2">
                                            <TrendingUp className="h-4 w-4 text-primary" />
                                            <p className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                                {range === '7d' ? 'Weekly Distribution' : range === '30d' ? 'Last 30 Days' : 'Historical Trend'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="w-full mt-auto">
                                        <ActivityBarChart
                                            data={userStats.activity}
                                            height={160}
                                            showLegend
                                        />
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Middle Section: Personal Information (Full Width) */}
            <Card className="border-primary/10 bg-card/50 backdrop-blur-sm mb-8">
                <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                        <User className="h-5 w-5 text-primary" />
                        Personal Information
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Photo & Basic Info */}
                        <div className="flex items-center gap-6 p-6 rounded-2xl bg-accent/30 border border-primary/10 transition-all hover:bg-accent/40">
                            <div className="relative group">
                                <Avatar className="h-24 w-24 border-2 border-background shadow-md">
                                    <AvatarImage src={user?.imageUrl} />
                                    <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                                        {user?.firstName?.charAt(0) || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <Button
                                    size="icon"
                                    variant="default"
                                    className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full shadow-lg"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <input
                                    type="file"
                                    hidden
                                    ref={fileInputRef}
                                    onChange={handlePhotoUpload}
                                    accept="image/*"
                                />
                            </div>
                            <div className="space-y-1">
                                <h3 className="text-lg font-bold">Profile Identity</h3>
                                <p className="text-sm text-muted-foreground">
                                    Manage your public avatar and display name across the platform.
                                </p>
                            </div>
                        </div>

                        {/* Identity Controls */}
                        <div className="space-y-4 p-6 rounded-2xl bg-accent/20 border border-primary/5">
                            <div className="space-y-2">
                                <Label htmlFor="display-name" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Display Name</Label>
                                <div className="relative">
                                    <Input
                                        id="display-name"
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        disabled={!isEditingName}
                                        className={cn(
                                            "h-11 pr-10 font-medium",
                                            !isEditingName && "bg-muted/50 border-dashed"
                                        )}
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2">
                                        {isEditingName ? (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-green-500 hover:bg-green-500/10"
                                                onClick={() => handleSaveProfile({ displayName })}
                                                disabled={saving}
                                            >
                                                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                                            </Button>
                                        ) : (
                                            <Button
                                                size="icon"
                                                variant="ghost"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => setIsEditingName(true)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="login-email" className="text-sm font-bold uppercase tracking-widest text-muted-foreground/80">Login Email</Label>
                                <Input
                                    id="login-email"
                                    value={user?.primaryEmailAddress?.emailAddress || ''}
                                    disabled
                                    className="h-11 bg-muted/50 border-dashed opacity-70"
                                />
                            </div>
                        </div>

                        {/* Security & Account Management */}
                        <div className="flex flex-col justify-between p-6 bg-primary/5 rounded-2xl border border-primary/10">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <ShieldCheck className="h-5 w-5 text-primary" />
                                    <h4 className="font-bold">Account Security</h4>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                    Your authentication and session data are secured by **Clerk**. Manage your passwords and linked accounts in the global settings.
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="w-full mt-4 h-11 border-primary/20 hover:bg-primary/5 group"
                                onClick={() => openUserProfile()}
                            >
                                Open Account Settings
                                <Edit className="ml-2 h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-all" />
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contentful Integration Section (Full Width) */}
            <Card className="border-primary/10 bg-card/50 backdrop-blur-sm mb-8 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 px-6 pt-6">
                    <div className="space-y-1">
                        <div className="flex items-center gap-2">
                            <CardTitle className="text-xl flex items-center gap-2">
                                <Cloud className="h-5 w-5 text-primary" />
                                Contentful Integration
                            </CardTitle>
                            <PageHelp
                                description="Contentful Management API (CMA) token is required to manage your content. You can get it in your Contentful space settings."
                                docTab={TabIndex.CONTENTFUL_TOKEN}
                            />
                        </div>
                        <CardDescription>Connect your environments to start migrating content.</CardDescription>
                    </div>
                    <Badge variant={isTokenSet ? "default" : "outline"} className={cn(
                        "h-8 px-3",
                        isTokenSet ? "bg-green-600/10 text-green-500 border-green-500/20" : "text-yellow-500 border-yellow-500/20"
                    )}>
                        {isTokenSet ? (
                            <span className="flex items-center gap-1.5"><CheckCircle className="h-4 w-4" /> Connected</span>
                        ) : (
                            <span className="flex items-center gap-1.5"><AlertCircle className="h-4 w-4" /> Not Set</span>
                        )}
                    </Badge>
                </CardHeader>
                <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Left: Token List Container */}
                        <div className="flex flex-col rounded-2xl border border-primary/10 bg-accent/5 overflow-hidden">
                            <div className="px-5 py-4 border-b border-primary/5 bg-accent/5 flex items-center justify-between">
                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Saved Tokens</h4>
                                <Badge variant="secondary" className="text-[10px] font-bold px-2 py-0 h-5 bg-primary/10 text-primary border-none">
                                    {tokens.length} Active
                                </Badge>
                            </div>
                            <div className="p-5 flex-grow overflow-y-auto max-h-[450px] custom-scrollbar">
                                {tokens.length > 0 ? (
                                    <div className="space-y-3 pr-2">
                                        {tokens.map(token => (
                                            <div key={token.id} className={cn("p-4 rounded-xl border flex items-center justify-between gap-4 transition-all group", token.isActive ? "bg-primary/5 border-primary/20 ring-1 ring-primary/20" : "bg-card border-border hover:border-primary/20")}>
                                                <div className="flex items-center gap-4 overflow-hidden">
                                                    {/* LEFT: Activation Controls */}
                                                    <div className="shrink-0">
                                                        {token.isActive ? (
                                                            <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg shadow-primary/20">
                                                                <CheckCircle className="h-6 w-6" />
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                size="icon"
                                                                variant="outline"
                                                                className="h-10 w-10 rounded-full border-primary/20 text-primary hover:bg-primary/10 hover:border-primary/40 transition-all active:scale-95"
                                                                onClick={() => handleActivateToken(token.id)}
                                                                title="Activate this workspace"
                                                            >
                                                                <Plus className="h-5 w-5" />
                                                            </Button>
                                                        )}
                                                    </div>

                                                    <div className="space-y-0.5 overflow-hidden">
                                                        <div className="flex items-center gap-2">
                                                            {editingTokenId === token.id ? (
                                                                <div className="flex items-center gap-1">
                                                                    <Input
                                                                        size={15}
                                                                        className="h-7 text-sm w-40 bg-background"
                                                                        value={editAlias}
                                                                        onChange={(e) => setEditAlias(e.target.value)}
                                                                        autoFocus
                                                                    />
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-green-500 hover:bg-green-500/10" onClick={() => handleRenameToken(token.id)}>
                                                                        <Check className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-muted" onClick={() => setEditingTokenId(null)}>
                                                                        <X className="h-4 w-4" />
                                                                    </Button>
                                                                </div>
                                                            ) : (
                                                                <>
                                                                    <span className="font-bold truncate text-sm">{token.alias}</span>
                                                                    <Button variant="ghost" size="icon" className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { setEditingTokenId(token.id); setEditAlias(token.alias); }}>
                                                                        <Edit className="h-3 w-3 text-muted-foreground" />
                                                                    </Button>
                                                                </>
                                                            )}
                                                            {token.isActive && <Badge variant="default" className="text-[9px] px-1.5 h-4 bg-primary text-primary-foreground border-none tracking-tighter">ACTIVE</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                                                            <span className="font-mono bg-muted/50 px-1.5 rounded text-[10px]">••••••••••••</span>
                                                            <span className="text-[10px] opacity-70">Added {new Date(token.createdAt).toLocaleDateString()}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-1 shrink-0">
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        className="h-9 w-9 text-destructive/60 hover:text-destructive hover:bg-destructive/10"
                                                        onClick={() => setTokenToDelete({ id: token.id, alias: token.alias })}
                                                        title="Delete Integration"
                                                    >
                                                        <Trash2 className="h-5 w-5" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center p-6 bg-accent/5 rounded-xl border border-dashed border-primary/10">
                                        <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center mb-4">
                                            <Cloud className="h-8 w-8 text-primary opacity-20" />
                                        </div>
                                        <p className="text-sm font-semibold text-muted-foreground">No environments connected yet.</p>
                                        <p className="text-xs text-muted-foreground/60 mt-1 max-w-[200px]">Add your Contentful Management Token on the right to start.</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right: Add New Form Container */}
                        <div className="flex flex-col rounded-2xl border border-primary/10 bg-accent/5 overflow-hidden">
                            <div className="px-5 py-4 border-b border-primary/5 bg-accent/5">
                                <h4 className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground/80">Register New Integration</h4>
                            </div>
                            <div className="p-6 space-y-6 flex-grow flex flex-col justify-between">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground/60 ml-1">Workspace Alias</Label>
                                        <Input
                                            placeholder="e.g. Production CMS"
                                            value={newTokenAlias}
                                            onChange={(e) => setNewTokenAlias(e.target.value)}
                                            className="h-11 bg-background/50 border-primary/5 focus:border-primary/20 transition-all font-medium"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-[11px] font-bold uppercase tracking-tight text-muted-foreground/60 ml-1">CMA Token (Full Access)</Label>
                                        <Input
                                            type="password"
                                            placeholder="CFPAT-..."
                                            value={contentfulToken}
                                            onChange={(e) => setContentfulToken(e.target.value)}
                                            autoComplete="new-password"
                                            className="h-11 bg-background/50 border-primary/5 focus:border-primary/20 transition-all font-mono text-sm"
                                        />
                                    </div>

                                    <Alert className="bg-primary/5 border-primary/5 py-3">
                                        <Info className="h-4 w-4 text-primary/70" />
                                        <AlertDescription className="text-xs leading-relaxed text-muted-foreground/80">
                                            Manage your content programmatically. Tokens are securely encrypted and never shown in plain text after saving.
                                        </AlertDescription>
                                    </Alert>
                                </div>

                                <Button
                                    size="lg"
                                    onClick={handleAddToken}
                                    disabled={saving || !newTokenAlias.trim() || !contentfulToken.trim()}
                                    className="w-full h-12 shadow-md shadow-primary/10 transition-all hover:translate-y-[-1px] active:translate-y-[0px]"
                                >
                                    {saving ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Plus className="h-5 w-5 mr-3" />}
                                    {saving ? 'Validating Connection...' : 'Establish Connection'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Recent Activity Logs Section (Full Width) */}
            {recentLogs.length > 0 && (
                <Card className="border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden mb-8">
                    <CardHeader className="pb-4 pt-5 flex flex-row items-center justify-between space-y-0 px-6">
                        <CardTitle className="text-xl flex items-center gap-2">
                            <HistoryIcon className="h-5 w-5 text-primary" />
                            Recent Activity Logs
                        </CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/dashboard/my-logs')}
                            className="text-sm text-muted-foreground hover:text-foreground h-8"
                        >
                            Detailed View
                        </Button>
                    </CardHeader>
                    <CardContent className="px-6 pb-6 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {recentLogs.map(log => (
                                <div
                                    key={log.id}
                                    className="p-3 rounded-xl bg-accent/20 border border-border/50 flex flex-col gap-2 hover:border-primary/30 transition-all cursor-pointer group"
                                    onClick={() => router.push('/dashboard/my-logs')}
                                >
                                    <div className="flex justify-between items-start gap-2">
                                        <div className="flex items-center gap-2 flex-wrap">
                                            <span className={cn(
                                                "px-2 py-0.5 text-xs font-bold uppercase tracking-widest rounded-md",
                                                log.level === 'ERROR' ? "bg-red-500/10 text-red-500" :
                                                    log.level === 'WARN' ? "bg-amber-500/10 text-amber-500" :
                                                        "bg-blue-500/10 text-blue-500"
                                            )}>
                                                {log.level}
                                            </span>
                                            <span className="text-sm font-bold group-hover:text-primary transition-colors">{log.action}</span>
                                        </div>
                                        <span className="text-xs text-muted-foreground tabular-nums">
                                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm text-muted-foreground line-clamp-1 leading-relaxed">
                                        {log.message}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Support Form (Full Width) */}
            <div className="mb-8">
                <Card className="border-primary/10 bg-card/50 backdrop-blur-sm flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <MessageSquare className="h-5 w-5 text-primary" />
                            Help & Support
                        </CardTitle>
                        <CardDescription className="text-sm">
                            Suggest a feature or report a bug. We typically respond within 24 hours.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 pt-0">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <Label className="text-xs font-bold tracking-wider opacity-60 block mb-1">Your Name (Optional)</Label>
                                <Input
                                    placeholder="Alex"
                                    className="h-11 bg-accent/10 border-primary/5 focus-visible:ring-primary/20"
                                    value={supportName}
                                    onChange={(e) => setSupportName(e.target.value)}
                                    disabled={isSubmittingSupport}
                                />
                            </div>
                            <div>
                                <Label className="text-xs font-bold tracking-wider opacity-60 block mb-1">Email Address</Label>
                                <Input
                                    type="email"
                                    placeholder="alex@example.com"
                                    className="h-11 bg-accent/10 border-primary/5 focus-visible:ring-primary/20"
                                    value={supportEmail}
                                    onChange={(e) => setSupportEmail(e.target.value)}
                                    disabled={isSubmittingSupport}
                                />
                            </div>
                        </div>

                        <div>
                            <Label className="text-xs font-bold tracking-wider opacity-60 block mb-1">Message</Label>
                            <Textarea
                                placeholder="Tell us what's happening..."
                                className="min-h-[140px] text-sm resize-none bg-accent/10 border-primary/5 focus-visible:ring-primary/20"
                                value={supportMessage}
                                onChange={(e) => setSupportMessage(e.target.value)}
                                disabled={isSubmittingSupport}
                            />
                        </div>

                        <div>
                            <Label className="text-xs font-bold tracking-wider opacity-60 block mb-1">Screenshot (JPEG/PNG)</Label>
                            <div className="flex items-center gap-4">
                                <Input
                                    type="file"
                                    accept="image/png, image/jpeg, image/jpg"
                                    className="hidden"
                                    ref={supportFileRef}
                                    onChange={handleSupportScreenshot}
                                    disabled={isSubmittingSupport}
                                />
                                <Button
                                    variant="outline"
                                    type="button"
                                    className="flex-grow bg-accent/10 border-dashed border-primary/20 hover:border-primary/40 h-11 gap-2"
                                    onClick={() => supportFileRef.current?.click()}
                                    disabled={isSubmittingSupport}
                                >
                                    <Upload className="h-4 w-4" />
                                    {supportScreenshot ? 'Change Screenshot' : 'Upload Screenshot (JPEG, PNG)'}
                                </Button>
                                {supportScreenshot && (
                                    <div className="relative group">
                                        <div className="h-11 w-11 rounded-md border border-primary/20 overflow-hidden bg-accent/20 relative">
                                            <Image 
                                                src={supportScreenshot} 
                                                alt="Preview" 
                                                fill 
                                                className="object-cover" 
                                                unoptimized
                                            />
                                        </div>
                                        <button
                                            onClick={() => { setSupportScreenshot(null); if (supportFileRef.current) supportFileRef.current.value = ''; }}
                                            className="absolute -top-1 -right-1 bg-destructive text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        <Button className="w-full h-12 shadow-lg shadow-primary/10 text-base font-semibold" disabled={!supportMessage.trim() || !supportEmail.trim() || isSubmittingSupport} onClick={handleSubmitSupport}>
                            {isSubmittingSupport ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Send className="mr-2 h-5 w-5" />}
                            {isSubmittingSupport ? 'Sending Request...' : 'Submit Support Ticket'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Data Management & Danger Zone (Full Width) */}
            <div className="space-y-8 mb-8">
                <Card className="border-primary/10 bg-card/50 backdrop-blur-sm flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2">
                            <HistoryIcon className="h-5 w-5 text-primary" />
                            Data Management
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-8 flex-grow">
                        {/* Usage Progress */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-end">
                                <div className="space-y-1">
                                    <Label className="text-sm font-semibold">Local Backups Storage</Label>
                                    <p className="text-sm text-muted-foreground">Limited to 100 entries per account</p>
                                </div>
                                <span className="text-sm font-mono font-bold">{backupCount} / 100</span>
                            </div>
                            <Progress
                                value={(backupCount / 100) * 100}
                                className="h-2"
                            />
                            {backupCount >= 90 && (
                                <p className="text-sm text-destructive font-semibold flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" /> Storage almost full. Consider deleting old backups.
                                </p>
                            )}
                        </div>

                        <Separator />

                        {/* Actions Section */}
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Export Statistics</h4>
                                <p className="text-sm text-muted-foreground">Download all your metadata and entries in a single compressed archive.</p>
                                <Button
                                    variant="secondary"
                                    className="w-full mt-2"
                                    onClick={handleDownloadZip}
                                    disabled={backupCount === 0}
                                >
                                    <Download className="mr-2 h-4 w-4" />
                                    Download All Backups (.zip)
                                </Button>
                            </div>

                            <div className="space-y-2">
                                <h4 className="text-sm font-semibold">Automatic Integrity</h4>
                                <p className="text-sm text-muted-foreground">The system performing scheduled health checks of your synchronized data every 24 hours.</p>
                                <Alert className="bg-green-600/5 border-green-600/10 text-green-600/80 flex items-center gap-3 py-3 [&>svg]:relative [&>svg]:top-[-3px] [&>svg]:left-0 [&>svg~*]:pl-0">
                                    <CheckCircle className="h-4 w-4 shrink-0 m-0" />
                                    <AlertDescription className="text-sm p-0 m-0">
                                        Last sync was successful. No issues found.
                                    </AlertDescription>
                                </Alert>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-accent/20 border-t p-6">
                        <p className="text-sm text-muted-foreground text-center w-full">
                            Your data is protected by industry standard encryption both at rest and in transit.
                        </p>
                    </CardFooter>
                </Card>

                {/* Danger Zone */}
                <Card className="border-destructive/20 bg-destructive/5 backdrop-blur-sm h-full flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Danger Zone
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                            <AlertDescription className="text-sm leading-relaxed">
                                <strong>Warning:</strong> Deleting your account is permanent. All your integrations, migration scripts, templates, and backed-up data will be completely wiped from our servers.
                            </AlertDescription>
                        </Alert>
                        <div className="space-y-2 pt-2">
                            <Label className="text-sm font-medium text-destructive">Type "DELETE" to confirm</Label>
                            <Input
                                value={deleteConfirmText}
                                onChange={(e) => setDeleteConfirmText(e.target.value)}
                                placeholder="DELETE"
                                className="border-destructive/30 focus-visible:ring-destructive"
                            />
                        </div>
                        <Button
                            variant="destructive"
                            className="w-full mt-2"
                            disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                            onClick={handleDeleteAccount}
                        >
                            {isDeleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                            {isDeleting ? 'Deleting...' : 'Delete My Account and All Data'}
                        </Button>
                    </CardContent>
                </Card>
            </div>

            <AlertDialog open={!!tokenToDelete} onOpenChange={() => setTokenToDelete(null)}>
                <AlertDialogContent className="bg-card border-primary/20 backdrop-blur-xl">
                    <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertTriangle className="h-5 w-5" />
                            Delete Token
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground">
                            Are you sure you want to delete the token for <strong className="text-foreground">"{tokenToDelete?.alias}"</strong>? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-accent/10 border-primary/10">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => tokenToDelete && handleDeleteToken(tokenToDelete.id)}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete Token
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
