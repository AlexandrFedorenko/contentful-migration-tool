import React from 'react';
import { DialogHeader as ShadcnDialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Database } from "lucide-react";

interface DialogHeaderProps {
  completedSteps: number;
  totalSteps: number;
}

const DialogHeader = React.memo<DialogHeaderProps>(({ completedSteps, totalSteps }) => {
  return (
    <ShadcnDialogHeader className="bg-muted/40 p-6 pr-14 border-b border-border/50">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Database className="h-5 w-5 text-primary" />
          </div>
          <DialogTitle className="text-xl font-extrabold uppercase tracking-tight">
            Restoration Sequence
          </DialogTitle>
        </div>
        <Badge variant="outline" className="h-6 px-3 text-[10px] font-extrabold uppercase tracking-widest bg-primary/10 text-primary border-primary/20">
          {completedSteps} / {totalSteps} COMPLETED
        </Badge>
      </div>
    </ShadcnDialogHeader>
  );
});

DialogHeader.displayName = 'DialogHeader';

export default DialogHeader;
