import React from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Typography, 
  Box, 
  Link,
  Chip,
  Divider
} from '@mui/material';
import { 
  Close as CloseIcon, 
  Warning as WarningIcon, 
  Error as ErrorIcon, 
  Info as InfoIcon,
  Launch as LaunchIcon
} from '@mui/icons-material';
import { ErrorInstruction } from '@/utils/errorParser';

interface SimpleErrorDisplayProps {
  open: boolean;
  onClose: () => void;
  onMinimize: () => void;
  instruction: ErrorInstruction | null;
  errorMessage?: string;
}

export default function SimpleErrorDisplay({ 
  open, 
  onClose, 
  onMinimize, 
  instruction, 
  errorMessage 
}: SimpleErrorDisplayProps) {
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

  const getContentfulLink = () => {
    // Извлекаем space ID из errorMessage или используем placeholder
    const spaceIdMatch = errorMessage?.match(/space[:\s]+([a-zA-Z0-9]+)/i);
    const spaceId = spaceIdMatch ? spaceIdMatch[1] : '[YOUR_SPACE_ID]';
    
    // Если в заголовке есть название content type, добавляем его в ссылку
    const contentTypeMatch = instruction.title.match(/Content Type:\s*([^(]+)/);
    if (contentTypeMatch) {
      const contentTypeName = contentTypeMatch[1].trim();
      return `https://app.contentful.com/spaces/${spaceId}/content_types/${contentTypeName}`;
    }
    
    return `https://app.contentful.com/spaces/${spaceId}/content_types`;
  };

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        gap: 1,
        pb: 1
      }}>
        {getSeverityIcon()}
        <Typography variant="h6" component="span">
          {instruction.title}
        </Typography>
        <Chip 
          label={instruction.severity === 'error' ? 'Ошибка' : 
                 instruction.severity === 'warning' ? 'Предупреждение' : 'Информация'} 
          color={getSeverityColor() as any}
          size="small"
          sx={{ ml: 'auto' }}
        />
      </DialogTitle>

      <DialogContent sx={{ pt: 0 }}>
        <Box sx={{ mb: 3 }}>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {instruction.description}
          </Typography>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
            <LaunchIcon fontSize="small" />
            Где исправить:
          </Typography>
          <Link 
            href={getContentfulLink()} 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: 0.5,
              textDecoration: 'none',
              '&:hover': { textDecoration: 'underline' }
            }}
          >
            {instruction.title.includes('Content Type:') 
              ? `Открыть ${instruction.title.split(':')[1].trim()} в Contentful`
              : 'Открыть Contentful Content Model'
            }
            <LaunchIcon fontSize="small" />
          </Link>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 1 }}>
            Как исправить:
          </Typography>
          <Box component="ol" sx={{ pl: 2, m: 0 }}>
            {instruction.steps.map((step, index) => (
              <Typography 
                key={index} 
                component="li" 
                variant="body2" 
                sx={{ mb: 1 }}
              >
                {step}
              </Typography>
            ))}
          </Box>
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button 
          onClick={onMinimize} 
          variant="outlined"
          startIcon={<CloseIcon />}
        >
          Свернуть
        </Button>
        <Button 
          onClick={onClose} 
          variant="contained"
        >
          Понятно
        </Button>
      </DialogActions>
    </Dialog>
  );
} 