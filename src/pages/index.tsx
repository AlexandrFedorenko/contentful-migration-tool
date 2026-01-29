import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Grid, Button, CircularProgress, Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Checkbox, Divider } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EnvironmentSelector from '@/components/EnvironmentSelector/EnvironmentSelector';
import BackupList from '@/components/BackupList/BackupList';
import { useGlobalContext } from '@/context/GlobalContext';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useBackups } from '@/hooks/useBackups';
import { useBackup } from '@/hooks/useBackup';
import { useMigration } from '@/hooks/useMigration';
import { useRestore } from '@/hooks/useRestore';
import { useCustomMigrate } from '@/hooks/useCustomMigrate';
import ContentfulBrowserAuth from '@/components/ContentfulBrowserAuth/ContentfulBrowserAuth';
import { useAuth } from '@/context/AuthContext';
import JsonLogDisplay from '@/components/JsonLogDisplay/JsonLogDisplay';
import AuthDialog from '@/components/AuthDialog/AuthDialog';
import SpaceSelectorSection from '@/components/SpaceSelectorSection/SpaceSelectorSection';
import CustomRestoreSection from '@/components/CustomRestoreSection/CustomRestoreSection';
import { ContentType } from '@/components/CustomMigrateSection/types';



import MigrationLogs from '@/components/MigrationLogs/MigrationLogs';
import MigrationPreviewDialog from '@/components/MigrationPreviewDialog/MigrationPreviewDialog';

