import React from 'react';
import { Dialog, DialogTitle, DialogContent, Box, Button } from '@mui/material';

interface BlurredModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

const BlurredModal: React.FC<BlurredModalProps> = ({ open, onClose, title, children }) => {
  return (
    <>
      {/* Дополнительный слой размытия для всей страницы */}
      {open && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1200,
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            pointerEvents: 'none',
          }}
        />
      )}
      
      <Dialog
        open={open}
        onClose={onClose}
        maxWidth="md"
        fullWidth
        BackdropProps={{
          style: {
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
          }
        }}
        PaperProps={{
          style: {
            boxShadow: '0 16px 70px rgba(0, 0, 0, 0.5)',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            position: 'relative',
            zIndex: 1300,
          }
        }}
      >
        <DialogTitle>{title}</DialogTitle>
        <DialogContent>
          {children}
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onClose}>Close</Button>
          </Box>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default BlurredModal; 