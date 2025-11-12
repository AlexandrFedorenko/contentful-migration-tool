export interface RestoreStep {
  name: string;
  status: 'pending' | 'in-progress' | 'completed' | 'error' | 'warning';
  message?: string;
  duration?: string;
}

export interface RestoreProgressModalProps {
  open: boolean;
  steps: RestoreStep[];
  currentStep: number;
  overallProgress: number;
  onClose?: () => void;
}

