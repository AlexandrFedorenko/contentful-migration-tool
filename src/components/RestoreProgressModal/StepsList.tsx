import React from 'react';
import { RestoreStep } from './types';
import { getStepIcon, getStepStyles } from '@/utils/restore-progress-utils';
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface StepsListProps {
  steps: RestoreStep[];
}

const StepsList = React.memo<StepsListProps>(({ steps }) => {
  return (
    <div className="space-y-4">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60 px-1">
        Execution Log
      </h4>
      <div className="space-y-2">
        {steps.map((step, index) => {
          const styles = getStepStyles(step.status);

          return (
            <div
              key={index}
              className={cn(
                "flex items-start gap-4 p-3 rounded-lg border transition-all bg-transparent border-transparent",
                styles.container
              )}
            >
              <div className={cn(
                "p-2 rounded-lg mt-0.5 font-extrabold uppercase tracking-tighter",
                styles.icon
              )}>
                {getStepIcon(step.status)}
              </div>
              <div className="flex-1 min-w-0 py-0.5">
                <div className="flex items-center justify-between gap-2">
                  <p className={cn(
                    "text-sm font-bold tracking-tight",
                    styles.text
                  )}>
                    {step.name}
                  </p>
                  {step.duration && (
                    <Badge variant="outline" className="h-5 px-2 text-[9px] font-mono bg-muted/30 border-border/50 opacity-60">
                      {step.duration}
                    </Badge>
                  )}
                </div>
                {step.message && (
                  <p className="text-[11px] text-muted-foreground/60 mt-0.5 leading-relaxed truncate group-hover:whitespace-normal group-hover:overflow-visible italic">
                    {step.message}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
});

StepsList.displayName = 'StepsList';

export default StepsList;
