/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import {
    RefreshCcw,
    Search,
    ChevronDown,
    ChevronUp,
    ChevronLeft,
    ChevronRight,
    Eye,
    Trash2,
    Loader2,
    Database,
    Filter,
    X,
    TrendingUp,
    HistoryIcon,
    AlertTriangle
} from 'lucide-react';
import { ActivityBarChart } from '@/components/Charts/ActivityChart';

import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger
} from "@/components/ui/tooltip";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { api } from "@/utils/api";
import { parseError, instructionToString } from "@/utils/errorParser";

interface LogEntry {
    id: string;
    level: string;
    action: string;
    message: string;
    details: any;
    status: string;
    timestamp: string;
    logFile?: string;
}

const Row = ({ row, onViewLog, onDeleteLog }: { row: LogEntry; onViewLog: (file: string) => void; onDeleteLog: (file: string) => void }) => {
    const [open, setOpen] = useState(false);

    const getStatusColor = (status: string) => {
        return status === 'SUCCESS'
            ? "bg-green-500/10 text-green-500 border-green-500/20"
            : "bg-red-500/10 text-red-500 border-red-500/20";
    };

    const getLevelColor = (level: string) => {
        switch (level) {
            case 'ERROR': return "bg-red-600 text-white border-red-700";
            case 'WARN': return "bg-yellow-500 text-white border-yellow-600";
            default: return "bg-blue-500 text-white border-blue-600";
        }
    };

    return (
        <>
            <TableRow
                className="cursor-pointer transition-colors hover:bg-muted/50"
                onClick={() => setOpen(!open)}
            >
                <TableCell className="w-[50px]">
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                </TableCell>
                <TableCell className="font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(row.timestamp).toLocaleString()}
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className={cn("px-2 py-0 h-5 text-[10px] font-bold uppercase", getLevelColor(row.level))}>
                        {row.level}
                    </Badge>
                </TableCell>
                <TableCell className="font-bold">{row.action}</TableCell>
                <TableCell>
                    <Badge variant="outline" className={cn("px-2 py-0 h-5 text-[10px] font-bold", getStatusColor(row.status))}>
                        {row.status}
                    </Badge>
                </TableCell>
                <TableCell align="right">
                    {row.logFile && (
                        <div className="flex gap-1 justify-end" onClick={(e) => e.stopPropagation()}>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-primary hover:bg-primary/10"
                                            onClick={() => onViewLog(row.logFile!)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>View Detailed Log</TooltipContent>
                                </Tooltip>
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                                            onClick={() => onDeleteLog(row.logFile!)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Delete Log File</TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                    )}
                </TableCell>
            </TableRow>
            {open && (
                <TableRow className="bg-muted/30">
                    <TableCell colSpan={6} className="p-0 border-b-0">
                        <div className="p-6 space-y-4 animate-in slide-in-from-top-2 duration-200">
                            <div className="flex items-center gap-2">
                                <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Payload Details</h4>
                                <Separator className="flex-grow" />
                            </div>
                            <p className="text-sm text-foreground/80 leading-relaxed max-w-4xl">{row.message}</p>
                            {row.details && (
                                <div className="rounded-lg bg-slate-950 border border-white/5 p-4 overflow-x-auto shadow-inner">
                                    <pre className="text-xs text-slate-400 font-mono leading-relaxed">
                                        {JSON.stringify(row.details, null, 2)}
                                    </pre>
                                </div>
                            )}
                        </div>
                    </TableCell>
                </TableRow>
            )}
        </>
    );
};

export default function MyLogsPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [userStats, setUserStats] = useState<{ activity: { date: string; success: number; error: number; total: number }[]; totalActions: number; successRate: number } | null>(null);
    const [loading, setLoading] = useState(true);

    // Filters
    const [search, setSearch] = useState('');
    const [level, setLevel] = useState('ALL');
    const [status, setStatus] = useState('ALL');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState<string>('15');
    const [total, setTotal] = useState(0);
    const [totalPages, setTotalPages] = useState(1);

    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewLogContent, setViewLogContent] = useState('');

    const fetchData = useCallback(async (page = currentPage) => {
        setLoading(true);
        try {
            const filterLevel = level === 'ALL' ? '' : level;
            const filterStatus = status === 'ALL' ? '' : status;

            const [logsRes, profileRes] = await Promise.all([
                api.get<any>(`/api/user/logs?level=${filterLevel}&status=${filterStatus}&search=${search}&page=${page}&limit=${pageSize}`),
                api.get<any>('/api/user/profile')
            ]);

            if (logsRes.success && logsRes.data) {
                setLogs(logsRes.data.logs || []);
                setTotal(logsRes.data.total ?? 0);
                setTotalPages(logsRes.data.totalPages ?? 1);
            }
            if (profileRes.success && profileRes.data?.stats) {
                setUserStats(profileRes.data.stats);
            }
        } catch (e) {
            const instruction = parseError(e instanceof Error ? e.message : 'Unknown error');
            const translatedError = instructionToString(instruction);
            console.error('Failed to fetch user logs or stats', e);
            toast.error("Fetch Failed", { description: translatedError });
        } finally {
            setLoading(false);
        }
    }, [level, status, search, currentPage, pageSize]);

    useEffect(() => {
        if (isLoaded && !user) router.push('/');
    }, [isLoaded, user, router]);

    useEffect(() => {
        if (isLoaded && user) fetchData(currentPage);
    }, [isLoaded, user, fetchData, currentPage]);

    // Reset to page 1 when filters or page size change
    useEffect(() => {
        setCurrentPage(1);
    }, [level, status, search, pageSize]);

    const handleViewLog = async (filePath: string) => {
        try {
            const result = await api.get<any>(`/api/user/error-log?file=${encodeURIComponent(filePath)}`);
            if (result.success && result.data?.content) {
                try {
                    const formatted = JSON.stringify(JSON.parse(result.data.content), null, 2);
                    setViewLogContent(formatted);
                } catch {
                    setViewLogContent(result.data.content);
                }
                setViewDialogOpen(true);
            } else {
                toast.error("Load Failed", { description: result.error || "Failed to load log file content" });
            }
        } catch (e) {
            const instruction = parseError(e instanceof Error ? e.message : 'Unknown error');
            toast.error("Error", { description: instructionToString(instruction) });
        }
    };

    const handleDeleteLogFile = async (filePath: string) => {
        if (!confirm('Are you sure you want to delete this detailed log file? This will not delete the system log entry.')) return;

        try {
            const result = await api.delete<any>(`/api/user/error-log?file=${encodeURIComponent(filePath)}`);
            if (result.success) {
                toast.success("Deleted", { description: "Log file deleted successfully" });
                fetchData();
            } else {
                toast.error("Delete Failed", { description: result.error || "Failed to delete log file" });
            }
        } catch (e) {
            const instruction = parseError(e instanceof Error ? e.message : 'Unknown error');
            toast.error("Error", { description: instructionToString(instruction) });
        }
    };

    const handleClearAllLogs = async () => {
        setLoading(true);
        try {
            const result = await api.delete<any>('/api/user/logs');
            if (result.success) {
                toast.success("Logs Cleared", { description: "All activity logs have been deleted." });
                setLogs([]);
                setUserStats(prev => prev ? { ...prev, activity: [], totalActions: 0, successRate: 0 } : null);
            } else {
                toast.error("Process Failed", { description: result.error || "Failed to clear logs" });
            }
        } catch (e) {
            const instruction = parseError(e instanceof Error ? e.message : 'Unknown error');
            toast.error("Error", { description: instructionToString(instruction) });
        } finally {
            setLoading(false);
        }
    };

    if (!isLoaded || (loading && logs.length === 0)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Loading My Logs...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400">
                        My Logs
                    </h1>
                    <p className="text-muted-foreground">
                        Review your personal system activity and debugging logs.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => fetchData(currentPage)} disabled={loading} className="shadow-sm">
                        <RefreshCcw className={cn("mr-2 h-4 w-4", (loading && logs.length > 0) && "animate-spin")} /> Refresh
                    </Button>
                    
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm" disabled={logs.length === 0 || loading} className="shadow-lg shadow-destructive/10">
                                <Trash2 className="mr-2 h-4 w-4" /> Clear All Logs
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="border-destructive/20 bg-card/95 backdrop-blur-xl">
                            <AlertDialogHeader>
                                <AlertDialogTitle className="flex items-center gap-2 text-destructive">
                                    <AlertTriangle className="h-5 w-5" />
                                    Purge All Activity Logs?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                    This action will **permanently delete** all your system logs and associated error files from our database and storage. This cannot be undone.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction onClick={handleClearAllLogs} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
                                    Yes, Purge Everything
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            </div>

            {/* Activity Chart */}
            {userStats?.activity && userStats.activity.some(d => d.total > 0) && (
                <Card className="border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">My Activity — Last 7 Days</CardTitle>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-sm bg-green-500 inline-block" />
                                    {userStats.activity.reduce((s, d) => s + d.success, 0)} success
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-sm bg-red-500 inline-block" />
                                    {userStats.activity.reduce((s, d) => s + d.error, 0)} errors
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0 px-6 pb-6">
                        <ActivityBarChart
                            data={userStats.activity}
                            height={140}
                            showLegend={false}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Logs Table Section */}
            <Card className="border-primary/10 bg-card/10 backdrop-blur-sm overflow-hidden flex flex-col">
                <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl flex items-center gap-2">
                                <HistoryIcon className="h-5 w-5 text-primary" />
                                Activity Logs
                            </CardTitle>
                            <CardDescription>Records of your actions</CardDescription>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative group">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search logs..."
                                    className="pl-9 w-[200px] h-9 bg-background/50"
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>

                            <Select value={level} onValueChange={setLevel}>
                                <SelectTrigger className="w-[130px] h-9 bg-background/50">
                                    <SelectValue placeholder="Level" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Levels</SelectItem>
                                    <SelectItem value="INFO">Info</SelectItem>
                                    <SelectItem value="WARN">Warning</SelectItem>
                                    <SelectItem value="ERROR">Error</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={status} onValueChange={setStatus}>
                                <SelectTrigger className="w-[130px] h-9 bg-background/50">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="ALL">All Statuses</SelectItem>
                                    <SelectItem value="SUCCESS">Success</SelectItem>
                                    <SelectItem value="FAILED">Failed</SelectItem>
                                </SelectContent>
                            </Select>

                            <Select value={pageSize} onValueChange={setPageSize}>
                                <SelectTrigger className="w-[110px] h-9 bg-background/50">
                                    <SelectValue placeholder="Per page" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="15">15 / page</SelectItem>
                                    <SelectItem value="25">25 / page</SelectItem>
                                    <SelectItem value="50">50 / page</SelectItem>
                                    <SelectItem value="all">All</SelectItem>
                                </SelectContent>
                            </Select>

                            <Button size="sm" onClick={() => { setCurrentPage(1); fetchData(1); }} className="shadow-lg shadow-primary/20">
                                <Filter className="mr-2 h-4 w-4" /> Filter
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className={cn("p-0 transition-opacity duration-200", loading && "opacity-50 pointer-events-none")}>
                    <Table>
                        <TableHeader className="bg-muted/20">
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-64 text-center">
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                            <Database className="h-8 w-8 opacity-20" />
                                            <p className="text-sm font-medium">No system logs found matching criteria</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                logs.map((log) => (
                                    <Row
                                        key={log.id}
                                        row={log}
                                        onViewLog={handleViewLog}
                                        onDeleteLog={handleDeleteLogFile}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-6 py-4 border-t bg-muted/10">
                        <p className="text-sm text-muted-foreground">
                            Showing {logs.length} of <span className="font-semibold text-foreground">{total}</span> entries
                        </p>
                        <div className="flex items-center gap-1">
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={currentPage <= 1 || loading}
                                onClick={() => { const p = currentPage - 1; setCurrentPage(p); fetchData(p); }}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            {Array.from({ length: totalPages }, (_, i) => i + 1)
                                .filter(p => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                                .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                                    if (idx > 0 && p - (arr[idx - 1] as number) > 1) acc.push('...');
                                    acc.push(p);
                                    return acc;
                                }, [])
                                .map((item, idx) =>
                                    item === '...' ? (
                                        <span key={`ellip-${idx}`} className="px-2 text-muted-foreground text-sm">…</span>
                                    ) : (
                                        <Button
                                            key={item}
                                            variant={currentPage === item ? 'default' : 'outline'}
                                            size="icon"
                                            className="h-8 w-8 text-xs"
                                            disabled={loading}
                                            onClick={() => { setCurrentPage(item as number); fetchData(item as number); }}
                                        >
                                            {item}
                                        </Button>
                                    )
                                )
                            }
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8"
                                disabled={currentPage >= totalPages || loading}
                                onClick={() => { const p = currentPage + 1; setCurrentPage(p); fetchData(p); }}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Detail Log View Dialog */}
            <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
                <DialogContent className="max-w-4xl max-h-[85vh] flex flex-col p-0 overflow-hidden border-primary/20">
                    <DialogHeader className="p-6 bg-muted/30 border-b flex flex-row items-center justify-between space-y-0">
                        <div>
                            <DialogTitle className="flex items-center gap-2">
                                <Eye className="h-5 w-5 text-primary" /> Detailed CLI Error Log
                            </DialogTitle>
                            <DialogDescription>Full execution context and stack traces</DialogDescription>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setViewDialogOpen(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </DialogHeader>
                    <div className="p-6 overflow-y-auto bg-slate-950 font-mono text-[13px] leading-relaxed relative flex-grow">
                        <pre className="text-slate-300">
                            {viewLogContent}
                        </pre>
                    </div>
                    <DialogFooter className="p-4 bg-muted/30 border-t">
                        <Button onClick={() => setViewDialogOpen(false)}>Close Inspector</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
