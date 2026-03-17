import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { LogError } from './types';


interface WarningListProps {
  warnings: LogError[];
}

const WarningList = React.memo<WarningListProps>(({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <div className="space-y-4">
      <h6 className="text-[10px] font-bold uppercase tracking-widest text-amber-500 px-1">
        Non-critical Warnings ({warnings.length})
      </h6>
      <div className="space-y-2">
        {warnings.map((warning, index) => (
          <div key={index} className="flex items-center gap-4 p-3 bg-amber-500/5 border border-amber-500/10 rounded-lg group">
            <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold tracking-tight text-amber-500/90 truncate">
                {warning.message}
              </p>
              {warning.timestamp && (
                <p className="text-[9px] font-mono text-amber-500/40 uppercase tracking-tighter mt-0.5">
                  Logged at: {warning.timestamp}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
});

WarningList.displayName = 'WarningList';

export default WarningList;
