import React, { useEffect, useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box,
  Paper,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Warning as WarningIcon, 
  Error as ErrorIcon, 
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  OpenInNew as OpenInNewIcon
} from '@mui/icons-material';

interface JsonLogDisplayProps {
  open: boolean;
  onClose: () => void;
  onMinimize: () => void;
  errorMessage?: string;
  backupFileName?: string;
}

interface LogError {
  type: string;
  message: string;
  details?: any;
  timestamp?: string;
}

export default function JsonLogDisplay({ 
  open, 
  onClose, 
  onMinimize, 
  errorMessage,
  backupFileName
}: JsonLogDisplayProps) {
  const [logData, setLogData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleOpenLogFile = () => {
    if (backupFileName) {
      const url = `/log-viewer?fileName=${encodeURIComponent(backupFileName)}`;
      window.open(url, '_blank');
    }
  };

  useEffect(() => {
    if (open && errorMessage) {
      console.log('Processing error message in JsonLogDisplay:', errorMessage.substring(0, 200));
      
      // Ищем JSON лог в новом формате
      if (errorMessage.includes('JSON_LOG_CONTENT:')) {
        console.log('Found JSON log content in error message');
        try {
          const jsonStart = errorMessage.indexOf('JSON_LOG_CONTENT:') + 'JSON_LOG_CONTENT:'.length;
          const jsonContent = errorMessage.substring(jsonStart).trim();
          const parsedLog = JSON.parse(jsonContent);
          setLogData(parsedLog);
        } catch (parseError) {
          console.error('Error parsing JSON from error message:', parseError);
          setLogData(null);
        }
      } else {
        console.log('No JSON log content found in error message');
        setLogData(null);
      }
    } else {
      setLogData(null);
    }
  }, [open, errorMessage]);

  const getSeverityIcon = (type: string) => {
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

  const getSeverityColor = (type: string) => {
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

  const formatError = (error: LogError) => {
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

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        pb: 1
      }}>
        <ErrorIcon color="error" />
        <Typography variant="h6" component="span">
          Restore Operation Issues
        </Typography>
        <Chip 
          label="Error" 
          color="error"
          size="small"
          sx={{ ml: 'auto' }}
        />
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        {loading ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography>Loading log data...</Typography>
          </Box>
        ) : logData ? (
          <Box>
            <Typography variant="body1" sx={{ mb: 3 }}>
              The restore operation encountered some issues. Review the details below:
            </Typography>

            {logData.errors && logData.errors.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Errors Found ({logData.errors.length}):
                </Typography>
                <List>
                  {logData.errors.map((error: LogError, index: number) => {
                    const formattedError = formatError(error);
                    return (
                      <React.Fragment key={index}>
                        <ListItem sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', mb: 1 }}>
                            {getSeverityIcon(error.type)}
                            <Typography variant="subtitle1" sx={{ ml: 1, fontWeight: 'bold' }}>
                              {formattedError.title}
                            </Typography>
                            <Chip 
                              label={error.type} 
                              color={getSeverityColor(error.type) as any}
                              size="small"
                              sx={{ ml: 'auto' }}
                            />
                          </Box>
                          <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                            {formattedError.description}
                          </Typography>
                          <Box component="ol" sx={{ pl: 2, m: 0 }}>
                            {formattedError.steps.map((step: string, stepIndex: number) => (
                              <Typography 
                                key={stepIndex} 
                                component="li" 
                                variant="body2" 
                                sx={{ mb: 1 }}
                              >
                                {step}
                              </Typography>
                            ))}
                          </Box>
                        </ListItem>
                        {index < logData.errors.length - 1 && <Divider />}
                      </React.Fragment>
                    );
                  })}
                </List>
              </Box>
            )}

            {logData.warnings && logData.warnings.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>
                  Warnings ({logData.warnings.length}):
                </Typography>
                <List>
                  {logData.warnings.map((warning: LogError, index: number) => (
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
            )}

            {logData.importedEntities && (
              <Box sx={{ mt: 3, p: 2, bgcolor: 'success.50', borderRadius: 1 }}>
                <Typography variant="subtitle2" color="success.main" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Successfully Imported:
                </Typography>
                <Typography variant="body2">
                  {logData.importedEntities.contentTypes || 0} content types,{' '}
                  {logData.importedEntities.entries || 0} entries,{' '}
                  {logData.importedEntities.assets || 0} assets,{' '}
                  {logData.importedEntities.locales || 0} locales
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          <Box>
            <Typography variant="body1" sx={{ mb: 2 }}>
              No structured log data available. The restore operation may have completed successfully or encountered an issue that doesn't have detailed logging.
            </Typography>
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        {backupFileName && (
          <Button 
            onClick={handleOpenLogFile} 
            variant="outlined"
            startIcon={<OpenInNewIcon />}
            sx={{ mr: 'auto' }}
          >
            Open Error Log
          </Button>
        )}
        <Button 
          onClick={onMinimize} 
          variant="outlined"
          startIcon={<CloseIcon />}
        >
          Minimize
        </Button>
        <Button 
          onClick={onClose} 
          variant="contained"
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
} 