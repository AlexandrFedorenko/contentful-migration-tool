import React from 'react';
import { 
  Error as ErrorIcon, 
  Warning as WarningIcon, 
  Info as InfoIcon 
} from '@mui/icons-material';
import { LogError, FormattedError } from '@/components/JsonLogDisplay/types';

export const getSeverityIcon = (type: string): React.ReactElement => {
  switch (type.toLowerCase()) {
    case 'error':
      return <ErrorIcon color="error" />;
    case 'warning':
      return <WarningIcon color="warning" />;
    case 'info':
      return <InfoIcon color="info" />;
    default:
      return <InfoIcon />;
  }
};

export const getSeverityColor = (type: string): 'error' | 'warning' | 'info' | 'default' => {
  switch (type.toLowerCase()) {
    case 'error':
      return 'error';
    case 'warning':
      return 'warning';
    case 'info':
      return 'info';
    default:
      return 'default';
  }
};

export const formatError = (error: LogError): FormattedError => {
  if (error.message.includes('You need to omit a field before deleting it')) {
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
  
  if (error.message.includes('Rate limit')) {
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
    description: error.message,
    steps: ['Please check the error details and try again']
  };
};

