import React from 'react';
import { AlertCircle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";

interface TimeInfoProps {
  isCompleted: boolean;
  hasErrors: boolean;
}

const TimeInfo = React.memo<TimeInfoProps>(({ isCompleted, hasErrors }) => {
  const getMessage = () => {
    if (isCompleted) {
      return hasErrors
        ? 'Protocol completed with exceptions. Verify logs for discrepancy details.'
        : 'Restoration sequence successful. Target environment synchronized.';
    }
    return 'Temporal warning: This sequence may persist for several minutes. Do not terminate connection or refresh interface.';
  };

  return (
    <div className={cn(
      "flex items-center gap-3 p-4 rounded-xl border",
      isCompleted
        ? (hasErrors ? "bg-amber-500/5 border-amber-500/10 text-amber-500" : "bg-emerald-500/5 border-emerald-500/10 text-emerald-400")
        : "bg-muted/10 border-border/50 text-muted-foreground/60 italic"
    )}>
      <div className="shrink-0">
        {isCompleted ? (hasErrors ? <AlertCircle className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />) : <Info className="h-4 w-4" />}
      </div>
      <p className="text-[11px] font-bold uppercase tracking-wide leading-relaxed">
        {getMessage()}
      </p>
    </div>
  );
});

TimeInfo.displayName = 'TimeInfo';

export default TimeInfo;
