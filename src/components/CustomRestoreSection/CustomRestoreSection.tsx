import React, { useState, useEffect } from 'react';
import { Box, Typography, Button, CircularProgress, Paper } from '@mui/material';
import { useRouter } from 'next/router';
import { GlobalState } from '@/context/GlobalContext';
import VisibilityIcon from '@mui/icons-material/Visibility';

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
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Prepare file for preview using IndexedDB
  useEffect(() => {
    if (!selectedFile || !state.spaceId) {
      setUploadedFileName(null);
      return;
    }

    const preparePreview = async () => {
      setIsUploading(true);

      try {
        const fileContent = await selectedFile.text();
        const tempFileName = `temp-preview-${Date.now()}-${selectedFile.name}`;

        // Store in IndexedDB for preview page to access (handles large files)
        const storageKey = `temp-backup-${state.spaceId}-${tempFileName}`;
        const { saveTempBackup } = await import('@/utils/largeFileStorage');
        await saveTempBackup(storageKey, fileContent);

        setUploadedFileName(tempFileName);
      } catch (error) {
        console.error('Failed to prepare file for preview:', error);
      } finally {
        setIsUploading(false);
      }
    };

    preparePreview();
  }, [selectedFile, state.spaceId]);

  const router = useRouter();

  const handlePreviewClick = () => {
    if (uploadedFileName && state.spaceId && state.selectedTarget) {
      router.push(`/backup-preview/${uploadedFileName}?spaceId=${state.spaceId}&targetEnv=${state.selectedTarget}`);
    }
  };



  return (
    <Paper sx={{ mt: 3, p: 2 }}>
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
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2, textAlign: 'center' }}>
              Selected: <strong>{selectedFile.name}</strong>
            </Typography>

            {isUploading && (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', mb: 2 }}>
                <CircularProgress size={16} />
                <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                  Preparing preview...
                </Typography>
              </Box>
            )}

            {uploadedFileName && !isUploading && (
              <Button
                variant="outlined"
                size="medium"
                fullWidth
                startIcon={<VisibilityIcon />}
                onClick={handlePreviewClick}
                disabled={!state.selectedTarget}
                sx={{ mb: 2 }}
              >
                {state.selectedTarget ? 'Preview & Select Content' : 'Select Target Environment to Preview'}
              </Button>
            )}
          </Box>
        )}
      </Box>

      <Button
        variant="contained"
        color="warning"
        fullWidth
        disabled={!selectedFile || !state.selectedTarget || loadingCustomRestore}
        onClick={onCustomRestore}
      >
        {loadingCustomRestore ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          'Replace Environment & Import'
        )}
      </Button>
    </Paper>
  );
});

CustomRestoreSection.displayName = 'CustomRestoreSection';

export default CustomRestoreSection;
