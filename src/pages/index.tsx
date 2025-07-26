import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Grid, Button, Dialog, DialogTitle, DialogContent, TextField, CircularProgress, Checkbox, FormControlLabel } from '@mui/material';
import SpaceSelector from '@/components/SpaceSelector';
import EnvironmentSelector from '@/components/EnvironmentSelector';
import BackupList from '@/components/BackupList';
import { useGlobalContext } from '@/context/GlobalContext';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useBackups } from '@/hooks/useBackups';
import { useBackup } from '@/hooks/useBackup';
import { useMigration } from '@/hooks/useMigration';
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
  const { isLoggedIn, isLoading } = useAuth();

  const [showAuthDialog, setShowAuthDialog] = useState<boolean>(false);
  const [showTokenInput, setShowTokenInput] = useState(false);
  const [token, setToken] = useState('');

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
                    onChange={e => dispatch({ type: "SET_RESTORE_MODE", payload: e.target.checked })}
                    color="primary"
                  />
                }
                label="Restore"
                sx={{ mt: 2 }}
              />
            </Paper>
          </Grid>

          {state.spaceId && (
            <Grid item xs={12} md={6}>
              <Paper sx={{ p: 2, border: state.restoreMode ? '2px solid #1976d2' : undefined }}>
                <Typography variant="h6" gutterBottom>
                  Environments
                </Typography>
                <EnvironmentSelector 
                  environments={state.donorEnvironments} 
                  value={state.selectedDonor}
                  onChange={(env) => dispatch({ type: "SET_DATA", payload: { selectedDonor: env } })}
                  label="Source Environment"
                  disabled={!!state.restoreMode}
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
                    disabled={!state.selectedDonor || state.loading.loadingBackup || state.restoreMode}
                    onClick={handleBackup}
                  >
                    {state.loading.loadingBackup ? <CircularProgress size={20} color="inherit" /> : 'Backup Source'}
                  </Button>
                  <Button 
                    variant="contained" 
                    color="secondary"
                    disabled={!state.selectedDonor || !state.selectedTarget || state.selectedDonor === state.selectedTarget || state.loading.loadingMigrate || state.restoreMode}
                    onClick={handleMigration}
                    startIcon={state.loading.loadingMigrate ? <CircularProgress size={20} color="inherit" /> : null}
                  >
                    {state.loading.loadingMigrate ? 'Migrating...' : 'Migrate Content'}
                  </Button>
                </Box>
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
