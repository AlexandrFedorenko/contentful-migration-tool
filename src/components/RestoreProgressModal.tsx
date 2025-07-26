import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  CircularProgress,
  Button
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Pending as PendingIcon,
  Close as CloseIcon
} from '@mui/icons-material';

export interface RestoreStep {
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error' | 'warning';
  message?: string;
  duration?: string;
}

interface RestoreProgressModalProps {
  open: boolean;
  steps: RestoreStep[];
  currentStep: number;
  overallProgress: number;
  onClose?: () => void;
}

export default function RestoreProgressModal({
  open,
  steps,
  currentStep,
  overallProgress,
  onClose
}: RestoreProgressModalProps) {
  const getStepIcon = (status: RestoreStep['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircleIcon color="success" />;
      case 'error':
        return <ErrorIcon color="error" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'in-progress':
        return <CircularProgress size={20} />;
      case 'pending':
      default:
        return <PendingIcon color="disabled" />;
    }
  };

  const getStepColor = (status: RestoreStep['status']) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'error':
        return 'error';
      case 'warning':
        return 'warning';
      case 'in-progress':
        return 'primary';
      case 'pending':
      default:
        return 'default';
    }
  };

  const completedSteps = steps.filter(step => step.status === 'completed').length;
  const totalSteps = steps.length;
  const isCompleted = overallProgress === 100;
  const hasErrors = steps.some(step => step.status === 'error');

  return (
    <Dialog
      open={open}
      maxWidth="md"
      fullWidth
      PaperProps={{
        style: {
          borderRadius: '12px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        pb: 1
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="h6">
            Restoring Backup
          </Typography>
          <Chip 
            label={`${completedSteps}/${totalSteps} completed`}
            color="primary"
            size="small"
          />
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {/* Общий прогресс */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
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
            sx={{ height: 8, borderRadius: 4 }}
          />
        </Box>

        {/* Текущий шаг */}
        {currentStep < steps.length && (
          <Box sx={{ mb: 3, p: 2, bgcolor: 'primary.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" color="primary" sx={{ fontWeight: 'bold', mb: 1 }}>
              Current Step: {steps[currentStep]?.name}
            </Typography>
            {steps[currentStep]?.message && (
              <Typography variant="body2" color="text.secondary">
                {steps[currentStep].message}
              </Typography>
            )}
          </Box>
        )}

        {/* Список шагов */}
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
          Restore Steps:
        </Typography>
        <List dense>
          {steps.map((step, index) => (
            <ListItem 
              key={index} 
              sx={{ 
                py: 0.5,
                opacity: step.status === 'pending' ? 0.6 : 1
              }}
            >
              <ListItemIcon sx={{ minWidth: 32 }}>
                {getStepIcon(step.status)}
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">
                      {step.name}
                    </Typography>
                    {step.duration && (
                      <Chip 
                        label={step.duration}
                        size="small"
                        variant="outlined"
                        color={getStepColor(step.status) as any}
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

        {/* Информация о времени */}
        <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
          <Typography variant="caption" color="text.secondary">
            {isCompleted ? (
              hasErrors ? 
                '⚠️ Restore completed with some issues. Check the details above.' :
                '✅ Restore completed successfully!'
            ) : (
              '⏱️ This process may take several minutes depending on the size of your backup. Please don\'t close this window or refresh the page.'
            )}
          </Typography>
        </Box>
      </DialogContent>

      {/* Кнопки действий */}
      {(isCompleted || hasErrors) && onClose && (
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={onClose} 
            variant="contained"
            startIcon={<CloseIcon />}
          >
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
} 