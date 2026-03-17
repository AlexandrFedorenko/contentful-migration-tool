import {
  AlertCircle as ErrorIcon,
  AlertTriangle as WarningIcon,
  Info as InfoIcon
} from 'lucide-react';
import { LogError, FormattedError } from '@/components/JsonLogDisplay/types';

export const getSeverityIcon = (type: string): React.ReactElement => {
  const t = type.toLowerCase();
  if (t === 'error') return <ErrorIcon className="text-destructive h-5 w-5" />;
  if (t === 'warning') return <WarningIcon className="text-yellow-500 h-5 w-5" />;
  return <InfoIcon className="text-blue-500 h-5 w-5" />;
};

export const formatError = (error: LogError): FormattedError => {
  const msg = error.message;

  if (msg.includes('You need to omit a field before deleting it')) {
    return {
      title: 'Content Type Field Deletion Error',
      description: 'A field in a content type cannot be deleted directly. It needs to be made optional first.',
      steps: [
        '1. Go to Contentful Content Model',
        '2. Find the content type with the problematic field',
        '3. Make the field optional first',
        '4. Save the content type',
        '5. Then delete the field completely',
        '6. Try the restore operation again'
      ]
    };
  }

  if (msg.includes('Rate limit')) {
    return {
      title: 'Rate Limit Exceeded',
      description: 'Contentful API rate limit was exceeded. This is normal for large backups.',
      steps: [
        '1. Wait a few minutes - the system will retry automatically',
        '2. If the problem persists, try during off-peak hours',
        '3. For large backups, the process may take longer',
        '4. This is not a critical error - restoration will continue'
      ]
    };
  }

  return {
    title: 'Unknown Error',
    description: msg,
    steps: ['Please check the error details and try again']
  };
};

