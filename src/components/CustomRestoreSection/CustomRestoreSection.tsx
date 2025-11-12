import React from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import { GlobalState } from '@/context/GlobalContext';

interface CustomRestoreSectionProps {
  state: GlobalState;
  selectedFile: File | null;
  loadingCustomRestore: boolean;
  onFileSelect: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCustomRestore: () => void;
}

const CustomRestoreSection = React.memo(({
  state,
  selectedFile,
  loadingCustomRestore,
  onFileSelect,
  onCustomRestore
}: CustomRestoreSectionProps) => {
  return (
    <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#fafafa' }}>
      <Typography variant="subtitle2" gutterBottom>
        Custom Restore
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        ⚠️ This will completely replace the target environment with the selected file.
      </Typography>
      <Box sx={{ mb: 2 }}>
        <input
          accept=".json"
          style={{ display: 'none' }}
          id="file-input"
          type="file"
          onChange={onFileSelect}
          disabled={loadingCustomRestore}
        />
        <label htmlFor="file-input">
          <Button
            variant="outlined"
            component="span"
            fullWidth
            disabled={loadingCustomRestore}
            sx={{ mb: 1 }}
          >
            {selectedFile ? 'Change File' : 'Select Backup File'}
          </Button>
        </label>
        {selectedFile && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, textAlign: 'center' }}>
            Selected: <strong>{selectedFile.name}</strong>
          </Typography>
        )}
      </Box>
      <Button
        variant="contained"
        color="warning"
        fullWidth
        disabled={!selectedFile || !state.selectedTarget || loadingCustomRestore || state.selectedTarget === 'master'}
        onClick={onCustomRestore}
      >
        {loadingCustomRestore ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          'Replace Environment & Import'
        )}
      </Button>
    </Box>
  );
});

CustomRestoreSection.displayName = 'CustomRestoreSection';

export default CustomRestoreSection;

