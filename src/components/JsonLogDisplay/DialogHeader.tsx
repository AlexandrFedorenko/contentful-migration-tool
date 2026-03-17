import React from 'react';
import { DialogHeader as ShadcnDialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { AlertCircle } from "lucide-react";

const DialogHeader = React.memo(() => {
  return (
    <ShadcnDialogHeader className="bg-destructive/5 p-6 pr-14 border-b border-destructive/10">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-destructive/10 rounded-lg">
            <AlertCircle className="h-5 w-5 text-destructive" />
          </div>
          <DialogTitle className="text-xl font-extrabold uppercase tracking-tight text-destructive">
            Restoration Anomalies
          </DialogTitle>
        </div>
        <Badge variant="destructive" className="h-6 px-3 text-[10px] font-extrabold uppercase tracking-widest shadow-lg shadow-destructive/20">
          ACTION REQUIRED
        </Badge>
      </div>
    </ShadcnDialogHeader>
  );
});

DialogHeader.displayName = 'DialogHeader';

export default DialogHeader;
