import React from 'react';
import { List, ListItem, ListItemText, ListItemSecondaryAction, IconButton, Typography, Box, Tooltip } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import RestoreIcon from '@mui/icons-material/Restore';
import { useGlobalContext } from '@/context/GlobalContext';
import { useBackupDelete } from '@/hooks/useBackupDelete';
import { useRestore } from '@/hooks/useRestore';

export default function BackupList() {
  const { state, dispatch } = useGlobalContext();
  const { handleDelete } = useBackupDelete();
  const { handleRestore } = useRestore();

  if (state.backups.length === 0) {
    return <Typography>No backups available</Typography>;
  }

  return (
    <List>
      {state.backups.map((backup) => (
        <ListItem key={backup.name}>
          <ListItemText 
            primary={backup.name} 
            secondary={new Date(backup.time).toLocaleString()} 
          />
          <ListItemSecondaryAction>
            <Box>
              <Tooltip title="Restore to target environment" arrow>
                <IconButton 
                  edge="end" 
                  aria-label="restore"
                  onClick={() => {
                    dispatch({ type: "SET_DATA", payload: { selectedBackup: backup.name } });
                    handleRestore();
                  }}
                >
                  <RestoreIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Delete" arrow>
                <IconButton 
                  edge="end" 
                  aria-label="delete"
                  onClick={() => handleDelete(state.spaceId, backup.name, backup.path)}
                >
                  <DeleteIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </ListItemSecondaryAction>
        </ListItem>
      ))}
    </List>
  );
} 