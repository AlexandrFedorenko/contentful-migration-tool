import React from 'react';
import { LogError } from './types';
import { getSeverityIcon, formatError } from '@/utils/log-display-utils';
import { Badge } from "@/components/ui/badge";

import { ChevronRight } from "lucide-react";

interface ErrorListProps {
  errors: LogError[];
}

const ErrorList = React.memo<ErrorListProps>(({ errors }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <div className="space-y-4">
      <h6 className="text-[10px] font-bold uppercase tracking-widest text-destructive px-1 flex items-center gap-2">
        Critical Failures detected ({errors.length})
      </h6>
      <div className="space-y-3">
        {errors.map((error, index) => {
          const formattedError = formatError(error);
          return (
            <div
              key={index}
              className="group p-4 bg-destructive/5 border border-destructive/10 rounded-xl hover:bg-destructive/10 transition-colors"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="p-2 bg-destructive/10 rounded-lg">
                  {getSeverityIcon(error.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-bold tracking-tight text-destructive uppercase">
                      {formattedError.title}
                    </p>
                    <Badge variant="outline" className="text-[9px] font-mono border-destructive/20 text-destructive bg-destructive/5 capitalize">
                      {error.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-foreground/70 leading-relaxed font-medium">
                    {formattedError.description}
                  </p>
                </div>
              </div>

              {formattedError.steps.length > 0 && (
                <div className="ml-11 pl-4 border-l border-destructive/20 space-y-2 py-1">
                  {formattedError.steps.map((step, stepIndex) => (
                    <div key={stepIndex} className="flex items-start gap-2">
                      <ChevronRight className="h-3 w-3 mt-0.5 shrink-0 text-destructive/40" />
                      <p className="text-[11px] text-muted-foreground leading-relaxed">
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
});

ErrorList.displayName = 'ErrorList';

export default ErrorList;
