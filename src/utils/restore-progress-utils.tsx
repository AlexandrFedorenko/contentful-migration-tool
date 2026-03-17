import React from 'react';
import {
  CheckCircle2 as CheckCircleIcon,
  AlertCircle as ErrorIcon,
  AlertTriangle as WarningIcon,
  Clock as PendingIcon,
  Loader2
} from 'lucide-react';

import { RestoreStep } from '@/components/RestoreProgressModal/types';

export const getStepIcon = (status: RestoreStep['status']): React.ReactElement => {
  switch (status) {
    case 'completed':
      return <CheckCircleIcon className="h-5 w-5" />;
    case 'error':
      return <ErrorIcon className="h-5 w-5" />;
    case 'warning':
      return <WarningIcon className="h-5 w-5" />;
    case 'in-progress':
      return <Loader2 className="h-5 w-5 animate-spin" />;
    case 'pending':
    default:
      return <PendingIcon className="h-5 w-5" />;
  }
};

export const getStepStyles = (status: RestoreStep['status']) => {
  switch (status) {
    case 'completed':
      return {
        icon: "bg-emerald-500/10 text-emerald-400",
        text: "text-foreground",
        container: ""
      };
    case 'error':
      return {
        icon: "bg-destructive/10 text-destructive",
        text: "text-destructive",
        container: ""
      };
    case 'warning':
      return {
        icon: "bg-yellow-500/10 text-yellow-500",
        text: "text-yellow-500",
        container: ""
      };
    case 'in-progress':
      return {
        icon: "bg-primary/10 text-primary",
        text: "text-primary",
        container: "bg-muted/30 border-primary/20 shadow-inner"
      };
    case 'pending':
    default:
      return {
        icon: "bg-muted/20 text-muted-foreground",
        text: "text-muted-foreground",
        container: "opacity-40 grayscale"
      };
  }
};

