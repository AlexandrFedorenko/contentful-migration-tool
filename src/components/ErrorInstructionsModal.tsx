import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  IconButton,
  Collapse
} from '@mui/material';
import {
  Close as CloseIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import { ErrorInstruction } from '@/utils/errorParser';

interface ErrorInstructionsModalProps {
  open: boolean;
  onClose: () => void;
  onMinimize: () => void;
  instruction: ErrorInstruction | null;
  errorMessage?: string;
}

export default function ErrorInstructionsModal({
  open,
  onClose,
  onMinimize,
  instruction,
  errorMessage
}: ErrorInstructionsModalProps) {
  const [expanded, setExpanded] = React.useState(true);

  if (!instruction) return null;

  const getSeverityIcon = () => {
    switch (instruction.severity) {
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

  const getSeverityColor = () => {
    switch (instruction.severity) {
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

  return (
    <Dialog
      open={open}
      onClose={onClose}
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
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {getSeverityIcon()}
          <Typography variant="h6" component="span">
            {instruction.title}
          </Typography>
          <Chip 
            label={instruction.severity.toUpperCase()} 
            color={getSeverityColor() as any}
            size="small"
            variant="outlined"
          />
        </Box>
        <Box>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            sx={{ mr: 1 }}
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
          <IconButton
            onClick={onMinimize}
            size="small"
            sx={{ mr: 1 }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Typography variant="body1" sx={{ mb: 2 }}>
          {instruction.description}
        </Typography>

        {errorMessage && (
          <Box sx={{ mb: 2, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>
              Error Details:
            </Typography>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', mt: 0.5 }}>
              {errorMessage}
            </Typography>
          </Box>
        )}

        <Collapse in={expanded}>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
              Steps to resolve:
            </Typography>
            <List dense>
              {instruction.steps.map((step, index) => (
                <ListItem key={index} sx={{ py: 0.5 }}>
                  <ListItemIcon sx={{ minWidth: 32 }}>
                    <CheckCircleIcon color="primary" fontSize="small" />
                  </ListItemIcon>
                  <ListItemText 
                    primary={step}
                    primaryTypographyProps={{ variant: 'body2' }}
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        </Collapse>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} variant="outlined">
          Got it
        </Button>
        <Button 
          onClick={onClose} 
          variant="contained" 
          color="primary"
        >
          Try Again
        </Button>
      </DialogActions>
    </Dialog>
  );
} 