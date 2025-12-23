import React from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Button } from '@mui/material';
import styles from './BlurredModal.module.css';

interface BlurredModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BlurredModal = React.memo<BlurredModalProps>(({ open, onClose, title, children }) => {
  return (
    <>
      {open && (
        <Box className={styles.backdrop} />
      )}
      
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        BackdropProps={{
          className: styles.dialogBackdrop
        }}
        PaperProps={{
          className: styles.dialogPaper
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          {children}
          <Box className={styles.buttonContainer}>
            <Button onClick={onClose}>Close</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
});

BlurredModal.displayName = 'BlurredModal';

export default BlurredModal; 