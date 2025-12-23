import React, { useEffect, useState } from 'react';
import { Container, Typography, Box, Paper, Grid, Button, CircularProgress, Accordion, AccordionSummary, AccordionDetails, FormControlLabel, Checkbox } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EnvironmentSelector from '@/components/EnvironmentSelector/EnvironmentSelector';
import BackupList from '@/components/BackupList/BackupList';
import { useGlobalContext } from '@/context/GlobalContext';
import { useEnvironments } from '@/hooks/useEnvironments';
import { useBackups } from '@/hooks/useBackups';
import { useBackup } from '@/hooks/useBackup';
import { useMigration } from '@/hooks/useMigration';
import { useCustomMigrate } from '@/hooks/useCustomMigrate';
import ContentfulBrowserAuth from '@/components/ContentfulBrowserAuth/ContentfulBrowserAuth';
import { useAuth } from '@/context/AuthContext';
import JsonLogDisplay from '@/components/JsonLogDisplay/JsonLogDisplay';
import AuthDialog from '@/components/AuthDialog/AuthDialog';
import SpaceSelectorSection from '@/components/SpaceSelectorSection/SpaceSelectorSection';
import CustomRestoreSection from '@/components/CustomRestoreSection/CustomRestoreSection';
import { ContentType } from '@/components/CustomMigrateSection/types';


