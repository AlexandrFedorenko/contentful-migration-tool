import React from 'react';
import { RestoreStep } from './types';
import { Loader2 } from "lucide-react";

interface CurrentStepProps {
  step: RestoreStep | undefined;
}

const CurrentStep = React.memo<CurrentStepProps>(({ step }) => {
  if (!step) return null;

  return (
    <div className="p-4 bg-primary/5 border border-primary/10 rounded-xl relative overflow-hidden group">
      <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
      <div className="relative z-10">
        <div className="flex items-center gap-2 mb-1">
          <Loader2 className="h-3 w-3 animate-spin text-primary" />
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-primary">Active Process</span>
        </div>
        <p className="text-sm font-bold tracking-tight mb-1">
          {step.name}
        </p>
        {step.message && (
          <p className="text-xs text-muted-foreground/80 leading-relaxed max-w-[90%]">
            {step.message}
          </p>
        )}
      </div>
    </div>
  );
});

CurrentStep.displayName = 'CurrentStep';

export default CurrentStep;
