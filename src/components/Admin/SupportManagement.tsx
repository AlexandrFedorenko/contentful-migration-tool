import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
    Check, 
    X, 
    Loader2, 
    MessageSquare, 
    UserCircle, 
    Eye, 
    Mail, 
    ImageIcon, 
} from 'lucide-react';
import { api } from "@/utils/api";
import { toast } from "sonner";
import { formatDistanceToNow } from 'date-fns';
import { parseError, instructionToString } from "@/utils/errorParser";
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
    };
}

export function SupportManagement() {
    const router = useRouter();
    const [requests, setRequests] = useState<SupportRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchRequests = useCallback(async () => {
        try {
            const res = await api.get<SupportRequest[]>('/api/admin/support');
            if (res.success && res.data) {
                setRequests(res.data);
            }
        } catch {
            const instruction = parseError('Failed to fetch support requests');
            toast.error("Error", { description: instructionToString(instruction) });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        try {
            const res = await api.put<{ success: boolean; error?: string }>('/api/admin/support', { id, status: newStatus });
            if (res.success) {
                toast.success('Status updated');
                fetchRequests();
            } else {
                toast.error('Update Failed', { description: res.error });
            }
        } catch {
            toast.error('Update Error');
        } finally {
            setUpdatingId(null);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <Card className="border-primary/10 bg-card/10 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Support Requests
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead>User / Info</TableHead>
                            <TableHead>Message</TableHead>
                            <TableHead>Screenshot</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {requests.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={4} className="text-center h-32 text-muted-foreground">
                                    No support requests found
                                </TableCell>
                            </TableRow>
                        ) : (
                                        requests.map((req) => (
                                <TableRow key={req.id}>
                                    <TableCell className="min-w-[200px]">
                                        <div className="flex items-center gap-3">
                                            <UserCircle className="w-10 h-10 text-muted-foreground border border-primary/20 rounded-full p-2" />
                                            <div className="space-y-1">
                                                <p className="font-bold text-sm">{req.name || 'Anonymous'}</p>
                                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                    <Mail className="h-3 w-3" />
                                                    {req.email}
                                                </div>
                                                <p className="text-[10px] text-muted-foreground opacity-70">
                                                    {formatDistanceToNow(new Date(req.createdAt), { addSuffix: true })}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="max-w-[350px]">
                                        <p className="text-sm break-words line-clamp-2 leading-relaxed opacity-80">{req.message}</p>
                                    </TableCell>
                                    <TableCell>
                                        {req.screenshotUrl ? (
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-8 gap-2 bg-accent/30 border-primary/10 hover:bg-accent/50"
                                                onClick={() => router.push(`/dashboard/admin/support/${req.id}`)}
                                            >
                                                <ImageIcon className="h-3.5 w-3.5 text-primary" />
                                                View Image
                                            </Button>
                                        ) : (
                                            <span className="text-xs text-muted-foreground opacity-40 italic">No attachment</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={req.status === 'RESOLVED' ? 'default' : req.status === 'CLOSED' ? 'secondary' : 'outline'}
                                              className={cn(
                                                  "font-bold text-[10px] tracking-wider",
                                                  req.status === 'RESOLVED' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                                                  req.status === 'OPEN' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20' : ''
                                              )}>
                                            {req.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button 
                                                size="sm" 
                                                variant="outline" 
                                                className="h-8 gap-1.5 bg-accent/20 border-primary/10 hover:bg-accent/40"
                                                onClick={() => router.push(`/dashboard/admin/support/${req.id}`)}
                                            >
                                                <Eye className="h-3.5 w-3.5" />
                                                Details
                                            </Button>
                                            {req.status === 'OPEN' && (
                                                <>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                                        onClick={() => handleUpdateStatus(req.id, 'RESOLVED')}
                                                        disabled={updatingId === req.id}
                                                    >
                                                        {updatingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                                                    </Button>
                                                    <Button 
                                                        size="sm" 
                                                        variant="ghost" 
                                                        className="h-8 w-8 p-0 text-muted-foreground hover:bg-muted"
                                                        onClick={() => handleUpdateStatus(req.id, 'CLOSED')}
                                                        disabled={updatingId === req.id}
                                                    >
                                                        {updatingId === req.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                                                    </Button>
                                                </>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}
