import React from 'react';
import { Box, Typography, List, ListItem, Chip, Divider } from '@mui/material';
import { LogError } from './types';
import { getSeverityIcon, getSeverityColor, formatError } from '@/utils/log-display-utils';
import styles from './JsonLogDisplay.module.css';

interface ErrorListProps {
  errors: LogError[];
}

const ErrorList = React.memo<ErrorListProps>(({ errors }) => {
  if (!errors || errors.length === 0) return null;

  return (
    <Box className={styles.errorSection}>
      <Typography variant="h6" className={styles.sectionTitle}>
        Errors Found ({errors.length}):
      </Typography>
      <List>
        {errors.map((error, index) => {
          const formattedError = formatError(error);
          return (
            <React.Fragment key={index}>
              <ListItem className={styles.errorItem}>
                <Box className={styles.errorHeader}>
                  {getSeverityIcon(error.type)}
                  <Typography variant="subtitle1" className={styles.errorTitle}>
                    {formattedError.title}
                  </Typography>
                  <Chip 
                    label={error.type} 
                    color={getSeverityColor(error.type)}
                    size="small"
                    className={styles.typeChip}
                  />
                </Box>
                <Typography variant="body2" className={styles.errorDescription}>
                  {formattedError.description}
                </Typography>
                <Box component="ol" className={styles.stepsList}>
                  {formattedError.steps.map((step, stepIndex) => (
                    <Typography 
                      key={stepIndex} 
                      component="li" 
                      variant="body2" 
                      className={styles.stepItem}
                    >
                      {step}
                    </Typography>
                  ))}
                </Box>
              </ListItem>
              {index < errors.length - 1 && <Divider />}
            </React.Fragment>
          );
        })}
      </List>
    </Box>
  );
});

ErrorList.displayName = 'ErrorList';

export default ErrorList;