export default function Home() {
  const { state, dispatch } = useGlobalContext();
  const { loadEnvironments } = useEnvironments();
  const { loadBackups } = useBackups();
  const { handleBackup } = useBackup();
  const { handleMigration } = useMigration();
  const { handleRestore } = useRestore();
  const { analyzeContentTypes, previewCustomMigrate, executeCustomMigrate } = useCustomMigrate();
  const { isLoggedIn, isLoading } = useAuth();

  const [showAuthDialog, setShowAuthDialog] = useState<boolean>(false);
  const [customRestoreMode, setCustomRestoreMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingCustomRestore, setLoadingCustomRestore] = useState(false);
  const [selectedBackupForRestore, setSelectedBackupForRestore] = useState<string | null>(null);


  const [previewData, setPreviewData] = useState<any>(null);
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);

  useEffect(() => {
    if (state.spaceId) {
      loadEnvironments(state.spaceId);
      loadBackups(state.spaceId);
    }
  }, [state.spaceId, loadEnvironments, loadBackups]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');

    if (token) {
      const saveTokenFromUrl = async () => {
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
            window.history.replaceState({}, document.title, '/');
            await fetch('/api/check-auth');
          }
        } catch {
        }
      };

      saveTokenFromUrl();
    }
  }, []);

  const handleCloseAuthDialog = () => {
    setShowAuthDialog(false);
  };

  const handleCustomRestoreModeChange = (checked: boolean) => {
    setCustomRestoreMode(checked);
    if (checked) {
      dispatch({ type: "SET_RESTORE_MODE", payload: false });
    }
  };

  const handleRestoreModeChange = (checked: boolean) => {
    if (!customRestoreMode) {
      dispatch({ type: "SET_RESTORE_MODE", payload: checked });
      setSelectedBackupForRestore(null);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setSelectedFile(file);
    } else {
      dispatch({ type: "SET_STATUS", payload: "Please select a valid JSON file" });
    }
  };

  const handleCustomRestore = async () => {
    if (!selectedFile || !state.selectedTarget || !state.spaceId) {
      dispatch({ type: "SET_STATUS", payload: "Please select a file and target environment" });
      return;
    }

    // Validate environment name
    if (state.selectedTarget === 'master') {
      dispatch({ type: "SET_STATUS", payload: "Cannot replace master environment for safety reasons" });
      return;
    }

    setLoadingCustomRestore(true);

    try {
      // Read file content
      const fileContent = await selectedFile.text();

      dispatch({ type: "SET_STATUS", payload: "Starting custom restore (this will replace the environment)..." });

      const response = await fetch('/api/custom-restore', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          spaceId: state.spaceId,
          targetEnvironment: state.selectedTarget,
          fileContent: fileContent,
          fileName: selectedFile.name
        }),
      });

      const data = await response.json();

      if (data.success) {
        dispatch({ type: "SET_STATUS", payload: `Custom restore completed successfully! Backup created: ${data.backupFile}` });
        await loadBackups(state.spaceId);
        setSelectedFile(null);
        setCustomRestoreMode(false);
      } else {
        throw new Error(data.error || 'Custom restore failed');
      }
    } catch (error) {
      dispatch({ type: "SET_STATUS", payload: `Custom restore failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoadingCustomRestore(false);
    }
  };

  return (
    <Container
      maxWidth="lg"
      sx={{
        mt: 4,
        mb: 4,
        minHeight: 'calc(100vh - 100px)',
        filter: showAuthDialog ? 'blur(5px)' : 'none',
        transition: 'filter 0.3s ease',
      }}
    >
      {!isLoggedIn ? (
        <ContentfulBrowserAuth />
      ) : (
        <>
          <Typography
            variant="h4"
            component="h1"
            gutterBottom
            sx={{ textAlign: 'center' }}
          >
            Contentful Migration Tool
          </Typography>
          <Box sx={{ mb: '60px' }}>
            <ContentfulBrowserAuth />
          </Box>
        </>
      )}

      {isLoggedIn && (
        <>


          <Grid container spacing={3} id="backup-section">
            <Grid item xs={12} md={6}>
              <SpaceSelectorSection
                state={state}
                onRestoreModeChange={handleRestoreModeChange}
                onCustomRestoreModeChange={handleCustomRestoreModeChange}
                onCustomMigrateModeChange={() => { }}
                customRestoreMode={customRestoreMode}
                customMigrateMode={false}
              />
            </Grid>

            {state.spaceId && (
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', border: (state.restoreMode || customRestoreMode) ? '2px solid #1976d2' : undefined }}>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Environments
                  </Typography>

                  <Divider sx={{ mb: 2 }} />

                  <EnvironmentSelector
                    environments={state.donorEnvironments}
                    value={state.selectedDonor || ''}
                    onChange={(env) => dispatch({ type: "SET_DATA", payload: { selectedDonor: env } })}
                    label="Source Environment"
                    disabled={!!state.restoreMode || customRestoreMode}
                  />

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mb: 4, mt: 2 }}
                    disabled={
                      !state.selectedDonor ||
                      state.loading.loadingBackup ||
                      state.loading.loadingMigration ||
                      state.restoreMode ||
                      state.restoreMode ||
                      customRestoreMode ||
                      loadingCustomRestore
                    }
                    onClick={handleBackup}
                  >
                    {state.loading.loadingBackup ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      'BACKUP SOURCE'
                    )}
                  </Button>

                  <EnvironmentSelector
                    environments={state.targetEnvironments}
                    value={state.selectedTarget || ''}
                    onChange={(env) => dispatch({ type: "SET_DATA", payload: { selectedTarget: env } })}
                    label="Target Environment"
                    disabled={!state.restoreMode && !customRestoreMode}
                  />

                  <Box sx={{ pt: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      fullWidth
                      disabled={
                        state.restoreMode
                          ? (!state.selectedTarget || !selectedBackupForRestore || state.loading.loadingMigration || state.restoreProgress.isActive)
                          : (
                            !state.selectedDonor ||
                            !state.selectedTarget ||
                            state.selectedDonor === state.selectedTarget ||
                            state.loading.loadingMigration ||
                            loadingCustomRestore ||
                            !customRestoreMode
                          )
                      }
                      onClick={state.restoreMode ? () => selectedBackupForRestore && handleRestore(selectedBackupForRestore) : undefined}
                    >
                      {state.loading.loadingMigration || (state.restoreMode && state.restoreProgress.isActive) ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        state.restoreMode ? 'RESTORE BACKUP' : 'SELECT MODE'
                      )}
                    </Button>
                  </Box>

                  {customRestoreMode && (
                    <CustomRestoreSection
                      state={state}
                      selectedFile={selectedFile}
                      loadingCustomRestore={loadingCustomRestore}
                      onFileSelect={handleFileSelect}
                      onCustomRestore={handleCustomRestore}
                    />
                  )}


                </Paper>
              </Grid>
            )}

            {state.spaceId && (
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Backups
                  </Typography>
                  <BackupList
                    selectedBackupForRestore={selectedBackupForRestore}
                    onBackupSelect={setSelectedBackupForRestore}
                  />
                </Paper>
              </Grid>
            )}
          </Grid>
        </>
      )}

      <AuthDialog
        open={showAuthDialog}
        onClose={handleCloseAuthDialog}
      />

      <JsonLogDisplay
        open={state.errorModalOpen}
        onClose={() => dispatch({ type: "TOGGLE_ERROR_MODAL", payload: false })}
        onMinimize={() => dispatch({ type: "TOGGLE_ERROR_MODAL", payload: false })}
        errorMessage={state.lastErrorMessage || undefined}
        backupFileName={state.errorBackupFile || undefined}
      />

      <MigrationLogs />



    </Container>
  );
}
