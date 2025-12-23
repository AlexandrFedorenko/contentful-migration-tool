import React, { useState, useMemo, useCallback } from 'react';
import { 
  List, 
  ListItem, 
  ListItemText, 
  ListItemSecondaryAction, 
  IconButton, 
  Typography, 
  Box, 
  Tooltip, 
  Alert, 
  CircularProgress,
  Pagination,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  SelectChangeEvent
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import { useGlobalContext } from '@/context/GlobalContext';
import { useBackupDelete } from '@/hooks/useBackupDelete';
import { useRestore } from '@/hooks/useRestore';
import ErrorInstructionsButton from '@/components/ErrorInstructionsButton/ErrorInstructionsButton';

const ITEMS_PER_PAGE = 15;

export default function BackupList() {
  const { state, dispatch } = useGlobalContext();
  const { handleDelete } = useBackupDelete();
  const { handleRestore } = useRestore();
  
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  const sortedBackups = useMemo(
    () => [...state.backups].sort((a, b) => b.time - a.time),
    [state.backups]
  );
  
  const totalPages = Math.ceil(sortedBackups.length / itemsPerPage);
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBackups = useMemo(
    () => sortedBackups.slice(startIndex, endIndex),
    [sortedBackups, startIndex, endIndex]
  );

  const handlePageChange = useCallback((event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  }, []);

  const handleItemsPerPageChange = useCallback((event: SelectChangeEvent) => {
    setItemsPerPage(Number(event.target.value));
    setPage(1);
  }, []);

  if (state.backups.length === 0) {
    return <Typography>No backups available</Typography>;
  }

  const renderBackupList = (backups: typeof currentBackups) => (
    <List>
      {backups.map((backup) => {
        const isRestoring = state.restoreProgress.isActive && 
                          state.restoreProgress.restoringBackupName === backup.name;
        
        return (
          <ListItem key={backup.name}>
            <ListItemText 
              primary={
                <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography component="span">{backup.name}</Typography>
                  {isRestoring && (
                    <CircularProgress size={16} />
                  )}
                </Box>
              }
              secondary={
                <Box component="span">
                  <Typography component="span" variant="body2" color="text.secondary">
                    {new Date(backup.time).toLocaleString()}
                  </Typography>
                  {isRestoring && (
                    <Typography component="span" variant="caption" color="primary" sx={{ display: 'block', mt: 0.5 }}>
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
                {state.restoreMode && (
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
                )}
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
  );

  return (
    <Box>
      {!state.restoreMode ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Enable "Restore" mode to restore backups to a target environment.
        </Alert>
      ) : (
        <Alert severity="info" sx={{ mb: 2 }}>
          Restore mode is active. Select a target environment to restore backups.
        </Alert>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {startIndex + 1}-{Math.min(endIndex, sortedBackups.length)} of {sortedBackups.length} backups
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Per page</InputLabel>
          <Select
            value={itemsPerPage.toString()}
            label="Per page"
            onChange={handleItemsPerPageChange}
          >
            <MenuItem value="10">10</MenuItem>
            <MenuItem value="15">15</MenuItem>
            <MenuItem value="25">25</MenuItem>
            <MenuItem value="50">50</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {renderBackupList(currentBackups)}

      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination 
            count={totalPages} 
            page={page} 
            onChange={handlePageChange}
            color="primary"
            showFirstButton 
            showLastButton
          />
        </Box>
      )}
    </Box>
  );
} 