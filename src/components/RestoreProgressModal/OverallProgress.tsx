import React from 'react';
import { Progress } from "@/components/ui/progress";

interface OverallProgressProps {
  overallProgress: number;
}

const OverallProgress = React.memo<OverallProgressProps>(({ overallProgress }) => {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-60">
          Overall Synchronization Status
        </span>
      </div>
      <Progress
        value={overallProgress}
        className="h-2 bg-muted"
      />
    </div>
  );
});

OverallProgress.displayName = 'OverallProgress';

export default OverallProgress;
