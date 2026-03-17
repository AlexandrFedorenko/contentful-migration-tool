import React, { useMemo } from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import DialogHeader from './DialogHeader';
import OverallProgress from './OverallProgress';
import CurrentStep from './CurrentStep';
import StepsList from './StepsList';
import TimeInfo from './TimeInfo';
import DialogActions from './DialogActions';
import { RestoreProgressModalProps } from './types';

const RestoreProgressModal = React.memo<RestoreProgressModalProps>(({
  open,
  steps,
  currentStep,
  overallProgress,
  onClose
}) => {
  const completedSteps = useMemo(
    () => steps.filter(step => step.status === 'completed').length,
    [steps]
  );
  const totalSteps = steps.length;
  const isCompleted = overallProgress === 100;
  const hasErrors = useMemo(
    () => steps.some(step => step.status === 'error'),
    [steps]
  );
  const currentStepData = currentStep < steps.length ? steps[currentStep] : undefined;

  return (
    <Dialog open={open} onOpenChange={(val) => !val && isCompleted && onClose && onClose()}>
      <DialogContent className="sm:max-w-xl md:max-w-2xl border-primary/20 bg-card/95 backdrop-blur-xl p-0 overflow-hidden">
        <div className="flex flex-col h-full max-h-[85vh]">
          <DialogHeader
            completedSteps={completedSteps}
            totalSteps={totalSteps}
          />

          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            <OverallProgress overallProgress={overallProgress} />

            {currentStepData && (
              <CurrentStep step={currentStepData} />
            )}

            <StepsList steps={steps} />

            <TimeInfo isCompleted={isCompleted} hasErrors={hasErrors} />
          </div>

          {(isCompleted || hasErrors) && (
            <div className="p-4 bg-muted/40 border-t border-border/50">
              <DialogActions onClose={onClose} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
});

RestoreProgressModal.displayName = 'RestoreProgressModal';

export default RestoreProgressModal;
export type { RestoreProgressModalProps } from './types';
export type { RestoreStep } from './types';
