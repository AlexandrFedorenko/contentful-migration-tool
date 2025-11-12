import React from 'react';
import { Box, Typography } from '@mui/material';
import { RestoreStep } from './types';
import styles from './RestoreProgressModal.module.css';

interface CurrentStepProps {
  step: RestoreStep | undefined;
}

const CurrentStep = React.memo<CurrentStepProps>(({ step }) => {
  if (!step) return null;

  return (
    <Box className={styles.currentStepBox}>
      <Typography variant="subtitle2" color="primary" className={styles.currentStepTitle}>
        Current Step: {step.name}
      </Typography>
      {step.message && (
        <Typography variant="body2" color="text.secondary">
          {step.message}
        </Typography>
      )}
    </Box>
  );
});

CurrentStep.displayName = 'CurrentStep';

export default CurrentStep;

