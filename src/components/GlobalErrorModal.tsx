import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useError } from '@/context/ErrorContext';
import { AlertCircle } from 'lucide-react';

export const GlobalErrorModal = () => {
    const { error, clearError } = useError();

    const isOpen = !!error;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && clearError()}>
            <DialogContent className="sm:max-w-md border-destructive/20 bg-card/95 backdrop-blur-xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-xl font-extrabold uppercase tracking-tight text-destructive">
                        <AlertCircle className="h-5 w-5" /> Security Protocol Breach
                    </DialogTitle>
                </DialogHeader>
                <div className="py-6">
                    <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-lg">
                        <p className="text-sm font-mono text-foreground/90 whitespace-pre-wrap leading-relaxed">
                            {error}
                        </p>
                    </div>
                    <p className="mt-4 text-[10px] text-destructive uppercase tracking-widest font-extrabold text-center opacity-60">
                        Operational interruption detected. System state preserved.
                    </p>
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button
                        onClick={clearError}
                        className="bg-destructive hover:bg-destructive/90 text-white font-bold px-8 shadow-lg shadow-destructive/20"
                    >
                        ACKNOWLEDGE & DISMISS
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
