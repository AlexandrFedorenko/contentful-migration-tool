import React from 'react';
import { Box, Typography } from '@mui/material';
import styles from './JsonLogDisplay.module.css';

interface SuccessSummaryProps {
  importedEntities: {
    contentTypes?: number;
    entries?: number;
    assets?: number;
    locales?: number;
  };
}

const SuccessSummary = React.memo<SuccessSummaryProps>(({ importedEntities }) => {
  return (
    <Box className={styles.successBox}>
      <Typography variant="subtitle2" color="success.main" className={styles.successTitle}>
        Successfully Imported:
      </Typography>
      <Typography variant="body2">
        {importedEntities.contentTypes || 0} content types,{' '}
        {importedEntities.entries || 0} entries,{' '}
        {importedEntities.assets || 0} assets,{' '}
        {importedEntities.locales || 0} locales
      </Typography>
    </Box>
  );
});

SuccessSummary.displayName = 'SuccessSummary';

export default SuccessSummary;

