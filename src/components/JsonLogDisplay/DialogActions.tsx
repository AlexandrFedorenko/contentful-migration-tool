import React, { memo, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { ExternalLink as OpenInNewIcon, Minimize2 } from 'lucide-react';

interface DialogActionsProps {
  onClose: () => void;
  onMinimize: () => void;
  backupFileName?: string;
}

const DialogActions = memo<DialogActionsProps>(({ onClose, onMinimize, backupFileName }) => {
  const handleOpenLogFile = useCallback(() => {
    if (backupFileName) {
      const url = `/log-viewer?fileName=${encodeURIComponent(backupFileName)}`;
      window.open(url, '_blank');
    }
  }, [backupFileName]);

  return (
    <div className="p-4 bg-muted/40 border-t border-border/50 flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="flex gap-2 w-full sm:w-auto">
        {backupFileName && (
          <Button
            onClick={handleOpenLogFile}
            variant="outline"
            className="flex-1 sm:flex-none h-9 px-4 text-[10px] font-extrabold uppercase tracking-widest border-primary/20 hover:bg-primary/5 text-primary"
          >
            <OpenInNewIcon className="h-3 w-3 mr-2" />
            Inspect Full Log
          </Button>
        )}
      </div>

      <div className="flex gap-2 w-full sm:w-auto">
        <Button
          onClick={onMinimize}
          variant="ghost"
          className="flex-1 sm:flex-none h-9 px-4 text-[10px] font-extrabold uppercase tracking-widest opacity-60 hover:opacity-100"
        >
          <Minimize2 className="h-3 w-3 mr-2" />
          Minimize
        </Button>
        <Button
          onClick={onClose}
          className="flex-1 sm:flex-none h-9 px-8 text-[10px] font-extrabold uppercase tracking-widest bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20"
        >
          Acknowledge
        </Button>
      </div>
    </div>
  );
});

DialogActions.displayName = 'DialogActions';

export default DialogActions;
