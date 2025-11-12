import React from 'react';
import { Typography, List, ListItem, ListItemIcon, ListItemText, Box, Chip } from '@mui/material';
import { RestoreStep } from './types';
import { getStepIcon, getStepColor } from '@/utils/restore-progress-utils';
import styles from './RestoreProgressModal.module.css';

interface StepsListProps {
  steps: RestoreStep[];
}

const StepsList = React.memo<StepsListProps>(({ steps }) => {
  return (
    <>
      <Typography variant="subtitle2" className={styles.stepsTitle}>
        Restore Steps:
      </Typography>
      <List dense>
        {steps.map((step, index) => (
          <ListItem 
            key={index} 
            className={styles.stepItem}
            style={{ opacity: step.status === 'pending' ? 0.6 : 1 }}
          >
            <ListItemIcon className={styles.stepIcon}>
              {getStepIcon(step.status)}
            </ListItemIcon>
            <ListItemText 
              primary={
                <Box className={styles.stepPrimary}>
                  <Typography variant="body2">
                    {step.name}
                  </Typography>
                  {step.duration && (
                    <Chip 
                      label={step.duration}
                      size="small"
                      variant="outlined"
                      color={getStepColor(step.status)}
                    />
                  )}
                </Box>
              }
              secondary={step.message}
              secondaryTypographyProps={{ variant: 'caption' }}
            />
          </ListItem>
        ))}
      </List>
    </>
  );
});

StepsList.displayName = 'StepsList';

export default StepsList;

