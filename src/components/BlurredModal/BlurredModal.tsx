import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface BlurredModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BlurredModal = React.memo<BlurredModalProps>(({ open, onClose, title, children }) => {
  return (
    <Dialog open={open} onOpenChange={(val) => !val && onClose()}>
      <DialogContent className="sm:max-w-3xl border-border/50 bg-background/80 backdrop-blur-3xl shadow-2xl p-0 overflow-hidden rounded-2xl">
        <DialogHeader className="p-6 bg-muted/20 border-b border-border/50">
          <DialogTitle className="text-xl font-extrabold uppercase tracking-tight">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {children}
        </div>

        <DialogFooter className="p-4 bg-muted/20 border-t border-border/50 sm:justify-end">
          <Button
            variant="ghost"
            onClick={onClose}
            className="text-xs font-bold uppercase tracking-widest px-8"
          >
            Close interface
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});

BlurredModal.displayName = 'BlurredModal';

export default BlurredModal;