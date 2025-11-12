import React from 'react';
import { Box, Typography } from '@mui/material';
import styles from './RestoreProgressModal.module.css';

interface TimeInfoProps {
  isCompleted: boolean;
  hasErrors: boolean;
}

const TimeInfo = React.memo<TimeInfoProps>(({ isCompleted, hasErrors }) => {
  const getMessage = () => {
    if (isCompleted) {
      return hasErrors 
        ? '⚠️ Restore completed with some issues. Check the details above.'
        : '✅ Restore completed successfully!';
    }
    return '⏱️ This process may take several minutes depending on the size of your backup. Please don\'t close this window or refresh the page.';
  };

  return (
    <Box className={styles.timeInfoBox}>
      <Typography variant="caption" color="text.secondary">
        {getMessage()}
      </Typography>
    </Box>
  );
});

TimeInfo.displayName = 'TimeInfo';

export default TimeInfo;

