import React from 'react';
import { Button, Tooltip } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';
import styles from './ErrorInstructionsButton.module.css';

interface ErrorInstructionsButtonProps {
  instruction: unknown;
  onClick: () => void;
  disabled?: boolean;
}

const ErrorInstructionsButton = React.memo<ErrorInstructionsButtonProps>(({
  instruction,
  onClick,
  disabled = false
}) => {
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
        className={styles.button}
        sx={{
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
});

ErrorInstructionsButton.displayName = 'ErrorInstructionsButton';

export default ErrorInstructionsButton; 