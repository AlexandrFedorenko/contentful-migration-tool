import React from 'react';
import { Button, Tooltip } from '@mui/material';
import {
  Error as ErrorIcon
} from '@mui/icons-material';

interface ErrorInstructionsButtonProps {
  instruction: any;
  onClick: () => void;
  disabled?: boolean;
}

export default function ErrorInstructionsButton({
  instruction,
  onClick,
  disabled = false
}: ErrorInstructionsButtonProps) {
  if (!instruction) return null;

  return (
    <Tooltip title="Click to view error details" arrow>
      <Button
        variant="outlined"
        color="error"
        startIcon={<ErrorIcon />}
        onClick={onClick}
        disabled={disabled}
        size="small"
        sx={{
          borderRadius: '20px',
          textTransform: 'none',
          fontWeight: 'medium',
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          }
        }}
      >
        Error Details
      </Button>
    </Tooltip>
  );
} 