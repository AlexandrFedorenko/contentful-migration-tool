import React from 'react';
import { Button } from "@/components/ui/button";
import { X as CloseIcon } from 'lucide-react';

interface DialogActionsProps {
  onClose?: () => void;
}

const DialogActions = React.memo<DialogActionsProps>(({ onClose }) => {
  if (!onClose) return null;

  return (
    <div className="flex justify-end gap-3">
      <Button
        onClick={onClose}
        className="bg-primary hover:bg-primary/90 text-white font-bold px-10 shadow-lg shadow-primary/20 uppercase tracking-widest text-[10px]"
      >
        <CloseIcon className="h-3 w-3 mr-2" />
        Terminate Modal
      </Button>
    </div>
  );
});

DialogActions.displayName = 'DialogActions';

export default DialogActions;
