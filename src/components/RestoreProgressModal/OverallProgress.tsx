import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import styles from './RestoreProgressModal.module.css';

interface OverallProgressProps {
  overallProgress: number;
}

const OverallProgress = React.memo<OverallProgressProps>(({ overallProgress }) => {
  return (
    <Box className={styles.progressSection}>
      <Box className={styles.progressHeader}>
        <Typography variant="body2" color="text.secondary">
          Overall Progress
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {Math.round(overallProgress)}%
        </Typography>
      </Box>
      <LinearProgress 
        variant="determinate" 
        value={overallProgress} 
        className={styles.progressBar}
      />
    </Box>
  );
});

OverallProgress.displayName = 'OverallProgress';

export default OverallProgress;

