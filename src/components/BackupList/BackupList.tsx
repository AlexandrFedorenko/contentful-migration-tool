import React, { useState, useMemo, useCallback } from 'react';
import Link from 'next/link';
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
  SelectChangeEvent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Divider,
  Radio
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import EditIcon from '@mui/icons-material/Edit';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useGlobalContext } from '@/context/GlobalContext';
import { useBackupDelete } from '@/hooks/useBackupDelete';
import { useBackupRename } from '@/hooks/useBackupRename';
import { useRestore } from '@/hooks/useRestore';
import ErrorInstructionsButton from '@/components/ErrorInstructionsButton/ErrorInstructionsButton';

const ITEMS_PER_PAGE = 15;

interface BackupListProps {
  selectedBackupForRestore?: string | null;
  onBackupSelect?: (name: string) => void;
}

export default function BackupList({ selectedBackupForRestore, onBackupSelect }: BackupListProps) {
  const { state, dispatch } = useGlobalContext();
  const { handleDelete } = useBackupDelete();
  const { handleRename } = useBackupRename();
  const { handleRestore } = useRestore();

  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(ITEMS_PER_PAGE);

  // Rename Dialog State
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedBackupForRename, setSelectedBackupForRename] = useState<{ name: string, path: string } | null>(null);
  const [newBackupName, setNewBackupName] = useState('');

  // Delete Dialog State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [backupToDelete, setBackupToDelete] = useState<{ name: string, path: string } | null>(null);

  const handleRenameClick = (backup: { name: string, path: string }) => {
    setSelectedBackupForRename(backup);
    setNewBackupName(backup.name.replace('.json', ''));
    setRenameDialogOpen(true);
  };

  const handleRenameSubmit = async () => {
    if (!selectedBackupForRename || !newBackupName.trim()) return;

    const success = await handleRename(
      state.spaceId,
      selectedBackupForRename.name,
      newBackupName.trim()
    );

    if (success) {
      setRenameDialogOpen(false);
      setSelectedBackupForRename(null);
      setNewBackupName('');
    }
  };

  const handleDeleteClick = (backup: { name: string, path: string }) => {
    setBackupToDelete(backup);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!backupToDelete) return;
    await handleDelete(state.spaceId, backupToDelete.name, backupToDelete.path);
    setDeleteDialogOpen(false);
    setBackupToDelete(null);
  };

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
    <List disablePadding>
      {backups.map((backup, index) => {
        const isRestoring = state.restoreProgress.isActive &&
          state.restoreProgress.restoringBackupName === backup.name;

        const isSelected = selectedBackupForRestore === backup.name;

        return (
          <React.Fragment key={backup.name}>
            <ListItem
              sx={{
                py: 1.5,
                transition: 'background-color 0.2s',
                '&:hover': {
                  backgroundColor: 'action.hover',
                },
                cursor: state.restoreMode ? 'pointer' : 'default',
                backgroundColor: isSelected ? 'action.selected' : 'inherit'
              }}
              onClick={() => {
                if (state.restoreMode && onBackupSelect) {
                  onBackupSelect(backup.name);
                }
              }}
            >
              {state.restoreMode && (
                <Radio
                  checked={isSelected}
                  onChange={() => onBackupSelect && onBackupSelect(backup.name)}
                  value={backup.name}
                  name="backup-radio-group"
                  inputProps={{ 'aria-label': backup.name }}
                  size="small"
                  sx={{ mr: 1 }}
                />
              )}
              <ListItemText
                primary={
                  <Box component="span" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography component="span" variant="body1" fontWeight={500}>
                      {backup.name}
                    </Typography>
                    {isRestoring && (
                      <CircularProgress size={16} />
                    )}
                  </Box>
                }
                secondary={
                  <Box component="span" sx={{ mt: 0.5, display: 'block' }}>
                    <Typography component="span" variant="caption" color="text.secondary" sx={{ fontFamily: 'monospace' }}>
                      {new Date(backup.time).toLocaleString()}
                    </Typography>
                    {isRestoring && (
                      <Typography component="span" variant="caption" color="primary" sx={{ display: 'block', mt: 0.5, fontWeight: 'bold' }}>
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
                  <Tooltip title="Preview Content" arrow>
                    <IconButton
                      edge="end"
                      aria-label="preview"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Use router.push to navigate in the same tab and preserve context
                        window.location.href = `/backup-preview/${backup.name}?spaceId=${state.spaceId}`;
                      }}
                      disabled={isRestoring}
                      size="small"
                      color="info"
                    >
                      <VisibilityIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Rename" arrow>
                    <IconButton
                      edge="end"
                      aria-label="rename"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRenameClick(backup);
                      }}
                      disabled={isRestoring}
                      size="small"
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                  {/* Restore button removed in favor of radio selection */}
                  <Tooltip title="Delete" arrow>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteClick(backup);
                      }}
                      disabled={isRestoring}
                      size="small"
                      color="error"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>
              </ListItemSecondaryAction>
            </ListItem>
            {index < backups.length - 1 && <Divider component="li" />}
          </React.Fragment>
        );
      })}
    </List>
  );

  return (
    <Box>
      {!state.restoreMode ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          Enable &quot;Restore&quot; mode to restore backups to a target environment.
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
        <FormControl size="small" sx={{ minWidth: 120 }} variant="outlined">
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

      <Dialog open={renameDialogOpen} onClose={() => setRenameDialogOpen(false)}>
        <DialogTitle>Rename Backup</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="New Backup Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newBackupName}
            onChange={(e) => setNewBackupName(e.target.value)}
            InputProps={{
              endAdornment: <Typography variant="caption" color="textSecondary">.json</Typography>
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRenameDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleRenameSubmit} variant="contained" color="primary">
            Rename
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
        aria-describedby="delete-dialog-description"
      >
        <DialogTitle id="delete-dialog-title">
          Delete Backup
        </DialogTitle>
        <DialogContent>
          <Typography id="delete-dialog-description">
            Are you sure you want to delete the backup <strong>{backupToDelete?.name}</strong>?
            <br />
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}