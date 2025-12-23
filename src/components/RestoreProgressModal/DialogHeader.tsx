import React from 'react';
import { DialogTitle, Box, Typography, Chip } from '@mui/material';
import styles from './RestoreProgressModal.module.css';

interface DialogHeaderProps {
  completedSteps: number;
  totalSteps: number;
}

const DialogHeader = React.memo<DialogHeaderProps>(({ completedSteps, totalSteps }) => {
  return (
    <DialogTitle className={styles.dialogTitle}>
      <Box className={styles.titleContainer}>
        <Typography variant="h6">
          Restoring Backup
        </Typography>
        <Chip 
          label={`${completedSteps}/${totalSteps} completed`}
          color="primary"
          size="small"
        />
      </Box>
    </DialogTitle>
  );
});

DialogHeader.displayName = 'DialogHeader';

export default DialogHeader;

