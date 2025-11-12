import React from 'react';
import { DialogActions as MuiDialogActions, Button } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';
import styles from './RestoreProgressModal.module.css';

interface DialogActionsProps {
  onClose?: () => void;
}

const DialogActions = React.memo<DialogActionsProps>(({ onClose }) => {
  if (!onClose) return null;

  return (
    <MuiDialogActions className={styles.dialogActions}>
      <Button 
        onClick={onClose} 
        variant="contained"
        startIcon={<CloseIcon />}
      >
        Close
      </Button>
    </MuiDialogActions>
  );
});

DialogActions.displayName = 'DialogActions';

export default DialogActions;

