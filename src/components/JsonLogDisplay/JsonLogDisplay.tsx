import React from 'react';
import { Dialog, DialogContent, Typography, Box } from '@mui/material';
import DialogHeader from './DialogHeader';
import ErrorList from './ErrorList';
import WarningList from './WarningList';
import SuccessSummary from './SuccessSummary';
import DialogActions from './DialogActions';
import { useLogData } from '@/hooks/useLogData';
import styles from './JsonLogDisplay.module.css';

interface JsonLogDisplayProps {
  open: boolean;
  onClose: () => void;
  onMinimize: () => void;
  errorMessage?: string;
  backupFileName?: string;
}

const JsonLogDisplay = React.memo<JsonLogDisplayProps>(({
  open,
  onClose,
  onMinimize,
  errorMessage,
  backupFileName
}) => {
  const { logData, loading } = useLogData(open, errorMessage);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogHeader />

      <DialogContent className={styles.dialogContent}>
        {loading ? (
          <Box className={styles.loadingBox}>
            <Typography>Loading log data...</Typography>
          </Box>
        ) : logData ? (
          <Box>
            <Typography variant="body1" className={styles.introText}>
              The restore operation encountered some issues. Review the details below:
            </Typography>

            {logData.errors && logData.errors.length > 0 && (
              <ErrorList errors={logData.errors} />
            )}

            {logData.warnings && logData.warnings.length > 0 && (
              <WarningList warnings={logData.warnings} />
            )}

            {logData.importedEntities && (
              <SuccessSummary importedEntities={logData.importedEntities} />
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" className={styles.emptyState}>
              No structured log data available. The restore operation may have completed successfully or encountered an issue that doesn&apos;t have detailed logging.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions
        onClose={onClose}
        onMinimize={onMinimize}
        backupFileName={backupFileName}
      />
    </Dialog>
  );
});

JsonLogDisplay.displayName = 'JsonLogDisplay';

export default JsonLogDisplay; 