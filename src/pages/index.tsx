import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Grid, Button, Dialog, DialogTitle, DialogContent, TextField, CircularProgress, Checkbox, FormControlLabel, Input, InputLabel, FormControl } from '@mui/material';
import SpaceSelector from '@/components/SpaceSelector';
import EnvironmentSelector from '@/components/EnvironmentSelector';
import BackupList from '@/components/BackupList';
import { useGlobalContext } from '@/context/GlobalContext';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useBackups } from '@/hooks/useBackups';
import { useBackup } from '@/hooks/useBackup';
import { useMigration } from '@/hooks/useMigration';
import { useCustomMigrate } from '@/hooks/useCustomMigrate';
import ContentfulBrowserAuth from '@/components/ContentfulBrowserAuth';
import { useAuth } from '@/context/AuthContext';
import BlurredModal from '@/components/BlurredModal';
import JsonLogDisplay from '@/components/JsonLogDisplay';


export default function Home() {
  const { state, dispatch } = useGlobalContext();
  const { loadEnvironments } = useEnvironments();
  const { loadBackups } = useBackups();
  const { handleBackup } = useBackup();
  const { handleMigration } = useMigration();
  const { analyzeContentTypes, customMigrate } = useCustomMigrate();
  const { isLoggedIn, isLoading } = useAuth();

  const [showAuthDialog, setShowAuthDialog] = useState<boolean>(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState('');
  const [customRestoreMode, setCustomRestoreMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingCustomRestore, setLoadingCustomRestore] = useState(false);
  const [customMigrateMode, setCustomMigrateMode] = useState(false);
  const [contentTypes, setContentTypes] = useState<Array<{
    id: string;
    name: string;
    isNew: boolean;
    isModified: boolean;
    hasNewContent?: boolean;
    newContentCount?: number;
  }>>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);

  useEffect(() => {
    if (state.spaceId) {
      loadEnvironments(state.spaceId);
      loadBackups(state.spaceId);
    }
  }, [state.spaceId, loadEnvironments, loadBackups]);

  useEffect(() => {
    // Показывать алерт только если есть текст
    // setShowAlert(!!state.statusMessage); // This line is removed
  }, [state.statusMessage]);

  useEffect(() => {
    // Проверяем, есть ли токен в URL
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    
    if (token) {
      // Если есть токен, сохраняем его
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
            // Очищаем URL от токена
            window.history.replaceState({}, document.title, '/');
            // Обновляем статус авторизации
            const authResponse = await fetch('/api/check-auth');
            const authData = await authResponse.json();
            // dispatch({ type: "SET_DATA", payload: { authStatus: authData } });
          }
        } catch (error) {
          console.error('Error saving token from URL:', error);
        }
      };
      
      saveTokenFromUrl();
    }
  }, []);

  // const handleCloseAlert = () => { // This function is removed
  //   setShowAlert(false);
  //   dispatch({ type: "SET_STATUS", payload: null });
  // };

  const handleAuthClick = () => {
    setShowAuthDialog(true);
  };

  const handleCloseAuthDialog = () => {
    setShowAuthDialog(false);
  };

  const handleCustomRestoreModeChange = (checked: boolean) => {
    setCustomRestoreMode(checked);
    if (checked) {
      // Отключаем обычный restore mode
      dispatch({ type: "SET_RESTORE_MODE", payload: false });
    }
  };

  const handleRestoreModeChange = (checked: boolean) => {
    if (!customRestoreMode) {
      dispatch({ type: "SET_RESTORE_MODE", payload: checked });
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
          fileContent: fileContent
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
      console.error('Custom restore error:', error);
      dispatch({ type: "SET_STATUS", payload: `Custom restore failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoadingCustomRestore(false);
    }
  };

  const handleCustomMigrateModeChange = (checked: boolean) => {
    setCustomMigrateMode(checked);
    if (checked) {
      // Отключаем другие режимы
      dispatch({ type: "SET_RESTORE_MODE", payload: false });
      setCustomRestoreMode(false);
    }
    // Сброс состояния при отключении
    if (!checked) {
      setContentTypes([]);
      setSelectedContentTypes([]);
    }
  };

  const handleAnalyzeContentTypes = async () => {
    try {
      const result = await analyzeContentTypes();
      setContentTypes(result);
      // По умолчанию выбираем все content types
      setSelectedContentTypes(result.map(ct => ct.id));
    } catch (error) {
      console.error('Failed to analyze content types:', error);
    }
  };

  const handleContentTypeToggle = (contentTypeId: string) => {
    setSelectedContentTypes(prev => 
      prev.includes(contentTypeId) 
        ? prev.filter(id => id !== contentTypeId)
        : [...prev, contentTypeId]
    );
  };

  const handleCustomMigrate = async () => {
    try {
      await customMigrate(selectedContentTypes);
      // Сброс состояния после успешной миграции
      setCustomMigrateMode(false);
      setContentTypes([]);
      setSelectedContentTypes([]);
    } catch (error) {
      console.error('Failed to perform custom migration:', error);
    }
  };

  return (
    <Container 
      maxWidth="lg" 
      sx={{ 
        mt: 4, 
        mb: 4,
        filter: showAuthDialog ? 'blur(5px)' : 'none',
        transition: 'filter 0.3s ease',
      }}
    >
      <Box sx={{ mb: 4 }}>
        <ContentfulBrowserAuth />
        <Typography variant="body2" color="text.secondary">
          Auth Status: {isLoading ? 'Loading...' : (isLoggedIn ? 'Logged In' : 'Logged Out')}
        </Typography>
      </Box>

      <Typography variant="h4" component="h1" gutterBottom>
        Contentful Migration Tool
      </Typography>

      {isLoggedIn && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                Select Space
              </Typography>
              <SpaceSelector />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={!!state.restoreMode}
                    onChange={e => handleRestoreModeChange(e.target.checked)}
                    color="primary"
                    disabled={customRestoreMode || customMigrateMode}
                  />
                }
                label="Restore"
                sx={{ mt: 2 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={customRestoreMode}
                    onChange={e => handleCustomRestoreModeChange(e.target.checked)}
                    color="secondary"
                    disabled={customMigrateMode}
                  />
                }
                label="Custom Restore"
                sx={{ mt: 1 }}
              />
              <FormControlLabel
                control={
                  <Checkbox
                    checked={customMigrateMode}
                    onChange={e => handleCustomMigrateModeChange(e.target.checked)}
                    color="primary"
                  />
                }
                label="Custom Migrate"
                sx={{ mt: 1 }}
              />
            </Paper>
          </Grid>

          {state.spaceId && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, border: (state.restoreMode || customRestoreMode || customMigrateMode) ? '2px solid #1976d2' : undefined }}>
                <Typography variant="h6" gutterBottom>
                  Environments
                </Typography>
                <EnvironmentSelector 
                  environments={state.donorEnvironments} 
                  value={state.selectedDonor}
                  onChange={(env) => dispatch({ type: "SET_DATA", payload: { selectedDonor: env } })}
                  label="Source Environment"
                  disabled={!!state.restoreMode || customRestoreMode}
                />
                <Box sx={{ mt: 2 }} />
                <EnvironmentSelector 
                  environments={state.targetEnvironments} 
                  value={state.selectedTarget}
                  onChange={(env) => dispatch({ type: "SET_DATA", payload: { selectedTarget: env } })}
                  label="Target Environment"
                  disabled={false}
                />
                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    disabled={!state.selectedDonor || state.loading.loadingBackup || state.loading.loadingMigrate || state.restoreMode || customRestoreMode || loadingCustomRestore}
                    onClick={handleBackup}
                  >
                    {state.loading.loadingBackup ? <CircularProgress size={20} color="inherit" /> : 'Backup Source'}
                  </Button>
                  <Button 
                    variant="contained" 
                    color="secondary"
                    disabled={!state.selectedDonor || !state.selectedTarget || state.selectedDonor === state.selectedTarget || state.loading.loadingMigrate || state.restoreMode || customRestoreMode || loadingCustomRestore}
                    onClick={handleMigration}
                  >
                    {state.loading.loadingMigrate ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      'Migrate Content'
                    )}
                  </Button>
                </Box>

                {/* Custom Restore Section */}
                {customRestoreMode && (
                  <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#fafafa' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Custom Restore
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      ⚠️ This will completely replace the target environment with the selected file.
                    </Typography>
                    <FormControl fullWidth sx={{ mb: 2 }}>
                      <InputLabel htmlFor="file-input">Select Backup File</InputLabel>
                      <Input
                        id="file-input"
                        type="file"
                        inputProps={{ accept: '.json' }}
                        onChange={handleFileSelect}
                        disabled={loadingCustomRestore}
                      />
                    </FormControl>
                    {selectedFile && (
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        Selected: {selectedFile.name}
                      </Typography>
                    )}
                    <Button
                      variant="contained"
                      color="warning"
                      fullWidth
                      disabled={!selectedFile || !state.selectedTarget || loadingCustomRestore || state.selectedTarget === 'master'}
                      onClick={handleCustomRestore}
                    >
                      {loadingCustomRestore ? (
                        <CircularProgress size={20} color="inherit" />
                      ) : (
                        'Replace Environment & Import'
                      )}
                    </Button>
                  </Box>
                )}

                {/* Custom Migrate Section */}
                {customMigrateMode && (
                  <Box sx={{ mt: 3, p: 2, border: '1px solid #e0e0e0', borderRadius: 1, bgcolor: '#fafafa' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      Custom Migrate
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Select specific content types to migrate from source to target environment.
                    </Typography>
                    
                    {contentTypes.length === 0 ? (
                      <Button
                        variant="outlined"
                        fullWidth
                        onClick={handleAnalyzeContentTypes}
                        disabled={!state.selectedDonor || !state.selectedTarget || state.selectedDonor === state.selectedTarget || state.loading.loadingAnalyze}
                      >
                        {state.loading.loadingAnalyze ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          'Analyze Content Types'
                        )}
                      </Button>
                    ) : (
                      <>
                        <Box sx={{ maxHeight: 200, overflow: 'auto', mb: 2, p: 1, border: '1px solid #ddd', borderRadius: 1 }}>
                          {contentTypes.map((contentType) => (
                            <FormControlLabel
                              key={contentType.id}
                              control={
                                <Checkbox
                                  checked={selectedContentTypes.includes(contentType.id)}
                                  onChange={() => handleContentTypeToggle(contentType.id)}
                                  color="primary"
                                  size="small"
                                />
                              }
                              label={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <span>{contentType.name}</span>
                                  {contentType.isNew && (
                                    <Box component="span" sx={{ 
                                      bgcolor: 'success.main', 
                                      color: 'white', 
                                      px: 1, 
                                      py: 0.5, 
                                      borderRadius: 1, 
                                      fontSize: '0.75rem' 
                                    }}>
                                      NEW
                                    </Box>
                                  )}
                                  {contentType.isModified && (
                                    <Box component="span" sx={{ 
                                      bgcolor: 'warning.main', 
                                      color: 'white', 
                                      px: 1, 
                                      py: 0.5, 
                                      borderRadius: 1, 
                                      fontSize: '0.75rem' 
                                    }}>
                                      MODIFIED
                                    </Box>
                                  )}
                                  {contentType.hasNewContent && (
                                    <Box component="span" sx={{ 
                                      bgcolor: 'info.main', 
                                      color: 'white', 
                                      px: 1, 
                                      py: 0.5, 
                                      borderRadius: 1, 
                                      fontSize: '0.75rem' 
                                    }}>
                                      +{contentType.newContentCount} CONTENT
                                    </Box>
                                  )}
                                </Box>
                              }
                              sx={{ display: 'block', mb: 1 }}
                            />
                          ))}
                        </Box>
                        <Button
                          variant="contained"
                          color="primary"
                          fullWidth
                          onClick={handleCustomMigrate}
                          disabled={selectedContentTypes.length === 0 || state.loading.loadingCustomMigrate}
                        >
                          {state.loading.loadingCustomMigrate ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            `Migrate Selected (${selectedContentTypes.length})`
                          )}
                        </Button>
                      </>
                    )}
                  </Box>
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
                <BackupList />
              </Paper>
            </Grid>
          )}
        </Grid>
      )}

      <Dialog 
        open={showAuthDialog} 
        onClose={handleCloseAuthDialog}
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
              onClick={async () => {
                try {
                  // Получаем URL авторизации
                  const response = await fetch('/api/contentful-auth-browser', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ action: 'getAuthUrl' }),
                  });
                  
                  const data = await response.json();
                  
                  if (data.success && data.authUrl) {
                    // Открываем URL в новом окне
                    window.open(data.authUrl, '_blank');
                    
                    // Показываем инструкцию
                    dispatch({ 
                      type: "SET_STATUS", 
                      payload: "Please login in the opened Contentful window. After login, copy the token and paste it in the input field." 
                    });
                    
                    // Показываем поле для ввода токена
                    setShowTokenInput(true);
                  }
                } catch (error) {
                  console.error('Error getting auth URL:', error);
                  dispatch({ 
                    type: "SET_STATUS", 
                    payload: "Error getting auth URL. Please try again." 
                  });
                }
              }}
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
                onClick={async () => {
                  try {
                    // Сохраняем токен
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
                      // Обновляем статус авторизации
                      const authResponse = await fetch('/api/check-auth');
                      const authData = await authResponse.json();
                      // dispatch({ type: "SET_DATA", payload: { authStatus: authData } });
                      
                      if (authData.logged_in) {
                        handleCloseAuthDialog();
                        // Обновляем страницу для применения изменений
                        window.location.reload();
                      }
                    }
                  } catch (error) {
                    console.error('Error saving token:', error);
                  }
                }}
              >
                Save Token
              </Button>
            </Box>
          )}
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={handleCloseAuthDialog}>Close</Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Модальное окно с инструкциями по ошибкам */}
      <JsonLogDisplay
        open={state.errorModalOpen}
        onClose={() => dispatch({ type: "TOGGLE_ERROR_MODAL", payload: false })}
        onMinimize={() => dispatch({ type: "TOGGLE_ERROR_MODAL", payload: false })}
        errorMessage={state.lastErrorMessage || undefined}
        backupFileName={state.errorBackupFile || undefined}
      />

      {/* Модальное окно прогресса восстановления */}

    </Container>
  );
}
