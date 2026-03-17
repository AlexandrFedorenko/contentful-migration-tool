import React from 'react';
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import {
  FileText,
  Clock,
  ArrowRight,
  PlusCircle,
  History
} from "lucide-react";

interface ScanResultItem {
  id: string;
  title: string;
  status: 'changed' | 'new' | 'equal' | 'NEW' | 'MODIFIED' | 'DELETED';
  sysStatus?: 'Draft' | 'Changed' | 'Published';
  sourceUpdatedAt?: string;
  targetUpdatedAt?: string;
  contentTypeId: string;
}

interface ScanResultsListProps {
  items: ScanResultItem[];
  selectedIds: string[];
  onToggleSelect: (id: string) => void;
  onItemClick: (item: ScanResultItem) => void;
  height?: string | number;
}

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'new':
    case 'NEW':
      return (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[9px] font-black uppercase tracking-widest h-5 px-2">
          <PlusCircle className="h-3 w-3 mr-1" />
          New
        </Badge>
      );
    case 'changed':
    case 'MODIFIED':
      return (
        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[9px] font-black uppercase tracking-widest h-5 px-2">
          <History className="h-3 w-3 mr-1" />
          Changed
        </Badge>
      );
    case 'DELETED':
      return (
        <Badge variant="outline" className="bg-rose-500/10 text-rose-500 border-rose-500/20 text-[9px] font-black uppercase tracking-widest h-5 px-2">
          <History className="h-3 w-3 mr-1" />
          Deleted
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground border-border/50 text-[9px] font-black uppercase tracking-widest h-5 px-2">
          Synced
        </Badge>
      );
  }
};

const SysStatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case 'Changed':
      return (
        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[8px] font-black uppercase tracking-widest h-4 px-1.5 mr-2">
          Changed
        </Badge>
      );
    case 'Draft':
      return (
        <Badge variant="outline" className="bg-muted/10 text-muted-foreground border-border/50 text-[8px] font-black uppercase tracking-widest h-4 px-1.5 mr-2">
          Draft
        </Badge>
      );
    default:
      return null;
  }
};

export default function ScanResultsList({
  items,
  selectedIds,
  onToggleSelect,
  onItemClick,
  height = 600
}: ScanResultsListProps) {
  return (
    <div
      className="border border-border/50 rounded-2xl bg-card overflow-hidden shadow-2xl"
      style={{ height }}
    >
      <ScrollArea className="h-full">
        <div className="divide-y divide-white/5">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const labelId = `checkbox-list-label-${item.id}`;

            return (
              <div
                key={item.id}
                className={cn(
                  "flex items-center gap-4 p-4 hover:bg-muted/20 transition-all duration-300 cursor-pointer group",
                  isSelected && "bg-primary/5 border-l-2 border-l-primary px-[14px]"
                )}
                onClick={() => onItemClick(item)}
              >
                <div className="shrink-0" onClick={(e) => {
                  e.stopPropagation();
                  onToggleSelect(item.id);
                }}>
                  <Checkbox
                    id={labelId}
                    checked={isSelected}
                    onCheckedChange={() => onToggleSelect(item.id)}
                    className="h-5 w-5 border-border/50 data-[state=checked]:bg-primary rounded-md"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-black uppercase tracking-tight text-foreground/90 group-hover:text-foreground transition-colors truncate">
                      {item.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-[10px] font-mono text-muted-foreground opacity-50 uppercase tracking-tighter truncate max-w-[120px]">
                      ID: {item.id}
                    </p>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-60 transition-opacity">
                      <Clock className="h-2.5 w-2.5 text-muted-foreground" />
                      <span className="text-[8px] font-bold uppercase tracking-widest text-muted-foreground">
                        {item.sysStatus || 'PUBLISHED'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0 flex items-center gap-3">
                  <div className="flex flex-col items-end gap-1">
                    {item.sysStatus && <SysStatusBadge status={item.sysStatus} />}
                    <StatusBadge status={item.status} />
                  </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                    <ArrowRight className="h-4 w-4 text-primary" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 opacity-30 select-none">
            <FileText className="h-10 w-10 mb-2" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-center px-8">
              Scan Complete: No entries match filter criteria
            </p>
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