export default function Home() {
  const { state, dispatch } = useGlobalContext();
  const { loadEnvironments } = useEnvironments();
  const { loadBackups } = useBackups();
  const { handleBackup } = useBackup();
  const { handleMigration } = useMigration();
  const { analyzeContentTypes, customMigrate } = useCustomMigrate();
  const { isLoggedIn, isLoading } = useAuth();

  const [showAuthDialog, setShowAuthDialog] = useState<boolean>(false);
  const [customRestoreMode, setCustomRestoreMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loadingCustomRestore, setLoadingCustomRestore] = useState(false);
  const [customMigrateMode, setCustomMigrateMode] = useState(false);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [selectedContentTypes, setSelectedContentTypes] = useState<string[]>([]);
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

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
      dispatch({ type: "SET_STATUS", payload: `Custom restore failed: ${error instanceof Error ? error.message : 'Unknown error'}` });
    } finally {
      setLoadingCustomRestore(false);
    }
  };

  const handleCustomMigrateModeChange = (checked: boolean) => {
    setCustomMigrateMode(checked);
    if (checked) {
      dispatch({ type: "SET_RESTORE_MODE", payload: false });
      setCustomRestoreMode(false);
    }
    if (!checked) {
      setContentTypes([]);
      setSelectedContentTypes([]);
    }
  };

  const handleAnalyzeContentTypes = async () => {
    try {
      const result = await analyzeContentTypes();
      setContentTypes(result);
      setSelectedContentTypes(result.map(ct => ct.id));
    } catch {
    }
  };

  const handleContentTypeToggle = (contentTypeId: string) => {
    setSelectedContentTypes(prev => 
      prev.includes(contentTypeId) 
        ? prev.filter(id => id !== contentTypeId)
        : [...prev, contentTypeId]
    );
  };

  const handleEntryToggle = (contentTypeId: string, entryId: string) => {
    setSelectedEntries(prev => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      
      const contentType = contentTypes.find(ct => ct.id === contentTypeId);
      if (contentType) {
        const allEntries = [
          ...(contentType.newEntries || []),
          ...(contentType.modifiedEntries || [])
        ];
        const selectedEntriesForType = allEntries.filter(e => newSet.has(e.id));
        
        if (selectedEntriesForType.length > 0 && !selectedContentTypes.includes(contentTypeId)) {
          setSelectedContentTypes(prev => [...prev, contentTypeId]);
        }
      }
      
      return newSet;
    });
  };

  const handleCustomMigrate = async () => {
    try {
      await customMigrate(selectedContentTypes);
      setCustomMigrateMode(false);
      setContentTypes([]);
      setSelectedContentTypes([]);
    } catch {
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
          <Box sx={{ mb: 2 }}>
            <ContentfulBrowserAuth />
          </Box>
        </>
      )}

      {isLoggedIn && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <SpaceSelectorSection
              state={state}
              onRestoreModeChange={handleRestoreModeChange}
              onCustomRestoreModeChange={handleCustomRestoreModeChange}
              onCustomMigrateModeChange={handleCustomMigrateModeChange}
              customRestoreMode={customRestoreMode}
              customMigrateMode={customMigrateMode}
            />
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
                    disabled={
                      !state.selectedDonor ||
                      state.loading.loadingBackup ||
                      state.loading.loadingMigration ||
                      state.restoreMode ||
                      customRestoreMode ||
                      loadingCustomRestore
                    }
                    onClick={handleBackup}
                  >
                    {state.loading.loadingBackup ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      'Backup Source'
                    )}
                  </Button>
                  <Button 
                    variant="contained" 
                    color="secondary"
                    disabled={
                      !state.selectedDonor ||
                      !state.selectedTarget ||
                      state.selectedDonor === state.selectedTarget ||
                      state.loading.loadingMigration ||
                      state.restoreMode ||
                      customRestoreMode ||
                      loadingCustomRestore
                    }
                    onClick={handleMigration}
                  >
                    {state.loading.loadingMigration ? (
                      <CircularProgress size={20} color="inherit" />
                    ) : (
                      'Migrate Content'
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
                        <Box sx={{ maxHeight: 500, overflow: 'auto', mb: 2 }}>
                          {contentTypes.map((contentType) => {
                            const allEntries = [
                              ...(contentType.newEntries || []),
                              ...(contentType.modifiedEntries || [])
                            ];
                            const selectedEntriesForType = allEntries.filter(e => selectedEntries.has(e.id));
                            
                            return (
                              <Accordion key={contentType.id} sx={{ mb: 1 }}>
                                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                                  <FormControlLabel
                                    onClick={(e) => e.stopPropagation()}
                                    control={
                                      <Checkbox
                                        checked={selectedContentTypes.includes(contentType.id)}
                                        onChange={() => handleContentTypeToggle(contentType.id)}
                                        color="primary"
                                        size="small"
                                      />
                                    }
                                    label={
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: 1, 
                                        overflowX: 'auto',
                                        width: '100%',
                                        '&::-webkit-scrollbar': {
                                          height: '4px',
                                        },
                                        '&::-webkit-scrollbar-thumb': {
                                          backgroundColor: '#ccc',
                                          borderRadius: '2px',
                                        }
                                      }}>
                                        <Typography variant="body1" fontWeight="medium" sx={{ whiteSpace: 'nowrap' }}>
                                          {contentType.name}
                                        </Typography>
                                        {contentType.isNew && (
                                          <Box component="span" sx={{ 
                                            bgcolor: 'success.main', 
                                            color: 'white', 
                                            px: 1, 
                                            py: 0.5, 
                                            borderRadius: 1, 
                                            fontSize: '0.75rem',
                                            whiteSpace: 'nowrap'
                                          }}>
                                            NEW MODEL
                                          </Box>
                                        )}
                                        {contentType.isModified && (
                                          <Box component="span" sx={{ 
                                            bgcolor: 'warning.main', 
                                            color: 'white', 
                                            px: 1, 
                                            py: 0.5, 
                                            borderRadius: 1, 
                                            fontSize: '0.75rem',
                                            whiteSpace: 'nowrap'
                                          }}>
                                            MODEL MODIFIED
                                          </Box>
                                        )}
                                        {allEntries.length > 0 && (
                                          <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                            ({allEntries.length} entries)
                                          </Typography>
                                        )}
                                      </Box>
                                    }
                                  />
                                </AccordionSummary>
                                <AccordionDetails>
                                 
                                  {(contentType.newEntries && contentType.newEntries.length > 0) && (
                                    <Box sx={{ mb: 2 }}>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 'medium' }}>
                                        New Content ({contentType.newEntries.length}):
                                      </Typography>
                                      <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: 0.5,
                                        maxHeight: 200,
                                        overflowY: 'auto'
                                      }}>
                                        {contentType.newEntries.map((entry: { id: string; title?: string }) => (
                                          <FormControlLabel
                                            key={entry.id}
                                            control={
                                              <Checkbox
                                                checked={selectedEntries.has(entry.id)}
                                                onChange={() => handleEntryToggle(contentType.id, entry.id)}
                                                color="primary"
                                                size="small"
                                              />
                                            }
                                            label={
                                              <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 0.5,
                                                overflowX: 'auto',
                                                width: '100%',
                                                '&::-webkit-scrollbar': {
                                                  height: '4px',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                  backgroundColor: '#ccc',
                                                  borderRadius: '2px',
                                                }
                                              }}>
                                                <Box component="span" sx={{ fontSize: '0.7rem', color: 'success.dark' }}>•</Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                  {entry.title || entry.id}
                                                </Typography>
                                              </Box>
                                            }
                                            sx={{ m: 0 }}
                                          />
                                        ))}
                                      </Box>
                                    </Box>
                                  )}
                                  
                        
                                  {(contentType.modifiedEntries && contentType.modifiedEntries.length > 0) && (
                                    <Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1, fontWeight: 'medium' }}>
                                        Modified Content ({contentType.modifiedEntries.length}):
                                      </Typography>
                                      <Box sx={{ 
                                        display: 'flex', 
                                        flexDirection: 'column', 
                                        gap: 0.5,
                                        maxHeight: 200,
                                        overflowY: 'auto'
                                      }}>
                                        {contentType.modifiedEntries.map((entry: { id: string; title?: string }) => (
                                          <FormControlLabel
                                            key={entry.id}
                                            control={
                                              <Checkbox
                                                checked={selectedEntries.has(entry.id)}
                                                onChange={() => handleEntryToggle(contentType.id, entry.id)}
                                                color="primary"
                                                size="small"
                                              />
                                            }
                                            label={
                                              <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 0.5,
                                                overflowX: 'auto',
                                                width: '100%',
                                                '&::-webkit-scrollbar': {
                                                  height: '4px',
                                                },
                                                '&::-webkit-scrollbar-thumb': {
                                                  backgroundColor: '#ccc',
                                                  borderRadius: '2px',
                                                }
                                              }}>
                                                <Box component="span" sx={{ fontSize: '0.7rem', color: 'warning.dark' }}>•</Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
                                                  {entry.title || entry.id}
                                                </Typography>
                                              </Box>
                                            }
                                            sx={{ m: 0 }}
                                          />
                                        ))}
                                      </Box>
                                    </Box>
                                  )}
                                  
                                  {(!contentType.newEntries || contentType.newEntries.length === 0) && 
                                   (!contentType.modifiedEntries || contentType.modifiedEntries.length === 0) && 
                                   (contentType.isNew || contentType.isModified) && (
                                    <Box>
                                      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem', fontStyle: 'italic' }}>
                                        No content changes (only model structure)
                                      </Typography>
                                    </Box>
                                  )}
                                </AccordionDetails>
                              </Accordion>
                            );
                          })}
                        </Box>
                        <Box sx={{ display: 'flex', gap: 2 }}>
                          <Button
                            variant="outlined"
                            color="secondary"
                            fullWidth
                            onClick={() => {
                              setContentTypes([]);
                              setSelectedContentTypes([]);
                              setSelectedEntries(new Set());
                            }}
                            disabled={state.loading.loadingCustomMigrate || state.loading.loadingAnalyze}
                          >
                            Cancel Analysis
                          </Button>
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
                        </Box>
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

    </Container>
  );
}
