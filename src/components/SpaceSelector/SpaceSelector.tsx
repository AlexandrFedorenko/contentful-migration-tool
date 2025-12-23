import React, { useCallback } from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, CircularProgress, SelectChangeEvent } from '@mui/material';
import { useSpaces } from '@/hooks/useSpaces';
import { useGlobalContext } from '@/context/GlobalContext';
import { useAuth } from '@/context/AuthContext';
import styles from './SpaceSelector.module.css';

const SpaceSelector = React.memo(() => {
  const { state, dispatch } = useGlobalContext();
  const { spaces, loading, error } = useSpaces();
  const { isLoggedIn } = useAuth();
  
  const handleChange = useCallback((event: SelectChangeEvent<string>) => {
    const spaceId = event.target.value as string;
    dispatch({ type: 'SET_SPACE_ID', payload: spaceId });
    dispatch({ type: 'SET_SOURCE_ENV', payload: '' });
    dispatch({ type: 'SET_TARGET_ENV', payload: '' });
  }, [dispatch]);
  
  if (!isLoggedIn) {
    return null;
  }
  
  if (loading) {
    return (
      <Box className={styles.loadingContainer}>
        <CircularProgress size={24} className={styles.loadingSpinner} />
        <Typography>Loading spaces...</Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box className={styles.errorContainer}>
        <Typography color="error">
          Error loading spaces: {error}
        </Typography>
      </Box>
    );
  }
  
  if (spaces.length === 0) {
    return (
      <Box className={styles.emptyContainer}>
        <Typography>
          No spaces found. Please make sure you have access to at least one space.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box className={styles.container}>
      <FormControl fullWidth>
        <InputLabel id="space-selector-label">Select Space</InputLabel>
        <Select
          labelId="space-selector-label"
          id="space-selector"
          value={state.spaceId || ''}
          label="Select Space"
          onChange={handleChange}
        >
          <MenuItem value="">
            <em>Select a space</em>
          </MenuItem>
          {spaces.map((space) => (
            <MenuItem key={space.id} value={space.id}>
              {space.name} ({space.id})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
});

SpaceSelector.displayName = 'SpaceSelector';

export default SpaceSelector; 