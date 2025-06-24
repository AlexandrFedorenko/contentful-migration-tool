import React from 'react';
import { Box, FormControl, InputLabel, Select, MenuItem, Typography, CircularProgress, SelectChangeEvent } from '@mui/material';
import { useSpaces } from '@/hooks/useSpaces';
import { useGlobalContext } from '@/context/GlobalContext';
import { useAuth } from '@/context/AuthContext';

const SpaceSelector: React.FC = () => {
  const { state, dispatch } = useGlobalContext();
  const { spaces, loading, error } = useSpaces();
  const { isLoggedIn } = useAuth();
  
  const handleChange = (event: SelectChangeEvent<string>) => {
    const spaceId = event.target.value as string;
    dispatch({ type: 'SET_SPACE_ID', payload: spaceId });
    
    // Сбрасываем выбранные окружения при смене пространства
    dispatch({ type: 'SET_SOURCE_ENV', payload: '' });
    dispatch({ type: 'SET_TARGET_ENV', payload: '' });
  };
  
  // Если пользователь не авторизован, не показываем селектор
  if (!isLoggedIn) {
    return null;
  }
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography>Loading spaces...</Typography>
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography color="error">
          Error loading spaces: {error}
        </Typography>
      </Box>
    );
  }
  
  if (spaces.length === 0) {
    return (
      <Box sx={{ mb: 3 }}>
        <Typography>
          No spaces found. Please make sure you have access to at least one space.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mb: 3 }}>
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
            <MenuItem key={space.sys.id} value={space.sys.id}>
              {space.name} ({space.sys.id})
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default SpaceSelector; 