/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useState, useCallback } from 'react';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/router';
import {
    RefreshCcw,
    Search,
    ChevronDown,
    ChevronUp,
    AlertCircle,
    Users,
    Activity,
    Eye,
    Trash2,
    Loader2,
    Database,
    HardDrive,
    MessageSquare,
    Filter,
    X,
    TrendingUp
} from 'lucide-react';
import { ActivityBarChart } from '@/components/Charts/ActivityChart';
import { SettingsCard } from '@/components/Admin/SettingsCard';
import { UserManagement } from '@/components/Admin/UserManagement';
import { SupportManagement } from '@/components/Admin/SupportManagement';

import { useUserProfile } from '@/hooks/useUserProfile';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    Alert,
    AlertDescription,
    AlertTitle,
} from "@/components/ui/alert";
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    details: any;
    status: string;
    userEmail: string;
    timestamp: string;
    logFile?: string;
}

interface Stats {
    activity: { date: string; success: number; error: number; total: number }[];
    summary: {
        totalUsers: number;
        totalMigrations: number;
        migrationSuccessRate: number;
        admins: number;
        members: number;
        dbSize?: string;
        diskUsage?: string;
    }
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
                <TableCell className="text-sm">{row.userEmail || 'System'}</TableCell>
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
                    <TableCell colSpan={7} className="p-0 border-b-0">
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

export default function AdminLogsPage() {
    const { user, isLoaded } = useUser();
    const router = useRouter();

    const { userProfile } = useUserProfile();
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [stats, setStats] = useState<Stats | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('logs');
    const [cleanupDialogOpen, setCleanupDialogOpen] = useState(false);
    const [isCleaning, setIsCleaning] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [openClearDialog, setOpenClearDialog] = useState(false);
    const [clearRetention, setClearRetention] = useState('6m');

    // Filters
    const [search, setSearch] = useState('');
    const [level, setLevel] = useState('ALL');
    const [status, setStatus] = useState('ALL');

    const [viewDialogOpen, setViewDialogOpen] = useState(false);
    const [viewLogContent, setViewLogContent] = useState('');

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const filterLevel = level === 'ALL' ? '' : level;
            const filterStatus = status === 'ALL' ? '' : status;

            const [logsRes, statsRes] = await Promise.all([
                api.get<any>(`/api/admin/logs?level=${filterLevel}&status=${filterStatus}&search=${search}`),
                api.get<any>('/api/admin/stats')
            ]);

            if (logsRes.success && logsRes.data) {
                setLogs(logsRes.data.logs || []);
            }
            if (statsRes.success && statsRes.data) {
                setStats(statsRes.data);
            }
        } catch (e) {
            const instruction = parseError(e instanceof Error ? e.message : 'Unknown error');
            const translatedError = instructionToString(instruction);
            console.error('Failed to fetch admin data', e);
            toast.error("Fetch Failed", { description: translatedError });
        } finally {
            setLoading(false);
        }
    }, [level, status, search]);

    useEffect(() => {
        if (isLoaded && !user) router.push('/');
    }, [isLoaded, user, router]);

    useEffect(() => {
        if (!router.isReady) return;
        const tab = router.query.tab as string;
        if (tab && ['logs', 'users', 'support'].includes(tab)) {
            setActiveTab(tab);
        }
    }, [router.isReady, router.query.tab]);

    const handleTabChange = (tab: string) => {
        setActiveTab(tab);
        router.push({ query: { ...router.query, tab } }, undefined, { shallow: true });
    };

    useEffect(() => {
        if (userProfile) {
            if (userProfile.role === 'ADMIN') {
                setIsAdmin(true);
                fetchData();
            } else {
                router.push('/');
            }
        }
    }, [userProfile, router, fetchData]);

    const handleViewLog = async (filePath: string) => {
        try {
            const result = await api.get<any>(`/api/admin/error-log?file=${encodeURIComponent(filePath)}`);
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
            const result = await api.delete<any>(`/api/admin/error-log?file=${encodeURIComponent(filePath)}`);
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

    const handleClearLogs = async (retention: string) => {
        try {
            const result = await api.post<any>('/api/admin/clear-logs', { retention });
            if (result.success) {
                toast.success("Success", { description: result.data?.message || "Logs cleared" });
                setOpenClearDialog(false);
                fetchData();
            } else {
                toast.error("Failed", { description: result.error });
            }
        } catch (e) {
            const instruction = parseError(e instanceof Error ? e.message : 'Unknown error');
            toast.error("Error", { description: instructionToString(instruction) });
        }
    };

    const handleForceCleanup = async () => {
        setIsCleaning(true);
        try {
            const result = await api.post<any>('/api/admin/force-cleanup', {});
            if (result.success) {
                toast.success("Cleanup Pulse Sent", { description: result.data?.message });
                setCleanupDialogOpen(false);
            } else {
                toast.error("Cleanup Failed", { description: result.error });
            }
        } catch (e) {
            const instruction = parseError(e instanceof Error ? e.message : 'Unknown error');
            toast.error("Error", { description: instructionToString(instruction) });
        } finally {
            setIsCleaning(false);
        }
    };

    if (!isLoaded || (loading && !stats)) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse font-medium">Loading System Dashboard...</p>
            </div>
        );
    }

    if (!isAdmin) return null;

    interface StatCardProps {
        title: string;
        value: string | number;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        icon: React.ReactElement<any>;
        color: string;
        description: string;
    }

    const StatCard = ({ title, value, icon, color, description }: StatCardProps) => (
        <Card className="border-primary/10 bg-card/50 backdrop-blur-sm shadow-sm hover:shadow-md transition-all">
            <CardContent className="pt-6 pb-5">
                <div className="flex items-center gap-4 mb-4">
                    <div className={cn("p-3 rounded-xl text-white shadow-lg", color)}>
                        {React.cloneElement(icon, { className: "h-5 w-5" })}
                    </div>
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{title}</p>
                        <h3 className="text-3xl font-extrabold tracking-tight">{value}</h3>
                    </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            </CardContent>
        </Card>
    );

    return (
        <div className="max-w-7xl mx-auto py-8 px-6 space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-primary to-indigo-400">
                        System Dashboard
                    </h1>
                    <p className="text-muted-foreground">
                        Monitoring system health, user activity, and migration performance.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" onClick={() => setOpenClearDialog(true)} className="text-destructive border-destructive/20 hover:bg-destructive/10">
                        <Database className="mr-2 h-4 w-4" /> Clear Logs
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setCleanupDialogOpen(true)} className="text-destructive border-destructive/20 hover:bg-destructive/10">
                        <Trash2 className="mr-2 h-4 w-4" /> Purge Assets
                    </Button>
                    <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="shadow-sm">
                        <RefreshCcw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} /> Refresh
                    </Button>
                </div>
            </div>

            <SettingsCard />

            {/* Summary Stat Cards — Row 1: People & Migration KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Total Users"
                    value={stats?.summary.totalUsers || 0}
                    icon={<Users />}
                    color="bg-blue-600"
                    description={`${stats?.summary.admins ?? 0} Admins, ${stats?.summary.members ?? 0} Members`}
                />
                <StatCard
                    title="Migration Success"
                    value={`${stats?.summary.migrationSuccessRate || 0}%`}
                    icon={<Activity />}
                    color="bg-green-600"
                    description={`${stats?.summary.totalMigrations ?? 0} total migration events`}
                />
                <StatCard
                    title="Total Migrations"
                    value={stats?.summary.totalMigrations || 0}
                    icon={<TrendingUp />}
                    color="bg-indigo-600"
                    description={`${stats?.summary.migrationSuccessRate || 0}% success rate overall`}
                />
            </div>

            {/* Summary Stat Cards — Row 2: Infrastructure */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard
                    title="Active Alerts"
                    value={logs.filter(l => l.level === 'ERROR').length}
                    icon={<AlertCircle />}
                    color="bg-red-600"
                    description="Critical errors in recent logs"
                />
                <StatCard
                    title="Database Storage"
                    value={stats?.summary.dbSize || 'Unknown'}
                    icon={<Database />}
                    color="bg-purple-600"
                    description="Primary PostgreSQL size"
                />
                <StatCard
                    title="Local File Storage"
                    value={stats?.summary.diskUsage || '0 MB'}
                    icon={<HardDrive />}
                    color="bg-teal-600"
                    description="Space from project backups"
                />
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full space-y-6">
                <TabsList className="grid grid-cols-3 w-[400px]">
                    <TabsTrigger value="logs"><Activity className="w-4 h-4 mr-2" /> Activity Logs</TabsTrigger>
                    <TabsTrigger value="users"><Users className="w-4 h-4 mr-2" /> Users</TabsTrigger>
                    <TabsTrigger value="support"><MessageSquare className="w-4 h-4 mr-2" /> Support</TabsTrigger>
                </TabsList>

                <TabsContent value="logs" forceMount className="space-y-8 animate-in fade-in-50 data-[state=inactive]:hidden">

            {/* Activity Chart */}
            {stats?.activity && stats.activity.some(d => d.total > 0) && (
                <Card className="border-primary/10 bg-card/50 backdrop-blur-sm overflow-hidden">
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-primary" />
                                <CardTitle className="text-base">System Activity — Last 7 Days</CardTitle>
                            </div>
                            <div className="flex items-center gap-4 text-xs font-semibold text-muted-foreground">
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-sm bg-green-500 inline-block" />
                                    {stats!.activity.reduce((s, d) => s + d.success, 0)} success
                                </span>
                                <span className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 rounded-sm bg-red-500 inline-block" />
                                    {stats!.activity.reduce((s, d) => s + d.error, 0)} errors
                                </span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-0 px-6 pb-6">
                        <ActivityBarChart
                            data={stats!.activity}
                            height={140}
                            showLegend={false}
                        />
                    </CardContent>
                </Card>
            )}

            {/* Logs Table Section */}
            <Card className="border-primary/10 bg-card/10 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-muted/30 pb-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <CardTitle className="text-xl">Activity Logs</CardTitle>
                            <CardDescription>Real-time system events stream</CardDescription>
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

                            <Button size="sm" onClick={fetchData} className="shadow-lg shadow-primary/20">
                                <Filter className="mr-2 h-4 w-4" /> Filter
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-muted/20">
                            <TableRow>
                                <TableHead className="w-[50px]"></TableHead>
                                <TableHead>Timestamp</TableHead>
                                <TableHead>Level</TableHead>
                                <TableHead>Action</TableHead>
                                <TableHead>User</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {logs.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="h-64 text-center">
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
            </Card>

            {/* Clear Logs Dialog */}
            <Dialog open={openClearDialog} onOpenChange={setOpenClearDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Clear System Logs</DialogTitle>
                        <DialogDescription>
                            This action will permanently delete system logs from the database. This cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Retention Policy</label>
                            <Select value={clearRetention} onValueChange={setClearRetention}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select period" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="6m">Delete logs older than 6 months</SelectItem>
                                    <SelectItem value="3m">Delete logs older than 3 months</SelectItem>
                                    <SelectItem value="1m">Delete logs older than 1 month</SelectItem>
                                    <SelectItem value="all" className="text-destructive">Delete ALL logs (Wipe DB)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setOpenClearDialog(false)}>Cancel</Button>
                        <Button
                            onClick={() => handleClearLogs(clearRetention)}
                            variant="destructive"
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
                        >
                            Confirm Clear
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

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

            {/* Asset Purge Dialog */}
            <Dialog open={cleanupDialogOpen} onOpenChange={(open) => !isCleaning && setCleanupDialogOpen(open)}>
                <DialogContent className="border-destructive/20">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-destructive">
                            <AlertCircle className="h-5 w-5" /> Force Asset Purge
                        </DialogTitle>
                        <DialogDescription>
                            This will permanently delete ALL temporary folders (`images.ctfassets.net`) and ALL asset ZIP archives across ALL user spaces.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Alert variant="destructive" className="bg-destructive/5 text-destructive border-destructive/10">
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>Critical Action</AlertTitle>
                            <AlertDescription>
                                This cannot be reversed. Active migrations might be interrupted if they rely on these temporary files.
                            </AlertDescription>
                        </Alert>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setCleanupDialogOpen(false)} disabled={isCleaning}>Cancel</Button>
                        <Button
                            onClick={handleForceCleanup}
                            variant="destructive"
                            disabled={isCleaning}
                            className="bg-destructive hover:bg-destructive/90 text-destructive-foreground shadow-lg shadow-destructive/20"
                        >
                            {isCleaning ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Trash2 className="h-4 w-4 mr-2" />}
                            {isCleaning ? 'Purging Files...' : 'CONFIRM GLOBAL PURGE'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
                    </TabsContent>

                    <TabsContent value="users" forceMount className="animate-in fade-in-50 data-[state=inactive]:hidden">
                        <UserManagement />
                    </TabsContent>

                    <TabsContent value="support" forceMount className="animate-in fade-in-50 data-[state=inactive]:hidden">
                        <SupportManagement />
                    </TabsContent>
                </Tabs>
        </div >
    );
}
