import React from 'react';
import { DialogActions as MuiDialogActions, Button } from '@mui/material';
import { Close as CloseIcon, OpenInNew as OpenInNewIcon } from '@mui/icons-material';
import styles from './JsonLogDisplay.module.css';

interface DialogActionsProps {
  onClose: () => void;
  onMinimize: () => void;
  backupFileName?: string;
}

const DialogActions = React.memo<DialogActionsProps>(({ onClose, onMinimize, backupFileName }) => {
  const handleOpenLogFile = React.useCallback(() => {
    if (backupFileName) {
      const url = `/log-viewer?fileName=${encodeURIComponent(backupFileName)}`;
      window.open(url, '_blank');
    }
  }, [backupFileName]);

  return (
    <MuiDialogActions className={styles.dialogActions}>
      {backupFileName && (
        <Button 
          onClick={handleOpenLogFile} 
          variant="outlined"
          startIcon={<OpenInNewIcon />}
          className={styles.openLogButton}
        >
          Open Error Log
        </Button>
      )}
      <Button 
        onClick={onMinimize} 
        variant="outlined"
        startIcon={<CloseIcon />}
      >
        Minimize
      </Button>
      <Button 
        onClick={onClose} 
        variant="contained"
      >
        Got it
      </Button>
    </MuiDialogActions>
  );
});

DialogActions.displayName = 'DialogActions';

export default DialogActions;

