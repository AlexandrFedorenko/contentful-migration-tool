import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, Button, TextField, Box, Typography } from '@mui/material';
import { useGlobalContext } from '@/context/GlobalContext';

interface AuthDialogProps {
  open: boolean;
  onClose: () => void;
}

const AuthDialog = React.memo(({ open, onClose }: AuthDialogProps) => {
  const { dispatch } = useGlobalContext();
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState('');

  const handleGetAuthUrl = async () => {
    try {
      const response = await fetch('/api/contentful-auth-browser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'getAuthUrl' }),
      });
      
      const data = await response.json();
      
      if (data.success && data.authUrl) {
        window.open(data.authUrl, '_blank');
        
        dispatch({ 
          type: "SET_STATUS", 
          payload: "Please login in the opened Contentful window. After login, copy the token and paste it in the input field." 
        });
        
        setShowTokenInput(true);
      }
    } catch {
      dispatch({ 
        type: "SET_STATUS", 
        payload: "Error getting auth URL. Please try again." 
      });
    }
  };

  const handleSaveToken = async () => {
    try {
      const response = await fetch('/api/contentful-auth-browser', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'saveToken', 
          token 
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        const authResponse = await fetch('/api/check-auth');
        const authData = await authResponse.json();
        
        if (authData.logged_in) {
          onClose();
          window.location.reload();
        }
      }
    } catch {
    }
  };

  return (
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
        }
      }}
    >
      <DialogTitle>Contentful Authentication</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          You need to log in to Contentful to use this tool.
        </Typography>
        <Box sx={{ my: 3 }}>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={handleGetAuthUrl}
            fullWidth
          >
            Login to Contentful
          </Button>
        </Box>
        
        {showTokenInput && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="body2" gutterBottom>
              After logging in, copy the token from the Contentful page and paste it here:
            </Typography>
            <TextField
              fullWidth
              label="Contentful Token"
              variant="outlined"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              sx={{ mb: 2 }}
            />
            <Button 
              variant="contained" 
              color="primary"
              disabled={!token.trim()}
              onClick={handleSaveToken}
            >
              Save Token
            </Button>
          </Box>
        )}
        
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onClose}>Close</Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
});

AuthDialog.displayName = 'AuthDialog';

export default AuthDialog;

