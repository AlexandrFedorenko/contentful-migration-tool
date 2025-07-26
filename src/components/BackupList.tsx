import React from 'react';
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography, Box, Tooltip, Alert, CircularProgress } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import { useGlobalContext } from '@/context/GlobalContext';
import { useBackupDelete } from '@/hooks/useBackupDelete';
import { useRestore } from '@/hooks/useRestore';
import ErrorInstructionsButton from './ErrorInstructionsButton';

export default function BackupList() {
  const { state, dispatch } = useGlobalContext();
  const { handleDelete } = useBackupDelete();
  const { handleRestore } = useRestore();

  if (state.backups.length === 0) {
    return <Typography>No backups available</Typography>;
  }

  if (!state.restoreMode) {
    return (
      <Box>
        <Alert severity="info" sx={{ mb: 2 }}>
          Enable "Restore" mode to restore backups to a target environment.
        </Alert>
        <List>
          {state.backups.map((backup) => (
            <ListItem key={backup.name}>
              <ListItemText 
                primary={backup.name} 
                secondary={new Date(backup.time).toLocaleString()} 
              />
              <ListItemSecondaryAction>
                <Tooltip title="Delete" arrow>
                  <IconButton 
                    edge="end" 
                    aria-label="delete"
                    onClick={() => handleDelete(state.spaceId, backup.name, backup.path)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Tooltip>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Box>
    );
  }

  return (
    <Box>
      <Alert severity="info" sx={{ mb: 2 }}>
        Restore mode is active. Select a target environment to restore backups.
      </Alert>
      <List>
        {state.backups.map((backup) => {
          const isRestoring = state.restoreProgress.isActive && 
                                        state.restoreProgress.restoringBackupName === backup.name;
          
          return (
            <ListItem key={backup.name}>
              <ListItemText 
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography>{backup.name}</Typography>
                    {isRestoring && (
                      <CircularProgress size={16} />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {new Date(backup.time).toLocaleString()}
                    </Typography>
                    {isRestoring && (
                      <Typography variant="caption" color="primary">
                        Restoring...
                      </Typography>
                    )}
                  </Box>
                }
              />
              <ListItemSecondaryAction>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {state.errorInstruction && state.errorBackupFile === backup.name && (
                    <ErrorInstructionsButton
                      instruction={state.errorInstruction}
                      onClick={() => dispatch({ type: "TOGGLE_ERROR_MODAL", payload: true })}
                      disabled={false}
                    />
                  )}
                  <Tooltip title="Restore to target environment" arrow>
                    <IconButton 
                      edge="end" 
                      aria-label="restore"
                      onClick={() => {
                        if (!state.selectedTarget) {
                          dispatch({ type: "SET_STATUS", payload: "Please select a target environment for restore." });
                          return;
                        }
                        handleRestore(backup.name);
                      }}
                      disabled={!state.selectedTarget || isRestoring}
                    >
                      <RestoreIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Delete" arrow>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleDelete(state.spaceId, backup.name, backup.path)}
                      disabled={isRestoring}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
} 