import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Users, Shield, ShieldAlert, History, Lock } from 'lucide-react';
import { api } from "@/utils/api";
import { toast } from "sonner";
import { format } from 'date-fns';
import { parseError, instructionToString } from "@/utils/errorParser";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from '@clerk/nextjs';

interface UserAdminRecord {
    id: string;
    clerkId: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    displayName: string | null;
    imageUrl: string | null;
    role: string;
    createdAt: string;
    isBanned: boolean;
    isPrimaryAdmin: boolean;
    _count: {
        backups: number;
        scripts: number;
        tokens: number;
    };
}

export function UserManagement() {
    const [users, setUsers] = useState<UserAdminRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const { user: currentUser } = useUser();

    const fetchUsers = useCallback(async () => {
        try {
            const res = await api.get<UserAdminRecord[]>('/api/admin/users');
            if (res.success && res.data) {
                setUsers(res.data);
            }
        } catch {
            const instruction = parseError('Failed to fetch users');
            toast.error("Error", { description: instructionToString(instruction) });
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleAction = async (id: string, action: string, role?: string) => {
        setActionLoading(id + action);
        try {
            const res = await api.put<{ success: boolean; message?: string; error?: string }>('/api/admin/users', { id, action, role });
            if (res.success) {
                // @ts-expect-error message is appended manually in our custom endpoints
                toast.success('Success', { description: res.message || 'Action completed' });
                fetchUsers();
            } else {
                toast.error('Action Failed', { description: res.error });
            }
        } catch {
            toast.error('Error executing action');
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) {
        return <div className="p-8 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
    }

    return (
        <Card className="border-primary/10 bg-card/10 backdrop-blur-sm">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    User Directory
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader className="bg-muted/30">
                        <TableRow>
                            <TableHead>User</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Joined</TableHead>
                            <TableHead className="text-center">Usage Stats</TableHead>
                            <TableHead className="text-right">Admin Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {users.map((u) => (
                            <TableRow key={u.id} className={u.isBanned ? 'opacity-60' : ''}>
                                <TableCell>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border border-primary/20">
                                            <AvatarImage src={u.imageUrl || ''} />
                                            <AvatarFallback>{u.email[0].toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col">
                                            <span className="font-semibold text-sm">
                                                {u.firstName} {u.lastName} 
                                                {u.role === 'ADMIN' && <Shield className="w-3 h-3 inline ml-1 text-primary" />}
                                            </span>
                                            <span className="text-xs text-muted-foreground">{u.email}</span>
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {u.isBanned ? (
                                        <Badge variant="destructive" className="bg-red-500/10 text-red-500">Suspended</Badge>
                                    ) : (
                                        <Badge variant="outline" className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
                                    )}
                                </TableCell>
                                <TableCell className="text-sm font-mono text-muted-foreground">
                                    {format(new Date(u.createdAt), 'MMM dd, yyyy')}
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-mono">
                                        <Tooltip label="Backups">
                                            <div className="flex items-center gap-1">
                                                <History className="w-3 h-3" /> {u._count.backups}
                                            </div>
                                        </Tooltip>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-2">
                                        {u.isPrimaryAdmin || u.clerkId === currentUser?.id ? (
                                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 rounded-md border border-muted/40 bg-muted/20">
                                                <Lock className="h-3 w-3" />
                                                {u.isPrimaryAdmin ? 'Primary Admin' : 'You'}
                                            </div>
                                        ) : (
                                            <>
                                                <Button 
                                                    size="sm" 
                                                    variant="outline" 
                                                    disabled={!!actionLoading}
                                                    onClick={() => handleAction(u.id, 'change_role', u.role === 'ADMIN' ? 'MEMBER' : 'ADMIN')}
                                                >
                                                    {actionLoading === u.id + 'change_role' ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <ShieldAlert className="h-3 w-3 mr-1" />}
                                                    {u.role === 'ADMIN' ? 'Revoke Admin' : 'Make Admin'}
                                                </Button>
                                                {u.isBanned ? (
                                                    <Button size="sm" variant="outline" className="border-green-500/20 text-green-500 hover:bg-green-500/10" disabled={!!actionLoading} onClick={() => handleAction(u.id, 'unsuspend')}>Unsuspend</Button>
                                                ) : (
                                                    <Button size="sm" variant="outline" className="border-red-500/20 text-red-500 hover:bg-red-500/10" disabled={!!actionLoading} onClick={() => handleAction(u.id, 'suspend')}>Suspend</Button>
                                                )}
                                            </>
                                        )}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
}

// Simple internal tooltip for the usage stat since we don't want to import full TooltipProvider if not needed
function Tooltip({ children, label }: { children: React.ReactNode, label: string }) {
    return (
        <div className="group relative flex items-center justify-center">
            {children}
            <span className="absolute bottom-full mb-1 hidden whitespace-nowrap rounded bg-slate-800 px-2 py-1 text-xs text-white group-hover:block">
                {label}
            </span>
        </div>
    );
}
