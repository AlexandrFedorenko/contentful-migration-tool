import React from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import DialogHeader from './DialogHeader';
import ErrorList from './ErrorList';
import WarningList from './WarningList';
import SuccessSummary from './SuccessSummary';
import DialogActions from './DialogActions';
import { useLogData } from '@/hooks/useLogData';
import { Loader2 } from "lucide-react";

interface JsonLogDisplayProps {
  open: boolean;
  onClose: () => void;
  onMinimize: () => void;
  errorMessage?: string;
  backupFileName?: string;
}

const JsonLogDisplay = React.memo<JsonLogDisplayProps>(({
  open,
  onClose,
  onMinimize,
  errorMessage,
  backupFileName
}) => {
  const { logData, loading } = useLogData(open, errorMessage);

  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-xl md:max-w-3xl border-primary/20 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-[85vh]">
          <DialogHeader />

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 animate-in fade-in duration-500">
                <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
                <p className="text-[10px] font-extrabold uppercase tracking-widest text-muted-foreground">Decoding Log Manifest...</p>
              </div>
            ) : logData ? (
              <div className="space-y-6">
                <div className="p-4 bg-muted/30 border border-border/50 rounded-xl">
                  <p className="text-sm text-foreground/80 leading-relaxed font-medium">
                    The restore operation encountered some issues. Review the details below:
                  </p>
                </div>

                {logData.errors && logData.errors.length > 0 && (
                  <ErrorList errors={logData.errors} />
                )}

                {logData.warnings && logData.warnings.length > 0 && (
                  <WarningList warnings={logData.warnings} />
                )}

                {logData.importedEntities && (
                  <SuccessSummary importedEntities={logData.importedEntities} />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/50">
                <p className="text-sm font-medium italic">
                  No structured log data available. The restore operation may have completed successfully or encountered an issue that doesn&apos;t have detailed logging.
                </p>
              </div>
            )}
          </div>

          <DialogActions
            onClose={onClose}
            onMinimize={onMinimize}
            backupFileName={backupFileName}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
});

JsonLogDisplay.displayName = 'JsonLogDisplay';

export default JsonLogDisplay;
