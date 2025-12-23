import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';
import { LogError } from './types';
import styles from './JsonLogDisplay.module.css';

interface WarningListProps {
  warnings: LogError[];
}

const WarningList = React.memo<WarningListProps>(({ warnings }) => {
  if (!warnings || warnings.length === 0) return null;

  return (
    <Box>
      <Typography variant="h6" className={styles.sectionTitle}>
        Warnings ({warnings.length}):
      </Typography>
      <List>
        {warnings.map((warning, index) => (
          <ListItem key={index}>
            <ListItemIcon>
              <WarningIcon color="warning" />
            </ListItemIcon>
            <ListItemText 
              primary={warning.message}
              secondary={warning.timestamp}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
});

WarningList.displayName = 'WarningList';

export default WarningList;

