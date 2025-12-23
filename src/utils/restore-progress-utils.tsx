import React from 'react';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Pending as PendingIcon
} from '@mui/icons-material';
import { CircularProgress } from '@mui/material';
import { RestoreStep } from '@/components/RestoreProgressModal/types';

export const getStepIcon = (status: RestoreStep['status']): React.ReactElement => {
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

export const getStepColor = (
  status: RestoreStep['status']
): 'success' | 'error' | 'warning' | 'primary' | 'default' => {
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

