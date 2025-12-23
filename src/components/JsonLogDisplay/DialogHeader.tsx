import React from 'react';
import { DialogTitle, Typography, Chip } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';
import styles from './JsonLogDisplay.module.css';

const DialogHeader = React.memo(() => {
  return (
    <DialogTitle className={styles.dialogTitle}>
      <ErrorIcon color="error" />
      <Typography variant="h6" component="span">
        Restore Operation Issues
      </Typography>
      <Chip 
        label="Error" 
        color="error"
        size="small"
        className={styles.errorChip}
      />
    </DialogTitle>
  );
});

DialogHeader.displayName = 'DialogHeader';

export default DialogHeader;

