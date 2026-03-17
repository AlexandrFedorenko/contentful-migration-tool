import React, { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/router';
import {
  Trash2,
  Edit2,
  Eye,
  Download,
  FileArchive,
  Loader2,
  Info,
  ChevronLeft,
  ChevronRight,
  FileJson,
  Calendar,
  Search,
  X,
  Filter,
  Globe,
  CloudDownload,
  AlertTriangle
} from 'lucide-react';
import { downloadAssetsClientSide } from '@/utils/client-asset-downloader';
import { toast } from 'sonner';
import { useGlobalContext } from '@/context/GlobalContext';
import { useBackupDelete } from '@/hooks/useBackupDelete';
import { useBackupRename } from '@/hooks/useBackupRename';
import ErrorInstructionsButton from '@/components/ErrorInstructionsButton/ErrorInstructionsButton';
import { Backup } from '@/types/backup';
// Table components removed — using card-style rows instead
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const ITEMS_PER_PAGE = 15;

/** Extract environment name from a backup filename like "SpaceName-envName-2026-02-..." */
const extractEnvironment = (name: string): string => {
  const match = name.match(/^.+?-(.+?)-\d{4}-\d{2}-/);
  return match ? match[1] : 'unknown';
};

interface BackupListProps {
  selectedBackupForRestore?: Backup | null;
  onBackupSelect?: (backup: Backup) => void;
}

export default function BackupList({ selectedBackupForRestore, onBackupSelect }: BackupListProps) {
  const router = useRouter();
  const { state, dispatch } = useGlobalContext();
  const { handleDelete } = useBackupDelete();
  const { handleRename } = useBackupRename();

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [envFilter, setEnvFilter] = useState('all');
  const [assetsFilter, setAssetsFilter] = useState<'all' | 'with' | 'without'>('all');

  // Rename Dialog State
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedBackupForRename, setSelectedBackupForRename] = useState<Backup | null>(null);
  const [newBackupName, setNewBackupName] = useState('');
  const [downloadingAssetsId, setDownloadingAssetsId] = useState<string | null>(null);

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<Backup | null>(null);

  const handleRenameClick = (backup: Backup) => {
    setSelectedBackupForRename(backup);
    setNewBackupName(backup.name.replace('.json', ''));
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!selectedBackupForRename || !newBackupName.trim()) return;

    const success = await handleRename(
      state.spaceId,
      selectedBackupForRename.name,
      newBackupName.trim()
    );

    if (success) {
      setRenameDialogOpen(false);
      setSelectedBackupForRename(null);
      setNewBackupName('');
    }
  };

  const handleDeleteClick = (backup: Backup) => {
    setBackupToDelete(backup);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!backupToDelete) return;
    await handleDelete(state.spaceId, backupToDelete);
    setDeleteDialogOpen(false);
    setBackupToDelete(null);
  };

  const sortedBackups = useMemo(
    () => [...(state.backups || [])].sort((a, b) => b.time - a.time),
    [state.backups]
  );

  // Extract unique environments from backup names
  const uniqueEnvironments = useMemo(() => {
    const envSet = new Set(sortedBackups.map(b => extractEnvironment(b.name)));
    return Array.from(envSet).sort();
  }, [sortedBackups]);

  // Apply search & filters
  const filteredBackups = useMemo(() => {
    let result = sortedBackups;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => b.name.toLowerCase().includes(q));
    }
    if (envFilter !== 'all') {
      result = result.filter(b => extractEnvironment(b.name) === envFilter);
    }
    if (assetsFilter === 'with') {
      result = result.filter(b => b.hasZip);
    } else if (assetsFilter === 'without') {
      result = result.filter(b => !b.hasZip);
    }
    return result;
  }, [sortedBackups, searchQuery, envFilter, assetsFilter]);

  const hasActiveFilters = searchQuery.trim() !== '' || envFilter !== 'all' || assetsFilter !== 'all';

  const clearAllFilters = useCallback(() => {
    setSearchQuery('');
    setEnvFilter('all');
    setAssetsFilter('all');
    setPage(1);
  }, []);

  const totalPages = Math.ceil(filteredBackups.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBackups = useMemo(
    () => filteredBackups.slice(startIndex, endIndex),
    [filteredBackups, startIndex, endIndex]
  );

  const handleDownload = useCallback((backup: Backup) => {
    if (!backup.id) return;
    const downloadUrl = `/api/download-backup?spaceId=${state.spaceId}&backupId=${backup.id}&fileName=${encodeURIComponent(backup.name)}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = backup.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [state.spaceId]);

  const handleDownloadZip = useCallback((backup: Backup) => {
    const downloadUrl = `/api/download-transient-zip?spaceId=${state.spaceId}&fileName=${encodeURIComponent(backup.name)}`;
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = backup.name.replace('.json', '-with-assets.zip');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [state.spaceId]);

  // Download Warning Dialog State
  const [downloadWarningOpen, setDownloadWarningOpen] = useState(false);
  const [backupToDownload, setBackupToDownload] = useState<Backup | null>(null);

  const handleClientSideDownload = useCallback((backup: Backup) => {
    setBackupToDownload(backup);
    setDownloadWarningOpen(true);
  }, []);

  const executeClientSideDownload = useCallback(async () => {
    if (!backupToDownload || !backupToDownload.id) {
      setDownloadWarningOpen(false);
      return;
    }

    const backup = backupToDownload;
    setDownloadWarningOpen(false); // Close immediately

    try {
      setDownloadingAssetsId(backup.id!);
      toast.info("Preparing asset download...");

      // 1. Fetch JSON
      const response = await fetch(`/api/download-backup?backupId=${backup.id}`);
      if (!response.ok) throw new Error("Failed to fetch backup data");

      const backupData = await response.json();

      // 2. Client-side download
      const count = await downloadAssetsClientSide(backupData, (progress) => {
        if (progress.stage === 'zipping') {
          toast.loading("Compressing assets...", { id: 'asset-download' });
        }
      });

      toast.dismiss('asset-download');
      toast.success(`Assets downloaded successfully! (${count} files processed)`);
    } catch (error) {
      console.error("Asset download failed:", error);
      toast.error("Failed to download assets");
      toast.dismiss('asset-download');
    } finally {
      setDownloadingAssetsId(null);
      setBackupToDownload(null);
    }
  }, [backupToDownload]);

  if (state.loading.loadingBackups) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-base text-muted-foreground animate-pulse">Syncing backup vault...</p>
      </div>
    );
  }

  if (!state.backups || state.backups.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed border-muted rounded-xl bg-muted/5">
        <FileJson className="h-10 w-10 text-muted-foreground/30 mb-4" />
        <p className="text-base font-bold text-muted-foreground">No archives identified</p>
        <p className="text-base text-muted-foreground/60 italic">Initiate a snapshot to begin data history</p>
      </div>
    );
  }

  return (
    <div className="space-y-0">
      {/* Status Banner */}
      <div className={cn(
        "px-6 py-4 border-b",
        state.restoreMode
          ? "bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/10"
          : "bg-muted/20 dark:bg-muted/10 border-border/50"
      )}>
        <div className="flex items-center gap-3">
          <div className={cn(
            "h-7 w-7 rounded-lg flex items-center justify-center shrink-0",
            state.restoreMode
              ? "bg-indigo-500/15 border border-indigo-500/20"
              : "bg-muted/50 dark:bg-muted/30 border border-border/50"
          )}>
            <Info className={cn("h-3.5 w-3.5", state.restoreMode ? "text-indigo-400" : "text-muted-foreground/60")} />
          </div>
          <div>
            <p className={cn(
              "text-base font-bold uppercase tracking-widest",
              state.restoreMode ? "text-indigo-400" : "text-muted-foreground/70"
            )}>
              {state.restoreMode ? "Restore Mode Active" : "Operational Status"}
            </p>
            <p className="text-base text-muted-foreground/60 leading-relaxed">
              {state.restoreMode
                ? "Select a backup from the list below to initiate environment restore."
                : "Vault viewing mode enabled. Toggle 'Restore' capabilities in environment settings to deploy snapshots."}
            </p>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="px-6 py-3 border-b border-border/30 bg-muted/10 dark:bg-muted/5 space-y-3">
        <div className="flex items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <Input
              placeholder="Search backups..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(1); }}
              className="pl-9 h-8 text-base bg-background/50 dark:bg-background/30 border-border/50"
            />
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setPage(1); }}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/40 hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Environment Filter */}
          <Select value={envFilter} onValueChange={(val) => { setEnvFilter(val); setPage(1); }}>
            <SelectTrigger className="w-[160px] h-8 text-base font-medium bg-background/50 dark:bg-background/30 border-border/50 gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              <SelectValue placeholder="Environment" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-base">All Environments</SelectItem>
              {uniqueEnvironments.map(env => (
                <SelectItem key={env} value={env} className="text-base font-medium">{env}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Assets Filter */}
          <Select value={assetsFilter} onValueChange={(val) => { setAssetsFilter(val as 'all' | 'with' | 'without'); setPage(1); }}>
            <SelectTrigger className="w-[150px] h-8 text-base font-medium bg-background/50 dark:bg-background/30 border-border/50 gap-1.5">
              <FileArchive className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
              <SelectValue placeholder="Assets" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-base">All Backups</SelectItem>
              <SelectItem value="with" className="text-base font-medium">With Assets</SelectItem>
              <SelectItem value="without" className="text-base font-medium">Without Assets</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters */}
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-8 px-3 text-base text-muted-foreground hover:text-foreground gap-1.5"
            >
              <X className="h-3.5 w-3.5" />
              Clear
            </Button>
          )}
        </div>

        {/* Results count & per-page */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-base font-medium text-muted-foreground">
              Showing <span className="font-bold text-foreground">{filteredBackups.length > 0 ? startIndex + 1 : 0}–{Math.min(endIndex, filteredBackups.length)}</span> of <span className="font-bold text-foreground">{filteredBackups.length}</span> backups
            </span>
            {hasActiveFilters && filteredBackups.length !== sortedBackups.length && (
              <Badge variant="outline" className="h-5 px-2 text-base font-bold bg-primary/5 text-primary border-primary/20 gap-1">
                <Filter className="h-3 w-3" />
                filtered from {sortedBackups.length}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-base font-semibold text-muted-foreground/60 uppercase tracking-wider">Per page</Label>
            <Select
              value={itemsPerPage.toString()}
              onValueChange={(val) => {
                setItemsPerPage(Number(val));
                setPage(1);
              }}
            >
              <SelectTrigger className="w-[65px] h-7 text-base font-medium bg-background/50 dark:bg-background/30 border-border/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {['10', '15', '25', '50'].map(val => (
                  <SelectItem key={val} value={val} className="text-base">{val}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Backup List */}
      {currentBackups.length === 0 && hasActiveFilters ? (
        <div className="flex flex-col items-center justify-center p-12 space-y-3">
          <Search className="h-10 w-10 text-muted-foreground/20" />
          <p className="text-base font-semibold text-muted-foreground">No backups match your filters</p>
          <p className="text-base text-muted-foreground/60">Try adjusting your search or filter criteria</p>
          <Button variant="outline" size="sm" onClick={clearAllFilters} className="mt-2 text-base gap-1.5">
            <X className="h-3.5 w-3.5" /> Clear all filters
          </Button>
        </div>
      ) : (
        <TooltipProvider delayDuration={200}>
          <div className="divide-y divide-border/30 dark:divide-border/20">
            {currentBackups.map((backup) => {
              const isRestoring = state.restoreProgress.isActive &&
                state.restoreProgress.restoringBackupName === backup.name;
              const isSelected = selectedBackupForRestore?.id === backup.id;

              return (
                <div
                  key={backup.id || backup.name}
                  className={cn(
                    "group flex items-center gap-4 px-6 py-4 transition-all duration-200 cursor-pointer",
                    isSelected
                      ? "bg-primary/5 dark:bg-primary/10 border-l-2 border-l-primary"
                      : "hover:bg-muted/30 dark:hover:bg-muted/15 border-l-2 border-l-transparent",
                    isRestoring && "opacity-50 pointer-events-none"
                  )}
                  onClick={() => {
                    if (state.restoreMode && onBackupSelect) {
                      onBackupSelect(backup);
                    }
                  }}
                >
                  {/* Radio for Restore Mode */}
                  {state.restoreMode && (
                    <div className="shrink-0">
                      <RadioGroup value={isSelected ? (backup.id || backup.name) : ""} className="flex justify-center">
                        <RadioGroupItem
                          value={backup.id || backup.name}
                          checked={isSelected}
                          className="border-primary/50 text-primary data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </RadioGroup>
                    </div>
                  )}

                  {/* File Icon */}
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center shrink-0 transition-colors",
                    isSelected
                      ? "bg-primary/10 dark:bg-primary/15 border border-primary/20"
                      : "bg-muted/40 dark:bg-muted/20 border border-border/50 group-hover:bg-primary/10 group-hover:border-primary/20"
                  )}>
                    <FileJson className={cn(
                      "h-5 w-5 transition-colors",
                      isSelected ? "text-primary" : "text-muted-foreground/50 group-hover:text-primary"
                    )} />
                  </div>

                  {/* Backup Info */}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className={cn(
                        "text-base font-semibold tracking-tight transition-colors truncate",
                        isSelected ? "text-primary" : "text-foreground/90 group-hover:text-primary"
                      )}>
                        {backup.name}
                      </span>
                      {backup.hasZip && (
                        <Badge variant="outline" className="h-5 px-2 text-base font-bold bg-emerald-500/5 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 gap-1">
                          <FileArchive className="h-3 w-3" />
                          Assets
                        </Badge>
                      )}
                      {isRestoring && (
                        <Badge className="h-5 px-2 text-base font-bold bg-primary/10 text-primary border-primary/20 animate-pulse gap-1">
                          <Loader2 className="h-3 w-3 animate-spin" />
                          Deploying...
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-base text-muted-foreground/60">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(backup.time).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-0.5 shrink-0">
                    {state.errorInstruction && state.errorBackupFile === backup.name && (
                      <ErrorInstructionsButton
                        instruction={state.errorInstruction}
                        onClick={() => dispatch({ type: "TOGGLE_ERROR_MODAL", payload: true })}
                        disabled={false}
                      />
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg hover:bg-blue-500/10 hover:text-blue-500 dark:hover:text-blue-400"
                          onClick={(e) => {
                            e.stopPropagation();
                            router.push(`/backup-preview/${backup.name}?spaceId=${state.spaceId}`);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-base font-medium">Preview</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg hover:bg-muted"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRenameClick(backup);
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-base font-medium">Rename</TooltipContent>
                    </Tooltip>

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg hover:bg-emerald-500/10 hover:text-emerald-500 dark:hover:text-emerald-400"
                          disabled={!backup.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(backup);
                          }}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-base font-medium">Download JSON</TooltipContent>
                    </Tooltip>

                    {backup.hasZip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-indigo-500/10 hover:text-indigo-500 dark:hover:text-indigo-400"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDownloadZip(backup);
                            }}
                          >
                            <FileArchive className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-base font-medium">Download Assets</TooltipContent>
                      </Tooltip>
                    )}

                    {!backup.hasZip && (
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-9 w-9 rounded-lg hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400"
                            disabled={!!downloadingAssetsId}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleClientSideDownload(backup);
                            }}
                          >
                            {downloadingAssetsId === backup.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <CloudDownload className="h-4 w-4" />
                            )}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top" className="text-base font-medium">Download Assets (Client-Side)</TooltipContent>
                      </Tooltip>
                    )}

                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 rounded-lg hover:bg-destructive/10 hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteClick(backup);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="text-base font-medium">Delete</TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              );
            })}
          </div>
        </TooltipProvider>
      )}

      {/* Pagination Footer */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 px-6 py-4 border-t border-border/30 bg-muted/10 dark:bg-muted/5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="h-8 px-4 text-base font-medium border-border/50 hover:bg-muted/50"
          >
            <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
          </Button>
          <div className="flex items-center gap-1.5">
            <span className="text-base text-muted-foreground">Page</span>
            <span className="text-base font-bold text-foreground">{page}</span>
            <span className="text-base text-muted-foreground">of {totalPages}</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="h-8 px-4 text-base font-medium border-border/50 hover:bg-muted/50"
          >
            Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </div>
      )}

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent className="sm:max-w-md border-primary/20 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-extrabold uppercase tracking-tight">
              <Edit2 className="h-5 w-5 text-primary" /> Rename Archive
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Define a new identifier for this backup profile.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6">
            <div className="space-y-2">
              <Label htmlFor="rename-input" className="text-base font-bold uppercase tracking-widest text-muted-foreground">Profile Name</Label>
              <div className="relative group">
                <Input
                  id="rename-input"
                  autoFocus
                  placeholder="enter.new.name"
                  value={newBackupName}
                  onChange={(e) => setNewBackupName(e.target.value)}
                  className="bg-background/50 border-border/50 pr-12 font-mono"
                />
                <span className="absolute right-3 top-2.5 text-base font-bold text-muted-foreground/40 group-focus-within:text-primary transition-colors">.json</span>
              </div>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-3">
            <Button variant="ghost" onClick={() => setRenameDialogOpen(false)} className="text-base font-bold uppercase tracking-widest">Abort</Button>
            <Button onClick={handleRenameSubmit} className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-lg shadow-primary/20">COMMIT RENAME</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md border-destructive/20 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-extrabold uppercase tracking-tight text-destructive">
              <Trash2 className="h-5 w-5" /> Purge Confirmation
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Security Protocol: Confirm permanent destruction of archive record.
            </DialogDescription>
          </DialogHeader>
          <div className="py-6 flex justify-center">
            <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-lg text-center max-w-sm">
              <p className="text-base font-bold text-foreground/90 mb-1">{backupToDelete?.name}</p>
              <p className="text-base text-destructive uppercase tracking-widest font-extrabold leading-tight">This action will result in permanent data loss.</p>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-3">
            <Button variant="ghost" onClick={() => setDeleteDialogOpen(false)} className="text-base font-bold uppercase tracking-widest">Cancel</Button>
            <Button
              onClick={handleDeleteConfirm}
              className="bg-destructive hover:bg-destructive/90 text-white font-bold px-8 shadow-lg shadow-destructive/20"
            >
              EXECUTE PURGE
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      {/* Client-Side Download Warning Dialog */}
      <Dialog open={downloadWarningOpen} onOpenChange={setDownloadWarningOpen}>
        <DialogContent className="sm:max-w-md border-amber-500/20 bg-card/95 backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-extrabold uppercase tracking-tight text-amber-500">
              <AlertTriangle className="h-5 w-5" /> Download Warning
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Please review the download method limitations.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-lg text-base text-foreground/90 leading-relaxed">
              <p className="font-semibold mb-2 text-amber-500 uppercase tracking-widest text-base">Direct Contentful Fetch</p>
              <p>
                This action downloads assets <strong>directly from Contentful's servers</strong> using references in the backup JSON.
              </p>
              <ul className="list-disc pl-4 mt-2 space-y-1 text-muted-foreground/80 text-base">
                <li>If assets have been <strong>deleted</strong> from Contentful since this backup was created, they cannot be downloaded.</li>
                <li>This process relies on the current state of files in the Contentful CDN.</li>
              </ul>
            </div>
          </div>
          <DialogFooter className="sm:justify-end gap-3">
            <Button variant="ghost" onClick={() => setDownloadWarningOpen(false)} className="text-base font-bold uppercase tracking-widest">Cancel</Button>
            <Button
              onClick={executeClientSideDownload}
              className="bg-amber-600 hover:bg-amber-700 text-white font-bold px-6 shadow-lg shadow-amber-500/20 gap-2"
            >
              <CloudDownload className="h-4 w-4" />
              PROCEED ANYWAY
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
