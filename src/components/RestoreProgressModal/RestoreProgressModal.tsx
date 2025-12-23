import React, { useMemo } from 'react';
import { Dialog, DialogContent } from '@mui/material';
import DialogHeader from './DialogHeader';
import OverallProgress from './OverallProgress';
import CurrentStep from './CurrentStep';
import StepsList from './StepsList';
import TimeInfo from './TimeInfo';
import DialogActions from './DialogActions';
import { RestoreProgressModalProps } from './types';
import styles from './RestoreProgressModal.module.css';

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
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      PaperProps={{
        className: styles.dialogPaper
      }}
    >
      <DialogHeader 
        completedSteps={completedSteps}
        totalSteps={totalSteps}
      />

      <DialogContent className={styles.dialogContent}>
        <OverallProgress overallProgress={overallProgress} />

        {currentStepData && (
          <CurrentStep step={currentStepData} />
        )}

        <StepsList steps={steps} />

        <TimeInfo isCompleted={isCompleted} hasErrors={hasErrors} />
      </DialogContent>

      {(isCompleted || hasErrors) && (
        <DialogActions onClose={onClose} />
      )}
    </Dialog>
  );
});

RestoreProgressModal.displayName = 'RestoreProgressModal';

export default RestoreProgressModal;
export type { RestoreProgressModalProps } from './types';
export type { RestoreStep } from './types'; 