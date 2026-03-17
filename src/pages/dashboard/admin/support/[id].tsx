import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { 
    ChevronLeft, 
    MessageSquare, 
    UserCircle, 
    Clock, 
    Check, 
    X, 
    Loader2, 
    ImageIcon, 
    ExternalLink,
    Calendar,
    ArrowUpRight
} from 'lucide-react';
import { useUser } from '@clerk/nextjs';
import { useUserProfile } from '@/hooks/useUserProfile';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Image from 'next/image';
import { api } from "@/utils/api";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

interface SupportRequest {
    id: string;
    name: string | null;
    email: string;
    message: string;
    screenshotUrl: string | null;
    status: string;
    createdAt: string;
    user: {
        clerkId: string;
        displayName?: string;
        email?: string;
    };
}

export default function SupportRequestDetailsPage() {
    const router = useRouter();
    const { id } = router.query;
    const { isLoaded } = useUser();
    const { userProfile } = useUserProfile();
    
    const [request, setRequest] = useState<SupportRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);

    const fetchRequest = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await api.get<SupportRequest>(`/api/admin/support/${id}`);
            if (res.success && res.data) {
                setRequest(res.data);
            } else {
                toast.error("Error", { description: "Request not found" });
                router.push('/dashboard/logs');
            }
        } catch {
            toast.error("Error", { description: "Failed to fetch request details" });
        } finally {
            setLoading(false);
        }
    }, [id, router]);

    useEffect(() => {
        if (userProfile && userProfile.role !== 'ADMIN') {
            router.push('/');
        } else if (userProfile && id) {
            fetchRequest();
        }
    }, [userProfile, id, fetchRequest, router]);

    const handleUpdateStatus = async (newStatus: string) => {
        if (!request) return;
        setUpdating(true);
        try {
            const res = await api.put<{ success: boolean; error?: string }>('/api/admin/support', { id: request.id, status: newStatus });
            if (res.success) {
                toast.success('Status updated successfully');
                setRequest({ ...request, status: newStatus });
            } else {
                toast.error('Update Failed', { description: res.error });
            }
        } catch {
            toast.error('Update Error');
        } finally {
            setUpdating(false);
        }
    };

    if (!isLoaded || loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Loading details...</p>
            </div>
        );
    }

    if (!request) return null;

    return (
        <div className="max-w-5xl mx-auto py-10 px-6 space-y-8 animate-in fade-in duration-500">
            {/* Header / Breadcrumbs */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <Button variant="ghost" size="sm" asChild className="-ml-3 h-8 text-muted-foreground hover:text-foreground">
                        <Link href="/dashboard/logs?tab=support">
                            <ChevronLeft className="mr-1 h-4 w-4" /> Back to Dashboard
                        </Link>
                    </Button>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-extrabold tracking-tight">Support Request</h1>
                        <Badge variant={request.status === 'RESOLVED' ? 'default' : request.status === 'CLOSED' ? 'secondary' : 'outline'}
                              className={cn(
                                  "font-bold text-xs uppercase px-3 py-1 mt-1",
                                  request.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                  request.status === 'OPEN' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ''
                              )}>
                            {request.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground text-sm font-medium opacity-60">ID: {request.id}</p>
                </div>

                <div className="flex items-center gap-3">
                    {request.status === 'OPEN' && (
                        <>
                            <Button 
                                variant="outline" 
                                className="border-green-500/30 text-green-500 hover:bg-green-500/10 h-10 px-6 gap-2"
                                onClick={() => handleUpdateStatus('RESOLVED')}
                                disabled={updating}
                            >
                                {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                Mark as Resolved
                            </Button>
                            <Button 
                                variant="ghost" 
                                className="text-muted-foreground hover:bg-red-500/10 hover:text-red-500 h-10 px-6"
                                onClick={() => handleUpdateStatus('CLOSED')}
                                disabled={updating}
                            >
                                <X className="h-4 w-4 mr-2" />
                                Close Ticket
                            </Button>
                        </>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <Card className="border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
                        <CardHeader className="bg-muted/30 border-b pb-6">
                            <div className="flex items-center gap-3 text-primary">
                                <MessageSquare className="h-5 w-5" />
                                <CardTitle className="text-lg">Message from User</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="pt-6">
                            <div className="bg-accent/5 border border-primary/5 rounded-2xl p-6 text-base leading-relaxed whitespace-pre-wrap selection:bg-primary/20 shadow-inner min-h-[200px]">
                                {request.message}
                            </div>
                        </CardContent>
                    </Card>

                    {request.screenshotUrl && (
                        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden shadow-xl">
                            <CardHeader className="bg-muted/30 border-b pb-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-primary">
                                        <ImageIcon className="h-5 w-5" />
                                        <CardTitle className="text-lg">Attached Screenshot</CardTitle>
                                    </div>
                                    <Button variant="outline" size="sm" asChild className="h-8 gap-2">
                                        <a href={request.screenshotUrl} target="_blank" rel="noopener noreferrer">
                                            <ExternalLink className="h-3.5 w-3.5" />
                                            Original File
                                        </a>
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <div className="rounded-2xl overflow-hidden border border-primary/10 bg-black/40 flex items-center justify-center p-2 shadow-2xl relative min-h-[400px]">
                                    <Image 
                                        src={request.screenshotUrl} 
                                        alt="Support Attachment" 
                                        fill
                                        className="object-contain rounded-xl p-2"
                                        unoptimized
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar Info */}
                <div className="space-y-8">
                    <Card className="border-primary/10 bg-card/50 backdrop-blur-sm shadow-xl sticky top-24">
                        <CardHeader className="bg-muted/30 border-b pb-4">
                            <CardTitle className="text-sm font-bold tracking-widest opacity-70">User Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                            <div className="flex items-center gap-4 group">
                                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 group-hover:bg-primary/20 transition-colors">
                                    <UserCircle className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest opacity-40 mb-1">Full Name</p>
                                    <p className="font-bold text-lg leading-none">{request.name || 'Anonymous'}</p>
                                </div>
                            </div>

                            <Separator className="bg-primary/5" />

                            <div className="space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold tracking-widest opacity-40 mb-1">Email Address</p>
                                    <div className="flex items-center justify-between group">
                                        <p className="text-sm font-semibold truncate max-w-[200px]">{request.email}</p>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 transition-all" asChild>
                                            <a href={`mailto:${request.email}`}>
                                                <ArrowUpRight className="h-4 w-4" />
                                            </a>
                                        </Button>
                                    </div>
                                </div>

                                <div>
                                    <p className="text-[10px] font-bold tracking-widest opacity-40 mb-1">Submitted At</p>
                                    <div className="flex items-center gap-2 text-sm font-semibold">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        {new Date(request.createdAt).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium pl-5">
                                        <Clock className="h-3 w-3" />
                                        {new Date(request.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        <span className="opacity-40">•</span>
                                        {formatDistanceToNow(new Date(request.createdAt), { addSuffix: true })}
                                    </div>
                                </div>

                                <div className="pt-4">
                                    <Button variant="secondary" className="w-full text-xs font-bold tracking-widest" asChild>
                                        <a href={`mailto:${request.email}?subject=Re: Support Request ${request.id.slice(0, 8)}`}>
                                            Reply via Email
                                        </a>
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
